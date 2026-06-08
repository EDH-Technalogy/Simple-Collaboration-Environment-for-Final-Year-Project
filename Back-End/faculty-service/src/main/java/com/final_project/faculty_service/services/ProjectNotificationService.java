package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.UserDto;
import com.final_project.faculty_service.DTO.request.SendNotificationRequest;
import com.final_project.faculty_service.models.Project;
import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.Teacher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class ProjectNotificationService {
    private static final String CUSTOM_TYPE = "CUSTOM";
    private static final String IN_APP_CHANNEL = "IN_APP";
    private static final String PROJECT_REFERENCE = "FACULTY_PROJECT";

    private final AuthService authService;
    private final WebClient notificationServiceClient;

    public ProjectNotificationService(
            AuthService authService,
            @Qualifier("notificationServiceClient") WebClient notificationServiceClient
    ) {
        this.authService = authService;
        this.notificationServiceClient = notificationServiceClient;
    }

    public void notifyAdminsProjectCompleted(Project project) {
        List<UserDto> admins;
        try {
            admins = authService.getAdminUsers();
        } catch (Exception ex) {
            log.warn("Could not load admin recipients for completed project {}", project.getId(), ex);
            return;
        }

        if (admins == null || admins.isEmpty()) {
            log.warn("No admin recipients found for completed project {}", project.getId());
            return;
        }

        String teacherName = displayName(project.getTeacher());
        for (UserDto admin : admins) {
            if (isBlank(admin.getId()) || isBlank(admin.getEmail())) continue;
            sendSafely(SendNotificationRequest.builder()
                    .recipientUserId(admin.getId())
                    .recipientEmail(admin.getEmail())
                    .recipientName(displayName(admin))
                    .type(CUSTOM_TYPE)
                    .channel(IN_APP_CHANNEL)
                    .subject("Project completed: " + projectName(project))
                    .body("Teacher " + teacherName + " marked \"" + projectName(project)
                            + "\" as completed. It is ready for admin review and publishing.")
                    .referenceId(project.getId())
                    .referenceType(PROJECT_REFERENCE)
                    .idempotencyKey("faculty-project-completed-" + project.getId() + "-" + admin.getId())
                    .build());
        }
    }

    public void notifyStudentsProjectPublished(Project project) {
        if (project.getGroup() == null || project.getGroup().getGroupMembers() == null) {
            return;
        }

        project.getGroup().getGroupMembers().stream()
                .filter(Objects::nonNull)
                .filter(student -> !isBlank(student.getKeycloakId()) && !isBlank(student.getEmail()))
                .forEach(student -> sendSafely(SendNotificationRequest.builder()
                        .recipientUserId(student.getKeycloakId())
                        .recipientEmail(student.getEmail())
                        .recipientName(displayName(student))
                        .type(CUSTOM_TYPE)
                        .channel(IN_APP_CHANNEL)
                        .subject("Congratulations, your project has been published")
                        .body("Congratulations! Your project \"" + projectName(project)
                                + "\" has been approved and published for readers.")
                        .referenceId(project.getId())
                        .referenceType(PROJECT_REFERENCE)
                        .idempotencyKey("faculty-project-published-" + project.getId() + "-" + student.getKeycloakId())
                        .build()));
    }

    private void sendSafely(SendNotificationRequest request) {
        try {
            notificationServiceClient.post()
                    .uri("/api/v1/notifications")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> Mono.error(new RuntimeException(body)))
                    )
                    .toBodilessEntity()
                    .block();
        } catch (Exception ex) {
            log.warn("Could not send project notification {} to {}",
                    request.getIdempotencyKey(),
                    request.getRecipientUserId(),
                    ex);
        }
    }

    private String projectName(Project project) {
        return !isBlank(project.getProjectName()) ? project.getProjectName() : "project";
    }

    private String displayName(Teacher teacher) {
        if (teacher == null) return "the teacher";
        String name = joinName(teacher.getFirstName(), teacher.getLastName());
        return !isBlank(name) ? name : "the teacher";
    }

    private String displayName(Student student) {
        String name = joinName(student.getFirstName(), student.getLastName());
        return !isBlank(name) ? name : student.getEmail();
    }

    private String displayName(UserDto user) {
        String name = joinName(user.getFirstName(), user.getLastName());
        if (!isBlank(name)) return name;
        if (!isBlank(user.getUsername())) return user.getUsername();
        return user.getEmail();
    }

    private String joinName(String first, String last) {
        return ((first == null ? "" : first.trim()) + " " + (last == null ? "" : last.trim())).trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

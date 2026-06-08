package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.model.RepositoryEventType;
import com.final_project.versioncontrolservice.model.RepositoryMemberRecipient;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskDeadlineReminderScheduler {

    private final TaskRepository taskRepository;
    private final KafkaProducer kafkaProducer;
    private final AppProperties appProperties;

    @Scheduled(fixedDelayString = "${app.task.deadline-reminders.fixed-delay:PT1H}", initialDelayString = "${app.task.deadline-reminders.initial-delay:PT2M}")
    public void publishDeadlineReminderEvents() {
        Instant now = Instant.now();
        Instant upperBound = now.plus(Duration.ofDays(2));
        List<Task> candidates = taskRepository.findDeadlineReminderCandidates(now, upperBound);
        if (candidates.isEmpty()) {
            log.debug("No task deadline reminder candidates found.");
            return;
        }

        for (Task task : candidates) {
            try {
                publishReminder(task, now);
            } catch (Exception ex) {
                log.error("Failed to publish deadline reminder for taskId={}", task.getId(), ex);
            }
        }
    }

    private void publishReminder(Task task, Instant now) {
        MilestoneTaskUser assignee = task.getAssignedTo();
        if (assignee == null || isBlank(assignee.getUserId()) || isBlank(assignee.getEmail())) {
            return;
        }
        long hoursRemaining = Math.max(1, Duration.between(now, task.getDueDate()).toHours());
        int reminderDay = hoursRemaining <= 24 ? 1 : 2;
        String owner = task.getRepoOwner() == null ? "" : task.getRepoOwner().getUserName();
        String repo = task.getRepoName();
        String eventId = "task-deadline-reminder:%s:%s:%s".formatted(
                task.getId(),
                reminderDay,
                LocalDate.ofInstant(task.getDueDate(), ZoneOffset.UTC)
        );

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actionType", "TASK_DEADLINE_REMINDER");
        metadata.put("taskId", task.getId());
        metadata.put("taskNumber", task.getNumber());
        metadata.put("taskTitle", task.getTitle());
        metadata.put("taskStatus", task.getStatus() == null ? null : task.getStatus().getStatus());
        metadata.put("repositoryOwner", owner);
        metadata.put("repositoryName", repo);
        metadata.put("dueDate", task.getDueDate().toString());
        metadata.put("daysRemaining", reminderDay);
        metadata.put("hoursRemaining", hoursRemaining);
        metadata.put("message", "Task #%s is due in %s day%s: %s".formatted(
                task.getNumber(),
                reminderDay,
                reminderDay == 1 ? "" : "s",
                task.getTitle()
        ));
        metadata.put("uiPath", "/repository/" + owner + "/" + repo + "/tasks/issue/" + task.getNumber());

        kafkaProducer.produce(
                RepositoryOperationEvent.builder()
                        .eventId(eventId)
                        .eventType(RepositoryEventType.TASK_DEADLINE_REMINDER)
                        .repositoryName(repo)
                        .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo))
                        .actorUserId(assignee.getUserId())
                        .actorName(assignee.getUserName())
                        .actorEmail(assignee.getEmail())
                        .ownerUserId(task.getRepoOwner() == null ? null : task.getRepoOwner().getUserId())
                        .ownerName(owner)
                        .ownerEmail(task.getRepoOwner() == null ? null : task.getRepoOwner().getEmail())
                        .recipients(List.of(RepositoryMemberRecipient.builder()
                                .userId(assignee.getUserId())
                                .name(assignee.getUserName())
                                .email(assignee.getEmail())
                                .role("ASSIGNEE")
                                .build()))
                        .occurredAt(LocalDateTime.now())
                        .metadata(metadata)
                        .build()
        );
    }

    private String buildGatewayUrl(String path) {
        String base = appProperties.getGatewayBaseUrl() == null
                ? "http://localhost:8080"
                : appProperties.getGatewayBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return path.startsWith("/") ? base + path : base + "/" + path;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

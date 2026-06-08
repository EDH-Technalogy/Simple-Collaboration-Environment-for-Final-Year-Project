package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.ProjectRequest;
import com.final_project.faculty_service.DTO.response.*;
import com.final_project.faculty_service.models.Group;
import com.final_project.faculty_service.models.Project;
import com.final_project.faculty_service.models.ProjectStatus;
import com.final_project.faculty_service.models.Teacher;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ProjectMapper implements BaseMapper<ProjectRequest, ProjectResponse, Project> {
    @Override
    public Project toEntity(ProjectRequest request) {
        Project project = new Project();

        project.setProjectName(request.getProjectName());
        Teacher teacher =  new Teacher();
        teacher.setId(request.getTeacher());
        project.setTeacher(teacher);

        Group group = new Group();
        group.setId(request.getGroup());
        project.setGroup(group);
        project.setStatus(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNED);
        project.setProgress(request.getProgress() != null ? request.getProgress() : 0);
        project.setCompletion(request.getCompletion() != null ? request.getCompletion() : 0);
        project.setPublished(Boolean.TRUE.equals(request.getPublished()));
        if (project.isPublished()) {
            project.setPublishedAt(LocalDateTime.now());
        }

        return project;
    }

    @Override
    public ProjectResponse toResponse(Project entity) {
        ProjectResponse projectResponse = new ProjectResponse();
        projectResponse.setId(entity.getId());
        projectResponse.setProjectName(entity.getProjectName());
        projectResponse.setProjectRepository(entity.getProjectRepository());
        projectResponse.setAbstractText(entity.getAbstractText());
        projectResponse.setFinalFileName(entity.getFinalFileName());
        projectResponse.setFinalFileDownloadUrl(entity.getFinalFileDownloadUrl());
        projectResponse.setStatus(entity.getStatus());
        projectResponse.setProgress(entity.getProgress());
        projectResponse.setCompletion(entity.getCompletion());
        projectResponse.setPublished(entity.isPublished());
        projectResponse.setPublishedAt(entity.getPublishedAt());
        projectResponse.setGroup(
                GroupResponse
                        .builder()
                        .id(entity.getGroup().getId())
                        .name(entity.getGroup().getName())
                        .groupLeader(new StudentResponseGroupResponse(
                                entity.getGroup().getGroupLeader().getId(),
                                entity.getGroup().getGroupLeader().getFirstName(),
                                entity.getGroup().getGroupLeader().getLastName(),
                                entity.getGroup().getGroupLeader().getCode(),
                                        entity.getGroup().getGroupLeader().getEmail(),
                                entity.getGroup().getGroupLeader().getPhone(),
                                entity.getGroup().getGroupLeader().getKankorId(),
                                entity.getGroup().getGroupLeader().getProfilePicture(),
                                new SemesterGroupResponse(
                                        new AcademicYearGroupResponse(
                                                entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getName(),
                                                entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getStartDate(),
                                                entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getEndDate()
                                        ),
                                        entity.getGroup().getGroupLeader().getSemester().getType(),
                                        entity.getGroup().getGroupLeader().getSemester().getName(),
                                        entity.getGroup().getGroupLeader().getSemester().getStartDate(),
                                        entity.getGroup().getGroupLeader().getSemester().getEndDate(),
                                        entity.getGroup().getGroupLeader().getSemester().getCode()
                                ),
                                new DepartmentGroupResponse(
                                        entity.getGroup().getGroupLeader().getDepartment().getId(),
                                        entity.getGroup().getGroupLeader().getDepartment().getName(),
                                        entity.getGroup().getGroupLeader().getDepartment().getField(),
                                        entity.getGroup().getGroupLeader().getDepartment().getCode(),
                                        entity.getGroup().getGroupLeader().getDepartment().getEmail(),
                                        entity.getGroup().getGroupLeader().getDepartment().getPhone()
                                ),
                                entity.getGroup().getGroupLeader().getStatus(),

                                new BatchGroupResponse(
                                        entity.getGroup().getGroupLeader().getBatch().getName(),
                                        entity.getGroup().getGroupLeader().getBatch().getYear(),
                                        entity.getGroup().getGroupLeader().getBatch().getType()
                                )

                        ))
                        .groupMembers(
                                entity
                                        .getGroup()
                                        .getGroupMembers()
                                        .stream()

                                        .map(
                                                currentMemeber -> new StudentResponseGroupResponse(
                                            currentMemeber.getId(),
                                            currentMemeber.getFirstName(),
                                            currentMemeber.getLastName(),
                                            currentMemeber.getCode(),
                                            currentMemeber.getEmail(),
                                            currentMemeber.getPhone(),
                                            currentMemeber.getKankorId(),
                                            currentMemeber.getProfilePicture(),
                                            new SemesterGroupResponse(
                                                    new AcademicYearGroupResponse(
                                                            currentMemeber.getSemester().getAcademicYear().getName(),
                                                            currentMemeber.getSemester().getAcademicYear().getStartDate(),
                                                            currentMemeber.getSemester().getAcademicYear().getEndDate()
                                                    ),
                                                    currentMemeber.getSemester().getType(),
                                                    currentMemeber.getSemester().getName(),
                                                    currentMemeber.getSemester().getStartDate(),
                                                    currentMemeber.getSemester().getEndDate(),
                                                    currentMemeber.getSemester().getCode()
                                            ),
                                            new DepartmentGroupResponse(
                                                    currentMemeber.getDepartment().getId(),
                                                    currentMemeber.getDepartment().getName(),
                                                    currentMemeber.getDepartment().getField(),
                                                    currentMemeber.getDepartment().getCode(),
                                                    currentMemeber.getDepartment().getEmail(),
                                                    currentMemeber.getDepartment().getPhone()
                                            ),
                                            currentMemeber.getStatus(),
                                            new BatchGroupResponse(
                                                    currentMemeber.getBatch().getName(),
                                                    currentMemeber.getBatch().getYear(),
                                                    currentMemeber.getBatch().getType()
                                            ))).toList()


                        )
                        .academicYear(
                                AcademicYearResponse
                                .builder()
                                .id(entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getId())
                                .calendarType(entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getCalendarType())
                                .endDate(entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getEndDate())
                                .startDate(entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getStartDate())
                                .name(entity.getGroup().getGroupLeader().getSemester().getAcademicYear().getName())
                                .build())
                        .build()
        );
        projectResponse.setTeacher(
                new GroupTeacherResponse(
                        entity.getTeacher().getId(),
                        entity.getTeacher().getKeycloakId(),
                        entity.getTeacher().getFirstName(),
                        entity.getTeacher().getLastName(),
                        entity.getTeacher().getFatherName(),
                        entity.getTeacher().getDateOfBirth(),
                        entity.getTeacher().getEmail(),
                        entity.getTeacher().getPhone(),
                        entity.getTeacher().getCode()
                )
        );

        return projectResponse;
    }
}

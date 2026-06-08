package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.DTO.RepositoryDTO;
import com.final_project.faculty_service.models.ProjectStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProjectResponse {
    private String id;
    private String projectName;
    private GroupResponse group;
    private GroupTeacherResponse teacher;
    private RepositoryDTO projectRepository;
    private String abstractText;
    private String finalFileName;
    private String finalFileDownloadUrl;
    private ProjectStatus status;
    private Integer progress;
    private Integer completion;
    private boolean published;
    private LocalDateTime publishedAt;
}

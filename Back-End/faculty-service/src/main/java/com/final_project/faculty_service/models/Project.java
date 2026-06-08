package com.final_project.faculty_service.models;

import com.final_project.faculty_service.DTO.RepositoryDTO;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document
public class Project {
    @Id
    private String id;
    private String projectName;
    @DBRef
    private Group group;
    @DBRef
    private Teacher teacher;
    private RepositoryDTO projectRepository;
    private String abstractText;
    private String finalFileName;
    private String finalFileDownloadUrl;
    private ProjectStatus status = ProjectStatus.PLANNED;
    private Integer progress = 0;
    private Integer completion = 0;
    private boolean published;
    private LocalDateTime publishedAt;
    private boolean isDeleted;
}

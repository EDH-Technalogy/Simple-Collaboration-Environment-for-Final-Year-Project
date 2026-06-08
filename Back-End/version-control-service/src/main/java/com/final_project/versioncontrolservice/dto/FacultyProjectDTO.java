package com.final_project.versioncontrolservice.dto;

import lombok.Data;

@Data
public class FacultyProjectDTO {
    private String id;
    private String projectName;
    private FacultyTeacherDTO teacher;
    private RepositoryDTO projectRepository;
}

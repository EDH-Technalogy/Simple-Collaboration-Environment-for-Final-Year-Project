package com.final_project.versioncontrolservice.dto;

import lombok.Data;

@Data
public class FacultyTeacherDTO {
    private String id;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String code;
}

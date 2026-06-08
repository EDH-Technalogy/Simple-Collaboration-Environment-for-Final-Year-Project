package com.final_project.faculty_service.DTO;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakRole {
    private String active;
    private String systemRole;
    private String id;
    private String name;
}

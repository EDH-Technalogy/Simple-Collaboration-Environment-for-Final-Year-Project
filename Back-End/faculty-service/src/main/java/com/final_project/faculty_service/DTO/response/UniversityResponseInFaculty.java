package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class UniversityResponseInFaculty {
    private String   id;
    private String name;
    private String email;
    private String code;
    private String logo;
}

package com.final_project.faculty_service.DTO.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UniversityResponse {
    private String   id;
    private String name;
    private String email;
    private String shortName;
    private String code;
    private AddressResponse address;
    private String establishYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String logo;
}

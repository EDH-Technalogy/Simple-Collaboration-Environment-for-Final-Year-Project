package com.final_project.faculty_service.DTO.response;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FacultyResponseInDepartment {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String createdBy;
}

package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeacherDepartmentResponse {
    private String id;
    private String name;
    private String field;
    private FacultyResponseInDepartment faculty;
    private String code;
    private String email;
    private String phone;
}

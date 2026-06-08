package com.final_project.faculty_service.DTO.response;

import lombok.Data;

@Data
public class DepartmentResponse {
    private String id;
    private String name;
    private String field;
    private String description;
    private FacultyResponseInDepartment faculty;
    private String code;
    private String email;
    private String phone;
    private String shortName;
    private EmployeeResponseInFaculty headOfDepartment;
    private String  updateAt;
    private String  createdAt;
    private String  createdBy;
    private String logo;
}

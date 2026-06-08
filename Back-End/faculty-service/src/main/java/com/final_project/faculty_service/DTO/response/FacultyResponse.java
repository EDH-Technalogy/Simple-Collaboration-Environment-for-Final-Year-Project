package com.final_project.faculty_service.DTO.response;


import lombok.Data;

@Data
public class FacultyResponse {
    private String id;
    private String name;
    private String establishDate;
    private String description;
    private UniversityResponseInFaculty university;
    private String code;
    private String email;
    private String phone;
    private String updateAt;
    private String createAt;
    private String shortName;
    private String createdBy;
    private String logo;
}

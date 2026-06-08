package com.final_project.faculty_service.DTO.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.EducationRank;
import com.final_project.faculty_service.models.FacultyPosition;
import lombok.Data;

import java.util.Date;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmployeeResponse {
    private String id;
    private FacultyResponseEmployee faculty;
    private Address address;
    private String firstName;
    private String lastName;
    private String fatherName;
    private String grandFatherName;
    private String email;
    private String phone;
    private Date hireDate;
    private EducationRank educationRank;
    private String code;
    private FacultyPosition facultyPosition;
    private String updatedAt;
    private String createdAt;
    private String createdBy;
    private String photoUrl;
    private String keycloak;
}

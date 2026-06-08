package com.final_project.faculty_service.DTO.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.EducationRank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
public class TeacherResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String fatherName;
    private String grandFatherName;
    private Date dateOfBirth;
    private Address address;
    private String email;
    private String phone;
    private EducationRank educationRank;
    private TeacherDepartmentResponse department;
    private String code;
    private Date enrollmentDate;
    private String photoUrl;
    private String createdBy;
    private String  createdAt;
    private String  updatedAt;
    private String keycloak;
}

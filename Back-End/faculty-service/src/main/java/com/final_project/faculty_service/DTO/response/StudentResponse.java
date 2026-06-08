package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.StudentStatus;
import lombok.Data;

import java.util.Date;

@Data
public class StudentResponse {
    private String id;
    private String firstName;
    private String fatherName;
    private String grandFatherName;
    private String lastName;
    private String nationality;
    private String gender;
    private Date dateOfBirth;
    private Address address;
    private String code;
    private String email;
    private String phone;
    private Date enrollmentDate;
    private String kankorId;
    private String photoUrl;
    private StudentSemesterResponse semester;
    private StudentDepartmentSemesterResponse department;
    private StudentStatus status;
    private String batch;
    private String keycloak;
}

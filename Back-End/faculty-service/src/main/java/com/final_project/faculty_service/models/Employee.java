package com.final_project.faculty_service.models;

import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@Document
public class Employee {
    @Id
    private String id;
    @DBRef
    private Faculty faculty;
    private String keycloakId;
    private String firstName;
    private String lastName;
    private String fatherName;
    private String grandFatherName;
    private Address address;
    private String imageUrl;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private Date hireDate;
    private EducationRank educationRank;
    private String code;
    private FacultyPosition facultyPosition;
    private boolean isDeleted;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    @CreatedDate
    private LocalDateTime createdAt;
    @CreatedBy
    private String createdBy;
}

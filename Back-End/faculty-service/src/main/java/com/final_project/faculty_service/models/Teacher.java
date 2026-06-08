package com.final_project.faculty_service.models;


import lombok.Data;
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
public class Teacher {
    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String fatherName;
    private String grandFatherName;
    private Date dateOfBirth;
    private Address address;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private String keycloakId;
    private EducationRank educationRank;
    @DBRef
    private Department department;
    private String code;
    private Date enrollmentDate;
    private boolean isDeleted = false;
    @LastModifiedDate
    private LocalDateTime updateAt;
    @CreatedDate
    private LocalDateTime createdAt;
    private String imageUrl;
    private String createdBy;
}

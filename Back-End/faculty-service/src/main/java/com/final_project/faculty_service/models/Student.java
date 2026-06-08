package com.final_project.faculty_service.models;

import jakarta.validation.constraints.NotBlank;
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
public class Student {
    @Id
    private String id;
    @DBRef
    @NotBlank( message = " You have to provide the Batch Number")
    private Batch batch;
    private String firstName;
    private String fatherName;
    private String grandFatherName;
    private String lastName;
    private String nationality;
    private String gender;
    private Date dateOfBirth;
    private Address address;
    private String code;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private Date enrollmentDate;
    private String kankorId;
    private String profilePicture;
    private String keycloakId;
    @DBRef
    private Semester semester;
    @DBRef
    private Department department;
    private StudentStatus status;

    private boolean isDeleted = false;
    @LastModifiedDate
    private LocalDateTime updateAt;
    @CreatedDate
    private LocalDateTime createdAt;
}

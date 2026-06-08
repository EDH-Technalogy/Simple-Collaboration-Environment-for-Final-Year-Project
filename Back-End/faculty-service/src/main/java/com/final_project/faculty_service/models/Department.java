package com.final_project.faculty_service.models;


import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document
public class Department {
    @Id
    private String  id;
    private String name;
    private String field;
    private String description;
    private String shortName;
    @Indexed(unique = true)
    private String code;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private String address;
    @DBRef
    private Employee headOfDepartment;
    private boolean isDeleted = false;
    @DBRef
    private Faculty faculty;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    @CreatedBy
    private String createdBy;
    private String logo;
}

package com.final_project.faculty_service.models;


import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDateTime;
@Data
public class Faculty {
    @Id
    private String  id;
    @Indexed(unique = true)
    private String code;
    private String shortName;
    @Indexed(unique = true)
    private String name;
    private String establishDate;
    private String description;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    @DBRef
    private University university;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private boolean isDeleted;
    @CreatedBy
    private String createdBy;
    private String logo;
}

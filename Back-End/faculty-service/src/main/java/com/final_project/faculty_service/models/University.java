package com.final_project.faculty_service.models;
import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document
public class University {
    @Id
    private String id;
    @Indexed(unique = true)
    private String name;
    private String shortName;
    @Indexed(unique = true)
    private String code;
    private Address address;
    private String establishYear;
    private String logo;
    @Indexed(unique = true)
    private String email;
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private boolean isDeleted = false;
    @CreatedBy
    private String createdBy;
}

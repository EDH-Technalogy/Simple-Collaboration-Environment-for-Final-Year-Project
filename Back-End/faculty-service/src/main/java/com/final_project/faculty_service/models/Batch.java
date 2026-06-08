package com.final_project.faculty_service.models;

import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@Document
public class Batch {

    @Id
    private String id;


    @DBRef
    private AcademicYear academicYear;
    private String name;        // e.g. "Kankor 2024"
    private int year;           // 2024
    private String type;        // KANKOR, SPRING, FALL (optional)
    private Date startDate;     // when students joined
    private Date endDate;       // expected graduation (optional)
    @DBRef
    private Department department; // optional (if batch is department-specific)
    private String description;
    private boolean isActive = true;
    private boolean isDeleted = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
    @CreatedBy
    private String createdBy;
}

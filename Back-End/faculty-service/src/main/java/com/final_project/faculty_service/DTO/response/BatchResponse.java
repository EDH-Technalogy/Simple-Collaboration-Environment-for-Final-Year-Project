package com.final_project.faculty_service.DTO.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Data
public class BatchResponse {

    private String id;

    private String name;
    private Integer year;
    private String type;

    private Date startDate;
    private Date endDate;
    private String description;
    private Boolean isActive;
    private AcademicYearResponse academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
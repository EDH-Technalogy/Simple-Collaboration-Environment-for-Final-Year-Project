package com.final_project.faculty_service.DTO.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Date;

@Data
public class BatchRequest {

    @NotBlank(message = "Batch name is required")
    @Size(max = 100, message = "Batch name must be at most 100 characters")
    private String name;

    @NotNull(message = "Year is required")
    @Min(value = 2001, message = "Year is too old")
    @Max(value = 2050, message = "Year is too far in the future")
    private Integer year;

    @NotBlank(message = "Batch type is required")
    @Size(max = 50, message = "Batch type must be at most 50 characters")
    private String type;

    @NotNull(message = "Start date is required")
    private Date startDate;

    @NotNull(message = "End date is required")
    private Date endDate;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private Boolean isActive = true;

    @NotBlank(message = "Academic year is required")
    private String academicYear;
}
package com.final_project.faculty_service.DTO.request;

import com.final_project.faculty_service.models.SemesterType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Date;

@Data
public class SemesterRequest {

    @NotBlank(message = "Academic year is required")
    private String academicYear; // Example: 1402-1403 or 2024-2025

    @NotNull(message = "Semester type is required")
    private SemesterType type;

    @NotBlank(message = "Semester name is required")
    private String name;

    @NotNull(message = "Start date is required")
    private Date startDate;

    @NotNull(message = "End date is required")
    private Date endDate;

    @AssertTrue(message = "End date must be after start date")
    public boolean isEndDateValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return endDate.after(startDate);
    }
}
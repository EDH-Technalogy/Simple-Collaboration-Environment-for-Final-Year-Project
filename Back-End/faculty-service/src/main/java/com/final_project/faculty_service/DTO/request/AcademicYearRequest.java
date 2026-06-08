package com.final_project.faculty_service.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Date;

@Data
public class AcademicYearRequest
{
    @NotBlank( message = "provide the name of academic year")
    private String name;
    @NotNull(message = "required the start date")
    private Date startDate;
    @NotNull(message = "required the end date")
    private Date endDate;

    private String calendarType;
    private boolean isActive;
}

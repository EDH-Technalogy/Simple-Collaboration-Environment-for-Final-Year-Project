package com.final_project.faculty_service.DTO.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FacultyRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Establish date is required")
    private String establishDate;

    @Size(max = 500, message = "Description too long")
    private String description;

    @NotBlank(message = "Please provide the university")
    private String university;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Pattern(regexp = "^[0-9+\\-() ]*$", message = "Invalid phone number")
    private String phone;

    @NotBlank(message = "Short name is required")
    @Size(max = 10, message = "Short name too long")
    private String shortName;
}

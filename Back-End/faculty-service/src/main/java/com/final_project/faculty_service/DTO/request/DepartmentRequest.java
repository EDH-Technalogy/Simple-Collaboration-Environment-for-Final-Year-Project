package com.final_project.faculty_service.DTO.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DepartmentRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Field is required")
    @Size(max = 100, message = "Field must be at most 100 characters")
    private String field;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotBlank(message = "Faculty id is required")
    private String faculty;


    private String code;

    @Email(message = "Email should be valid")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Phone must be a valid number with 7-15 digits")
    private String phone;

    @Size(max = 50, message = "Short name must be at most 50 characters")
    private String shortName;

    private String headOfDepartment;
}

package com.final_project.faculty_service.DTO.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UniversityRequest {
    @NotBlank(message = "University name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Establish year is required")
    @Pattern(regexp = "^[0-9]{4}$", message = "Year must be a valid 4-digit year")
    private String establishYear;

    private String logo;

    @NotNull(message = "Address is required")
    @Valid
    private AddressRequest address;

    @NotBlank(message = "Short name is required")
    @Size(max = 20, message = "Short name must not exceed 20 characters")
    private String shortName;

   private String code;
}

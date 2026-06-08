package com.final_project.faculty_service.DTO.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.StudentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Date;

@Data
public class StudentRequest {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50)
    private String firstName;
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "Username can only contain alphanumeric characters, dots, and underscores")
    @JsonProperty("username")
    private String username;

    private String role;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "Password must contain uppercase, lowercase, number, and special character"
    )
    @JsonProperty("password")
    private String password;
    @NotBlank(message = "Father name is required")
    private String fatherName;

    private String grandFatherName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Nationality is required")
    private String nationality;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private Date dateOfBirth;

    @NotNull(message = "Address is required")
    @Valid
    private Address address;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9+\\-]{7,15}$", message = "Invalid phone number")
    private String phone;

    private String code;

    @NotNull(message = "Enrollment date is required")
    private Date enrollmentDate;

    private String kankorId;

    private String profilePicture;

    @NotBlank(message = "Semester is required")
    private String semester;

    @NotBlank(message = "Department is required")
    private String department;

    @NotNull(message = "Student status is required")
    private StudentStatus status;

    @NotBlank(message = "Batch is required")
    private String batch;
}

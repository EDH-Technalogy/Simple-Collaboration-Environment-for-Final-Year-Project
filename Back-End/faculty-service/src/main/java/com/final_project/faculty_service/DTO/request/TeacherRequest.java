package com.final_project.faculty_service.DTO.request;

import com.final_project.faculty_service.models.Address;
import com.final_project.faculty_service.models.EducationRank;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Date;

@Data
public class TeacherRequest {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50)
    private String firstName;
    private String userName;
    private String password;
    private String role;
    private String profileUrl;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Father name is required")
    private String fatherName;

    private String grandFatherName;

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

    @NotNull(message = "Education rank is required")
    private EducationRank educationRank;

    @NotBlank(message = "Department is required")
    private String department;

    private String code;

    @NotNull(message = "Enrollment date is required")
    private Date enrollmentDate;
}

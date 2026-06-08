package com.final_project.faculty_service.DTO.request;

import com.final_project.faculty_service.models.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Date;

@Data
public class EmployeeRequest {


    @NotNull(message = "Faculty is required")
    private String password;
    private String role;
    private String userName;
    private String profileUrl;
    private String  faculty;
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Father name is required")
    private String fatherName;

    @NotBlank(message = "Grandfather name is required")
    private String grandFatherName;

    @NotNull(message = "Address is required")
    private Address address;
    private String code;
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[0-9+\\-() ]{7,20}$",
            message = "Invalid phone number format"
    )
    private String phone;

    @NotNull(message = "Hire date is required")
    @PastOrPresent(message = "Hire date cannot be in the future")
    private Date hireDate;

    @NotNull(message = "Education rank is required")
    private EducationRank educationRank;
    @NotNull(message = "Faculty position is required")
    private FacultyPosition facultyPosition;




}

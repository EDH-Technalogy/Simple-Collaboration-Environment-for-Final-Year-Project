package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new user")
public class CreateUserRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @JsonProperty("username")
    @Schema(description = "Username", example = "john.doe")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @JsonProperty("email")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must not exceed 50 characters")
    @JsonProperty("first_name")
    @Schema(description = "First name", example = "John")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50, message = "Last name must not exceed 50 characters")
    @JsonProperty("last_name")
    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @JsonProperty("phone_number")
    @Schema(description = "Phone number", example = "+1234567890")
    private String phoneNumber;

    @JsonProperty("role_names")
    @Schema(description = "Initial realm roles")
    private Set<String> roleNames;

    @JsonProperty("user_type")
    @Schema(description = "user blongs to for instance teacher, student ... ")
    private String userType;

    @JsonProperty("entity_id")
    @Schema(description = "Entity that belongs to this user", example = "teacher account with id: 8902323")
    private String entityId;

    @JsonProperty("profile")
    @Schema(description = "http:u023i23")
    private String profile;

    @JsonProperty("password")
    @Schema( description =  "password for user ")
    private String password;
}

package com.final_project.auth_service.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SignupRequest - Request DTO for user registration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to register a new user")
public class SignupRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "Username can only contain alphanumeric characters, dots, and underscores")
    @JsonProperty("username")
    @Schema(description = "Username", example = "john.doe")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @JsonProperty("email")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "Password must contain uppercase, lowercase, number, and special character"
    )
    @JsonProperty("password")
    @Schema(description = "Password (min 8 chars, uppercase, lowercase, number, special char)", example = "SecurePass123!")
    private String password;

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
    @Schema(description = "Phone number (optional)", example = "+1234567890")
    private String phoneNumber;

    @JsonProperty("terms_agreed")
    @Schema(description = "Agreement to terms and conditions", example = "true")
    private Boolean termsAgreed = false;

    @JsonProperty("privacy_agreed")
    @Schema(description = "Agreement to privacy policy", example = "true")
    private Boolean privacyAgreed = false;
}




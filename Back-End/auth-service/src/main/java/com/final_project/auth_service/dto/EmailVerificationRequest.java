package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to verify email with token")
public class EmailVerificationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @JsonProperty("email")
    @Schema(description = "Email address to verify", example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP code must be 6 digits")
    @JsonProperty("otp_code")
    @Schema(description = "6-digit OTP code from the email", example = "123456")
    private String otpCode;

    @JsonProperty("verification_token")
    @Schema(description = "Legacy email verification token from email link")
    private String verificationToken;
}

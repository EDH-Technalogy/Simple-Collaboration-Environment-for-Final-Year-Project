package com.final_project.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request to update user information")
public class UpdateUserRequest {

    @JsonProperty("first_name")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Schema(description = "First name", example = "John")
    private String firstName;

    @JsonProperty("last_name")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @JsonProperty("phone_number")
    @Schema(description = "Phone number", example = "+1234567890")
    private String phoneNumber;

    @JsonProperty("status")
    @Schema(description = "User status", example = "ACTIVE", allowableValues = {"ACTIVE", "INACTIVE", "SUSPENDED"})
    private String status;

    private Boolean emailVerified;
    private Boolean twoFactorEnabled;

    @JsonProperty("roles")
    @Schema(description = "User roles")
    private Set<String> roleNames;

    @JsonProperty("email")
    @Schema(description = "User email")
    private String email;

    @JsonProperty("enabled")
    @Schema(description = "Whether the user account is enabled")
    private Boolean enabled;

    @JsonProperty("profile")
    @Schema(description = "Profile image or URL")
    private String profile;

    @JsonProperty("entity_id")
    @Schema(description = "Related domain entity id")
    private String entityId;

    @JsonProperty("user_type")
    @Schema(description = "Related domain user type")
    private String userType;
}

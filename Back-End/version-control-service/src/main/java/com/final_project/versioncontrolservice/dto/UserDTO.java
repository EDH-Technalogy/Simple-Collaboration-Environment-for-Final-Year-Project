package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Data Transfer Objects for User API endpoints.
 */

/**
 * UserDTO - Response DTO for user information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    @JsonProperty("id")
    private String id;

    @JsonProperty("user_name")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("phone_number")
    private String phoneNumber;
    @JsonProperty("status")
    private String status;
    @JsonProperty("email_verified")
    private Boolean emailVerified;
    @JsonProperty("roles")
    private Set<String> roles;
    private String profile;
}
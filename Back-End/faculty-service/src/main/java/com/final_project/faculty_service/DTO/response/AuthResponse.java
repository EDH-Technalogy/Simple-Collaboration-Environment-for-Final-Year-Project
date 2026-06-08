package com.final_project.faculty_service.DTO.response;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.faculty_service.DTO.UserDto;
import lombok.Data;

@Data
public class AuthResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("expires_in")
    private Long expiresIn;

    @JsonProperty("user")
    private UserDto user;

    @JsonProperty("message")
    private String message;
}

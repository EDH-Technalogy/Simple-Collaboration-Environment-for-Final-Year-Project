package com.final_project.faculty_service.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class UserDto {

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
    @JsonProperty("status")
    private String status;

    @JsonProperty("two_factor_enabled")
    private String twoFactorEnabled;
}



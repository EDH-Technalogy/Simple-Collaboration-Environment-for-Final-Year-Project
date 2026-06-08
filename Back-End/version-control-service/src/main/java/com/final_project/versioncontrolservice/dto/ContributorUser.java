package com.final_project.versioncontrolservice.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.ContributorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContributorUser {
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

    @JsonProperty("roles")
    private Set<String> roles;
    @JsonProperty("profile")
    private String profile;

    private String Role;
    private ContributorStatus ContributorStatus;
}

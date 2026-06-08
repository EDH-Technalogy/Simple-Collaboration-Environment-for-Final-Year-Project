package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContributorRequest {
    @JsonProperty("id")
    private String id;
    @JsonProperty("user_name")
    private String username;
    @JsonProperty("email")
    private String email;
}

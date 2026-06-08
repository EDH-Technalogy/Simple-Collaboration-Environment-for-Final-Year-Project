package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateRepositoryRequest {
    @JsonProperty("user_name")
    private String  userName;
    @JsonProperty("repository_name")
    private String repositoryName;
    @JsonProperty("description")
    private String description;
    @JsonProperty("repository_visibility")
    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
}

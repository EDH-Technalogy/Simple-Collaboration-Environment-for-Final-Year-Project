package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepositoryMetadata {
    private String repositoryName;
    private String repositoryId;
    private String userName;
    private RepositoryVisibility type;
    private String description;
}

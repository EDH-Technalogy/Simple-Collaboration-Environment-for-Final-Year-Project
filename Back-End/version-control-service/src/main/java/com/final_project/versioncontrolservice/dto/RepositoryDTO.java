package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepositoryDTO {
    private String id;
    private String  owner;
    private String repositoryName;
    private String description;
    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private String cloneUrl;
}

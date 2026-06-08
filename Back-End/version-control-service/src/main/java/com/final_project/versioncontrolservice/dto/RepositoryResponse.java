package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RepositoryResponse {
    private String id;
    private UserDTO owner;
    private String repositoryName;
    private String description;

    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private Map<String, String> branchHeads = new HashMap<>();
    private String symbolicHead;
    private String defaultBranch;
    private String cloneUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

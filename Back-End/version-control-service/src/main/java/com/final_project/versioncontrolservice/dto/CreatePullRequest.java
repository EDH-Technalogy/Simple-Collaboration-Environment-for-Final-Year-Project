package com.final_project.versioncontrolservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CreatePullRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    @NotBlank
    private String sourceBranch;
    @NotBlank
    private String targetBranch;

    private String author;
}

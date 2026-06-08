package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.PullRequest;
import com.final_project.versioncontrolservice.model.PullRequestStatus;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PullRequestResponse(
        @JsonProperty("id") String id,
        @JsonProperty("repo_owner") PullRequestUser repoOwner,
        @JsonProperty("repo_name") String repoName,
        PullRequestUser author,
        @JsonProperty("source_branch")  String sourceBranch,
        @JsonProperty("source_hash") String sourceHash,
        @JsonProperty("target_branch") String targetBranch,
        @JsonProperty("target_hash") String targetHash,
        String title,
        String description,
        PullRequestStatus status,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("merged_at") Instant mergedAt
) {
    public static PullRequestResponse from(PullRequest d) {
        return new PullRequestResponse(
                d.getId(),
                d.getRepoOwner(),
                d.getRepoName(),
                d.getAuthor(),
                d.getSourceBranch(),
                d.getSourceHash(),
                d.getTargetBranch(),
                d.getTargetHash(),
                d.getTitle(),
                d.getDescription(),
                d.getStatus(),
                d.getCreatedAt(),
                d.getMergedAt()
        );
    }
}

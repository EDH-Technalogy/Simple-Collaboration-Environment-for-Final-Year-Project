package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.PullRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MergeResponse {
    private String pullRequestId;
    private PullRequestStatus status;
    private String sourceBranch;
    private String targetBranch;
    private String newHead;     // updated commit hash
    private Instant mergedAt;
    private String message;
}
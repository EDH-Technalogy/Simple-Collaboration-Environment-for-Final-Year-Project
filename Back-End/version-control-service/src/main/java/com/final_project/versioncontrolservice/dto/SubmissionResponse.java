package com.final_project.versioncontrolservice.dto;
import java.time.Instant;
import java.util.List;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.Submission;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SubmissionResponse(

        @JsonProperty("id")
        String id,

        @JsonProperty("task_id")
        String taskId,

        @JsonProperty("submitted_by")
        MilestoneTaskUser submittedBy,

        @JsonProperty("submitted_at")
        Instant submittedAt,

        String description,

        @JsonProperty("branch_name")
        String branchName,

        @JsonProperty("commit_hash")
        String commitHash,

        @JsonProperty("pull_request_url")
        String pullRequestUrl,

        @JsonProperty("pull_request_id")
        String pullRequestId,

        List<String> files,

        String status,

        @JsonProperty("reviewed_by")
        String reviewedBy,

        @JsonProperty("reviewed_at")
        Instant reviewedAt,

        Integer score,

        String feedback,

        @JsonProperty("revision_count")
        Integer revisionCount

) {
    public static SubmissionResponse from(Submission s) {
        return new SubmissionResponse(
                s.getId() != null ? s.getId().toHexString() : null,
                s.getTaskId(),
                s.getSubmittedBy(),
                s.getSubmittedAt(),
                s.getDescription(),
                s.getBranchName(),
                s.getCommitHash(),
                s.getPullRequestUrl(),
                s.getPullRequestId(),
                s.getFiles(),
                s.getStatus(),
                s.getReviewedBy(),
                s.getReviewedAt(),
                s.getScore(),
                s.getFeedback(),
                s.getRevisionCount()
        );
    }
}

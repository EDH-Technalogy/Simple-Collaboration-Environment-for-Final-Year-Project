package com.final_project.versioncontrolservice.model;


import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "tasks")
@CompoundIndexes({
        @CompoundIndex(name = "repo_task", def = "{'repo_owner': 1, 'repo_name': 1, 'number': 1}", unique = true)
})
@Builder
@AllArgsConstructor
public class Task {
    @Id
    private String  id;
    @Field("repo_owner")
    @Indexed
    private MilestoneTaskUser repoOwner;


    @Field("repo_name")
    @Indexed
    private String repoName;

    @Indexed
    private Integer number;  // Auto-increment within repository
    private String title;
    private String description;


    @Field("milestone_id")
    @Indexed
    private String  milestoneId;

    @Field("milestone_number")
    private Integer milestoneNumber;

    @Field("assigned_to")
    @Indexed
    private MilestoneTaskUser assignedTo;  // Username of assignee

    @Field("assigned_at")
    private Instant assignedAt;

    @Field("created_by")
    private String createdBy;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("completed_at")
    private Instant completedAt;

    private TaskStatus status;  // "open", "in_progress", "in_review", "completed", "cancelled"
    private TaskPriority priority;  // "low", "medium", "high", "critical"
    private List<Label> labels = new ArrayList<>();

    @Field("due_date")
    private Instant dueDate;
    @Field("estimated_hours")
    private Integer estimatedHours;


    @Field("actual_hours")
    private Integer actualHours;


    // Academic-specific fields
    @Field("max_score")
    private Integer maxScore;  // Points for this specific task

    @Field("earned_score")
    private Integer earnedScore;  // Points earned by student

    @Field("reviewed_by")
    private String reviewedBy;  // Who reviewed/graded this

    @Field("reviewed_at")
    private Instant reviewedAt;

    @Field("review_comments")
    private String reviewComments;

    @Field("submission_url")
    private String submissionUrl;  // Link to submitted work

    @Field("submission_branch")
    private String submissionBranch;  // Branch containing submission

    @Field("submission_commit")
    private String submissionCommit;  // Commit hash of submission

    @Field("requirements_checklist")
    private List<RequirementCheck> requirementsChecklist = new ArrayList<>();

    @Field("attachments")
    private List<Attachment> attachments = new ArrayList<>();

    @Field("comments_count")
    private Integer commentsCount = 0;

    // Linked PR
    @Field("linked_pr_id")
    private String linkedPrId;

    @Data
    public static class RequirementCheck {
        private String requirement;
        private boolean completed;
        private String comment;
    }

    @Data
    public static class Attachment {
        private String name;
        private String url;
        private String type;
        private long size;
        private Instant uploadedAt;
    }
}

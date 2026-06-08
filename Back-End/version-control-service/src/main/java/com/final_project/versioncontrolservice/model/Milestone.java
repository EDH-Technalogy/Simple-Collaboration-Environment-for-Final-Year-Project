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
@Document(collection = "milestones")
@CompoundIndexes({
        @CompoundIndex(name = "repo_milestone", def = "{'repo_owner': 1, 'repo_name': 1, 'number': 1}", unique = true)
})
@Builder
@AllArgsConstructor
public class Milestone {

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
    @Field("due_date")
    private Instant dueDate;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("closed_at")
    private Instant closedAt;

    @Field("created_by")
    private String createdBy;

    private String status;  // "open", "closed"

    // Academic-specific fields
    @Field("max_score")
    private Integer maxScore;  // Maximum points for this milestone

    @Field("passing_score")
    private Integer passingScore;  // Minimum score to pass

    private String rubric;  // Grading criteria/rubric

    @Field("required_tasks")
    private Integer requiredTasks;  // Number of tasks that must be completed

    @Field("completion_percentage")
    private Double completionPercentage;  // 0.0 to 100.0
    // Statistics
    @Field("total_tasks")
    private Integer totalTasks = 0;

    @Field("open_tasks")
    private Integer openTasks = 0;

    @Field("completed_tasks")
    private Integer completedTasks = 0;

    @Field("in_progress_tasks")
    private Integer inProgressTasks = 0;
}

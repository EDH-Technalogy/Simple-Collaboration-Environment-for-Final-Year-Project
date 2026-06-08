package com.final_project.versioncontrolservice.model;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Document(collection = "task_comments")
public class TaskComment {

    @Id
    private String  id;

    @Field("task_id")
    @Indexed
    private String  taskId;

    @Field("repo_owner")
    private String repoOwner;

    @Field("repo_name")
    private String repoName;

    private String author;

    private String body;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("is_review")
    private boolean isReview;  // Whether this is a review/grading comment

    @Field("review_score")
    private Integer reviewScore;  // Score given in review
}

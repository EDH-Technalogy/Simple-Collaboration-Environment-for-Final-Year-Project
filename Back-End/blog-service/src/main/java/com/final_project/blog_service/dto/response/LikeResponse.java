package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Like Response",
        description = "Response after liking an article"
)
public class LikeResponse {

    @Schema(
            title = "Like ID",
            example = "like_123"
    )
    private String id;

    @Schema(
            title = "User ID",
            description = "Who liked the article",
            example = "user_123"
    )
    private String userId;

    @Schema(
            title = "Article ID",
            description = "Which article was liked",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:40:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;
}
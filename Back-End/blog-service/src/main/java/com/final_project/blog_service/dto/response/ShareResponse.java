package com.final_project.blog_service.dto.response;


import com.final_project.blog_service.model.SharedPlatform;
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
        title = "Share Response",
        description = "Response after sharing an article"
)
public class ShareResponse {

    @Schema(
            title = "Share ID",
            example = "share_123"
    )
    private String id;

    @Schema(
            title = "User ID",
            description = "Who shared the article",
            example = "user_123"
    )
    private String userId;

    @Schema(
            title = "Article ID",
            description = "Which article was shared",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Platform",
            example = "TWITTER"
    )
    private SharedPlatform platform;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;
}

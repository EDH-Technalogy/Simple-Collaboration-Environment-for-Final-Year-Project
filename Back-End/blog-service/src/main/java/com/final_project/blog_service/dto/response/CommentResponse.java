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
        title = "Comment Response",
        description = "Complete comment details"
)
public class CommentResponse {

    @Schema(
            title = "Comment ID",
            example = "comment_123"
    )
    private String id;

    @Schema(
            title = "Article ID",
            description = "The article this comment belongs to",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Parent Comment ID",
            description = "If this is a reply, the ID of the parent comment",
            example = "comment_122",
            nullable = true
    )
    private String parentCommentId;

    @Schema(
            title = "Comment Body",
            example = "Great article!"
    )
    private String body;

    @Schema(
            title = "Comment Author",
            description = "Author profile information"
    )
    private AuthorResponse author;

    @Schema(
            title = "Comment Engagement",
            description = "Likes and reply count"
    )
    private CommentEngagementResponse engagement;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:35:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;

    @Schema(
            title = "Edited At",
            description = "When the comment was last edited",
            example = "2024-01-15T11:00:00",
            type = "string",
            format = "date-time",
            nullable = true
    )
    private LocalDateTime editedAt;

    @Schema(
            title = "Reply Count",
            description = "Number of direct replies to this comment",
            example = "3"
    )
    private Integer replyCount;
}

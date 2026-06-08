package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Comment Engagement Response",
        description = "Engagement metrics for a comment"
)
public class CommentEngagementResponse {

    @Schema(
            title = "Likes",
            description = "Number of likes on this comment",
            example = "5"
    )
    private Long likes;

    @Schema(
            title = "Reply Count",
            description = "Number of replies to this comment",
            example = "2"
    )
    private Long replyCount;
}

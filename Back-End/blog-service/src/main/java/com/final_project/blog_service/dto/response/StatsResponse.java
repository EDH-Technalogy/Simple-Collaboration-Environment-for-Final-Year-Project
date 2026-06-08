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
        title = "Statistics Response",
        description = "Engagement and view statistics for an article"
)
public class StatsResponse {

    @Schema(
            title = "Views",
            description = "Total page views",
            example = "234",
            minimum = "0"
    )
    @Builder.Default
    private Long views = 0L;

    @Schema(
            title = "Reads",
            description = "Engaged reads (2+ minutes on page)",
            example = "189",
            minimum = "0"
    )
    @Builder.Default
    private Long reads = 0L;

    @Schema(
            title = "Likes",
            description = "Number of likes/hearts",
            example = "45",
            minimum = "0"
    )
    @Builder.Default
    private Long likes = 0L;

    @Schema(
            title = "Comment Count",
            description = "Total number of comments",
            example = "12",
            minimum = "0"
    )
    @Builder.Default
    private Long commentCount = 0L;

    @Schema(
            title = "Share Count",
            description = "Total shares across all platforms",
            example = "8",
            minimum = "0"
    )
    @Builder.Default
    private Long shareCount = 0L;

    @Schema(
            title = "Last Engaged At",
            description = "Timestamp of last engagement (like, comment, share)",
            example = "2024-01-15T15:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime lastEngagedAt;
}

package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import com.final_project.blog_service.model.ArticleStatus;
import com.final_project.blog_service.model.ArticleVisiblity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Article Preview Response",
        description = "Summary view of an article for lists and feeds"
)
public class ArticlePreviewResponse {

    @Schema(
            title = "Article ID",
            example = "6507a1b2c3d4e5f6g7h8i9j0"
    )
    private String id;
    @Schema(
            title = "Article Slug",
            example = "my-first-blog-post"
    )
    private String slug;
    @Schema(
            title = "Article Title",
            example = "My First Blog Post"
    )
    private String title;
    @Schema(
            title = "Article Subtitle",
            example = "An exciting journey"
    )
    private String subtitle;
    @Schema(
            title = "Cover Image URL",
            example = "https://cdn.example.com/cover.jpg"
    )
    private String coverImageUrl;
    @Schema(
            title = "Article Description",
            description = "Short description or excerpt"
    )
    private String description;
    @Schema(
            title = "Article Status",
            example = "DRAFT"
    )
    private ArticleStatus status;
    @Schema(
            title = "Article Visibility",
            example = "PUBLIC"
    )
    private ArticleVisiblity visibility;
    @Schema(
            title = "Article Statistics",
            description = "Engagement metrics"
    )
    private StatsResponse stats;
    @Schema(
            title = "Article Author",
            description = "Author information"
    )
    private AuthorResponse author;
    @Schema(
            title = "Published Date",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime publishedAt;
    @Schema(
            title = "Estimated Read Time",
            description = "Minutes to read",
            example = "5"
    )
    private Integer estimatedReadTime;
    @Schema(
            title = "Tags",
            example = "[\"javascript\", \"web-dev\"]"
    )
    private List<String> tags;
}

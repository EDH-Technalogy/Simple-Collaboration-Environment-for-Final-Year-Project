package com.final_project.blog_service.dto.response;

import com.final_project.blog_service.model.ArticleStatus;
import com.final_project.blog_service.model.ArticleVisiblity;
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
        title = "Article Response",
        description = "Complete article details with content, metadata, and engagement stats"
)
public class ArticleResponse {

    @Schema(
            title = "Article ID",
            description = "Unique identifier for the article (MongoDB ObjectId)",
            example = "6507a1b2c3d4e5f6g7h8i9j0"
    )
    private String id;

    @Schema(
            title = "Article Slug",
            description = "URL-friendly identifier for the article",
            example = "my-first-blog-post",
            pattern = "^[a-z0-9]+(-[a-z0-9]+)*$"
    )
    private String slug;

    @Schema(
            title = "Article Title",
            example = "My First Blog Post"
    )
    private String title;

    @Schema(
            title = "Article Subtitle",
            example = "An exciting journey into blogging"
    )
    private String subtitle;

    @Schema(
            title = "Article Content",
            description = "Structured content blocks"
    )
    private ContentResponse content;

    @Schema(
            title = "Article Metadata",
            description = "Tags, category, SEO information"
    )
    private MetadataResponse metadata;

    @Schema(
            title = "Article Status",
            description = "Current status of the article",
            example = "PUBLISHED",
            allowableValues = {"DRAFT", "PUBLISHED", "ARCHIVED"}
    )
    private ArticleStatus status;

    @Schema(
            title = "Article Visibility",
            description = "Who can access this article",
            example = "PUBLIC",
            allowableValues = {"PUBLIC", "PRIVATE", "UNLISTED"}
    )
    private ArticleVisiblity visibility;

    @Schema(
            title = "Article Statistics",
            description = "Engagement and view statistics"
    )
    private StatsResponse stats;

    @Schema(
            title = "Article Author",
            description = "Author profile information"
    )
    private AuthorResponse author;

    @Schema(
            title = "Published Date",
            description = "When the article was published",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime publishedAt;

    @Schema(
            title = "Updated Date",
            description = "When the article was last updated",
            example = "2024-01-15T15:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime updatedAt;

    @Schema(
            title = "Created Date",
            description = "When the article was created",
            example = "2024-01-15T10:00:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;

    @Schema(
            title = "Estimated Read Time",
            description = "Estimated time to read the article in minutes",
            example = "5",
            minimum = "1"
    )
    private Integer estimatedReadTime;
}

package com.final_project.blog_service.dto.request;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/**
 * Create Article with Files Request
 *
 * Supports flexible content blocks including images and videos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Create Article with Files Request",
        description = "Request to create article with flexible content blocks (text, images, videos, etc.)",
        example = """
        {
          "title": "My Article with Images",
          "subtitle": "A complete guide",
          "blocks": [
            {
              "type": "heading",
              "level": 2,
              "text": "Introduction"
            },
            {
              "type": "text",
              "text": "This is an introduction paragraph"
            },
            {
              "type": "image",
              "fileId": "image_12345",
              "fileUrl": "https://cdn.example.com/files/image_12345.jpg",
              "alt": "Screenshot",
              "caption": "Figure 1"
            },
            {
              "type": "code",
              "language": "javascript",
              "code": "const x = 1;"
            },
            {
              "type": "video",
              "fileId": "video_12345",
              "fileUrl": "https://cdn.example.com/files/video_12345.mp4",
              "duration": 120
            }
          ],
          "category": "Technology",
          "tags": ["javascript", "tutorial"]
        }
        """
)
public class CreateArticleWithFilesRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    @Schema(
            title = "Article Title",
            example = "My Article with Images and Videos"
    )
    private String title;

    @Size(max = 500, message = "Subtitle must not exceed 500 characters")
    @Schema(
            title = "Article Subtitle",
            example = "A comprehensive guide with rich media"
    )
    private String subtitle;

    @NotEmpty(message = "Article must have at least one content block")
    @Valid
    @Schema(
            title = "Content Blocks",
            description = "Flexible array of content blocks (text, images, videos, code, quotes, embeds, etc.)",
            type = "array"
    )
    private List<FlexibleContentBlockRequest> blocks;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    @Schema(
            title = "Category",
            example = "Technology"
    )
    private String category;

    @Schema(
            title = "Tags",
            example = "[\"javascript\", \"tutorial\", \"web-development\"]"
    )
    private List<String> tags;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(
            title = "Description",
            example = "SEO meta description for the article"
    )
    private String description;

    @Schema(
            title = "Cover Image URL",
            description = "URL to cover image from file upload",
            example = "https://cdn.example.com/files/cover_12345.jpg"
    )
    private String coverImageUrl;
}
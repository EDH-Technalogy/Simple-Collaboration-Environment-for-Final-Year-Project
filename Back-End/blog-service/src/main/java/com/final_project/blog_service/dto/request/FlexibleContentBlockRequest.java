package com.final_project.blog_service.dto.request;
import com.final_project.blog_service.dto.ArticleBlockType;
import jakarta.validation.constraints.*;
import lombok.*;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Flexible Content Block Request
 *
 * Polymorphic JSON structure supporting multiple block types
 * Each block type has specific required/optional fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Flexible Content Block",
        description = "Flexible content block supporting multiple types with block-specific data"
)
public class FlexibleContentBlockRequest {
    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Block type must be: text, heading, image, video, code, quote, embed, or divider"
    )
    @Schema(
            title = "Block Type",
            description = "Type of content block",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"}
    )
    private ArticleBlockType type;

    // Text Block Fields
    @Schema(
            title = "Text Content (for text blocks)",
            example = "Paragraph content"
    )
    private String text;

    // Heading Block Fields
    @Schema(
            title = "Heading Level (for heading blocks)",
            example = "2",
            minimum = "1",
            maximum = "6"
    )
    private Integer level;

    // Image Block Fields
    @Schema(
            title = "File ID (for image/video blocks)",
            description = "ID returned from file upload endpoint",
            example = "image_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL (for image/video blocks)",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Schema(
            title = "Alternative Text (for image blocks)",
            example = "Image description"
    )
    private String alt;

    @Schema(
            title = "Caption (for image/video blocks)",
            example = "Figure 1: Example"
    )
    private String caption;

    @Schema(
            title = "Thumbnail URL",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Width (for image blocks)",
            example = "1920"
    )
    private Integer width;

    @Schema(
            title = "Height (for image blocks)",
            example = "1080"
    )
    private Integer height;

    @Schema(
            title = "Duration (for video blocks, in seconds)",
            example = "120"
    )
    private Integer duration;

    @Schema(
            title = "Title (for video/embed blocks)",
            example = "Tutorial"
    )
    private String title;

    @Schema(
            title = "Description (for video blocks)",
            example = "A tutorial on..."
    )
    private String description;

    // Code Block Fields
    @Schema(
            title = "Code Content (for code blocks)",
            example = "const x = 1;"
    )
    private String code;

    @Schema(
            title = "Programming Language (for code blocks)",
            example = "javascript",
            allowableValues = {
                    "javascript", "python", "java", "cpp", "csharp", "go", "rust",
                    "ruby", "php", "swift", "kotlin", "typescript", "sql", "html",
                    "css", "bash", "shell", "plaintext"
            }
    )
    private String language;

    @Schema(
            title = "Show Line Numbers (for code blocks)",
            example = "true"
    )
    private Boolean showLineNumbers;

    // Quote Block Fields
    @Schema(
            title = "Attribution (for quote blocks)",
            example = "Steve Jobs"
    )
    private String attribution;

    // Embed Block Fields
    @Schema(
            title = "Provider (for embed blocks)",
            example = "youtube",
            allowableValues = {"youtube", "twitter", "vimeo", "codepen", "gist", "instagram"}
    )
    private String provider;

    @Schema(
            title = "Embed URL (for embed blocks)",
            example = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
    private String embedUrl;
}
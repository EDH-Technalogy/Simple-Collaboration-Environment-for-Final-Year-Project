package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Image Block - Images with metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Image Block",
        description = "Image content with metadata",
        example = "{\"type\": \"image\", \"data\": {\"fileId\": \"image_123\", \"fileUrl\": \"https://cdn.../image.jpg\", \"alt\": \"Description\"}}"
)
public class ImageBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "File ID is required")
    @Schema(
            title = "File ID",
            description = "ID returned from file upload endpoint",
            example = "image_12345"
    )
    private String fileId;

    @NotBlank(message = "File URL is required")
    @Schema(
            title = "File URL",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Size(max = 500, message = "Alt text must not exceed 500 characters")
    @Schema(
            title = "Alt Text",
            description = "Alternative text for accessibility",
            example = "Article cover image"
    )
    private String alt;

    @Size(max = 1000, message = "Caption must not exceed 1000 characters")
    @Schema(
            title = "Caption",
            description = "Image caption",
            example = "Figure 1: Example image"
    )
    private String caption;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail version",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Min(value = 1, message = "Width must be positive")
    @Schema(
            title = "Width",
            description = "Image width in pixels",
            example = "1920",
            minimum = "1"
    )
    private Integer width;

    @Min(value = 1, message = "Height must be positive")
    @Schema(
            title = "Height",
            description = "Image height in pixels",
            example = "1080",
            minimum = "1"
    )
    private Integer height;

    public ImageBlockDTO(String type, String fileId, String fileUrl, String alt) {
        this.type = type;
        this.fileId = fileId;
        this.fileUrl = fileUrl;
        this.alt = alt;
    }
}
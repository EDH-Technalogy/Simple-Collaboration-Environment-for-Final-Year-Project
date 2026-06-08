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
        title = "Image Upload Response",
        description = "Response after uploading an image"
)
public class ImageUploadResponse {

    @Schema(
            title = "File ID",
            description = "Unique identifier for the image",
            example = "image_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL",
            description = "CDN URL to access the image",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail version",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Width",
            description = "Image width in pixels",
            example = "1920"
    )
    private Integer width;

    @Schema(
            title = "Height",
            description = "Image height in pixels",
            example = "1080"
    )
    private Integer height;

    @Schema(
            title = "Alt Text",
            description = "Alternative text for accessibility",
            example = "Article cover image"
    )
    private String alt;

    @Schema(
            title = "Caption",
            description = "Image caption"
    )
    private String caption;

    @Schema(
            title = "MIME Type",
            example = "image/jpeg"
    )
    private String mimeType;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "2048576"
    )
    private Long fileSize;

    @Schema(
            title = "Uploaded At",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;
}
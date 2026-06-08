package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * File Upload Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File Upload Response",
        description = "Response after successfully uploading a file"
)
public class FileUploadResponse {

    @Schema(
            title = "File ID",
            description = "Unique identifier for the uploaded file",
            example = "file_12345"
    )
    private String fileId;

    @Schema(
            title = "Original Filename",
            example = "article-cover.jpg"
    )
    private String originalFilename;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "2048576"
    )
    private Long fileSize;

    @Schema(
            title = "MIME Type",
            example = "image/jpeg"
    )
    private String mimeType;

    @Schema(
            title = "CDN URL",
            description = "Public CDN URL to access the file",
            example = "https://cdn.example.com/files/file_12345.jpg"
    )
    private String cdnUrl;

    @Schema(
            title = "File Type",
            description = "Type of file: image, video, document",
            example = "image",
            allowableValues = {"image", "video", "document"}
    )
    private String fileType;

    @Schema(
            title = "Upload Timestamp",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;

    // For images
    @Schema(
            title = "Image Width",
            description = "Only for image files",
            example = "1920"
    )
    private Integer imageWidth;

    @Schema(
            title = "Image Height",
            description = "Only for image files",
            example = "1080"
    )
    private Integer imageHeight;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail image (if available)",
            example = "https://cdn.example.com/files/file_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    // For videos
    @Schema(
            title = "Video Duration",
            description = "Duration in seconds (only for video files)",
            example = "120"
    )
    private Integer videoDurationSeconds;

    @Schema(
            title = "Processing Status",
            description = "Video processing status",
            example = "COMPLETED",
            allowableValues = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
    )
    private String processingStatus;
}
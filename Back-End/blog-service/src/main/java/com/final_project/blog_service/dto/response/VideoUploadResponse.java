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
        title = "Video Upload Response",
        description = "Response after uploading a video"
)
public class VideoUploadResponse {

    @Schema(
            title = "File ID",
            example = "video_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL",
            description = "CDN URL to access the video",
            example = "https://cdn.example.com/files/video_12345.mp4"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to video thumbnail",
            example = "https://cdn.example.com/files/video_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Duration",
            description = "Video duration in seconds",
            example = "120"
    )
    private Integer duration;

    @Schema(
            title = "Title",
            description = "Video title"
    )
    private String title;

    @Schema(
            title = "Description",
            description = "Video description"
    )
    private String description;

    @Schema(
            title = "MIME Type",
            example = "video/mp4"
    )
    private String mimeType;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "52428800"
    )
    private Long fileSize;

    @Schema(
            title = "Processing Status",
            description = "Video processing status",
            example = "PROCESSING",
            allowableValues = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
    )
    private String processingStatus;

    @Schema(
            title = "Uploaded At",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;
}
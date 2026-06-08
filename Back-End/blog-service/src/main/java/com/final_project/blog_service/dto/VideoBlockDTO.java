package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Video Block - Videos with metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Video Block",
        description = "Video content with metadata",
        example = "{\"type\": \"video\", \"data\": {\"fileId\": \"video_123\", \"fileUrl\": \"https://cdn.../video.mp4\", \"duration\": 120}}"
)
public class VideoBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "File ID is required")
    @Schema(
            title = "File ID",
            description = "ID returned from file upload endpoint",
            example = "video_12345"
    )
    private String fileId;

    @NotBlank(message = "File URL is required")
    @Schema(
            title = "File URL",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/video_12345.mp4"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to video thumbnail",
            example = "https://cdn.example.com/files/video_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Min(value = 1, message = "Duration must be positive")
    @Schema(
            title = "Duration",
            description = "Video duration in seconds",
            example = "120",
            minimum = "1"
    )
    private Integer duration;

    @Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(
            title = "Title",
            description = "Video title",
            example = "Tutorial video"
    )
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(
            title = "Description",
            description = "Video description",
            example = "A tutorial on how to do something"
    )
    private String description;

    public VideoBlockDTO(String type, String fileId, String fileUrl, Integer duration) {
        super();
        this.type = type;
        this.fileId = fileId;
        this.fileUrl = fileUrl;
        this.duration = duration;
    }
}


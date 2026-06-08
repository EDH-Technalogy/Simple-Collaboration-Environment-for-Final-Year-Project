package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File Metadata Response",
        description = "Metadata information about a file"
)
public class FileMetadataResponse {

    @Schema(title = "File ID")
    private String fileId;

    @Schema(title = "Original Filename")
    private String originalFilename;

    @Schema(title = "File Size")
    private Long fileSize;

    @Schema(title = "MIME Type")
    private String mimeType;

    @Schema(title = "CDN URL")
    private String cdnUrl;

    @Schema(title = "Thumbnail URL")
    private String thumbnailUrl;

    @Schema(title = "Upload Timestamp")
    private LocalDateTime uploadedAt;

    @Schema(title = "Image Width")
    private Integer imageWidth;

    @Schema(title = "Image Height")
    private Integer imageHeight;

    @Schema(title = "Video Duration")
    private Integer videoDurationSeconds;
}
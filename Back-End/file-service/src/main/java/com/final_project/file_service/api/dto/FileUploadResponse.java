package com.final_project.file_service.api.dto;
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

public class FileUploadResponse {
    private String fileId;

    private String originalFilename;

    private Long fileSize;


    private String mimeType;
    private String cdnUrl;

    private String fileType;

    private LocalDateTime uploadedAt;

    private Integer imageWidth;

    private Integer imageHeight;

    private String thumbnailUrl;

    private Integer videoDurationSeconds;

    private String processingStatus;
}

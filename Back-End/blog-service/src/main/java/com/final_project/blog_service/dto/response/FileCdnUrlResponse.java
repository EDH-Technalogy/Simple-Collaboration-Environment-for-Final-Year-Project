package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * File CDN URL Response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File CDN URL Response",
        description = "CDN URL and metadata for a file"
)
public class FileCdnUrlResponse {

    @Schema(title = "File ID")
    private String fileId;

    @Schema(
            title = "CDN URL",
            description = "Public CDN URL to access the file"
    )
    private String cdnUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "Thumbnail URL (if available)"
    )
    private String thumbnailUrl;

    @Schema(
            title = "URL Expiration",
            description = "When the URL expires (if applicable)",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime expiresAt;
}
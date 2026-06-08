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
        title = "Error Response",
        description = "Standard error response format"
)
public class ErrorResponse {

    @Schema(
            title = "Error Code",
            description = "Error type/code",
            example = "RESOURCE_NOT_FOUND"
    )
    private String error;

    @Schema(
            title = "Error Message",
            description = "Human-readable error message",
            example = "Article not found with ID: article_123"
    )
    private String message;

    @Schema(
            title = "Timestamp",
            description = "When the error occurred",
            example = "2024-01-15T10:50:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime timestamp;

    @Schema(
            title = "Request Path",
            description = "The API path that caused the error",
            example = "/api/v1/articles/article_123"
    )
    private String path;

    @Schema(
            title = "HTTP Status Code",
            description = "HTTP status code",
            example = "404"
    )
    private Integer status;

    @Schema(
            title = "Details",
            description = "Additional error details (for validation errors)",
            example = "{\"title\": \"Title is required\"}",
            nullable = true
    )
    private Object details;
}

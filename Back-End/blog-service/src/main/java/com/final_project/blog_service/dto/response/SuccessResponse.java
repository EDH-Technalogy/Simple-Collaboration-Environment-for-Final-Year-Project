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
        title = "Success Response",
        description = "Generic success response wrapper"
)
public class SuccessResponse<T> {

    @Schema(
            title = "Status",
            description = "Response status",
            example = "success"
    )
    private String status;

    @Schema(
            title = "Message",
            description = "Optional success message",
            example = "Article created successfully"
    )
    private String message;

    @Schema(
            title = "Data",
            description = "Response data"
    )
    private T data;

    @Schema(
            title = "Timestamp",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime timestamp;
}
package com.final_project.blog_service.dto.request;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Create Comment Request",
        description = "Request to post a comment on an article"
)
public class CreateCommentRequest {

    @NotBlank(message = "Comment body is required")
    @Size(min = 1, max = 5000, message = "Comment must be between 1 and 5000 characters")
    @Schema(
            title = "Comment Body",
            description = "The text content of the comment",
            example = "Great article! Very informative.",
            minLength = 1,
            maxLength = 5000
    )
    private String body;
}
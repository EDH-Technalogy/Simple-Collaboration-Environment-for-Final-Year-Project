package com.final_project.blog_service.dto.request;

import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Publish Article Request",
        description = "Request to publish an article"
)
public class PublishArticleRequest {

    @NotNull( message = "should not be null")
    @Schema(
            title = "Visibility",
            description = "Who can see this article",
            example = "PUBLIC",
            allowableValues = {"PUBLIC", "PRIVATE", "UNLISTED"}
    )
    private ArticleVisiblity visibility;
}

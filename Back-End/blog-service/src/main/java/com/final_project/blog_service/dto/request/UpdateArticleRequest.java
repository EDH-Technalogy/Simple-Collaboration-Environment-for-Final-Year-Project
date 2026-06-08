package com.final_project.blog_service.dto.request;
import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Update Article Request",
        description = "Request body for updating an existing blog article"
)
public class UpdateArticleRequest {

    @Size(max = 180)
    private String title;

    @Size(max = 500)
    private String description;

    @Valid
    private List<ArticleBlockRequest> blocks;

    private List<String> tags;

    private ArticleVisiblity visibility;

    private String coverImageFileId;

    private String coverImageUrl;
}

package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Metadata Response",
        description = "Article metadata including tags, category, and SEO info"
)
public class MetadataResponse {

    @ArraySchema(
            schema = @Schema(
                    title = "Tag",
                    example = "javascript",
                    type = "string"
            )
    )
    private List<String> tags;

    @Schema(
            title = "Category",
            example = "Technology"
    )
    private String category;

    @Schema(
            title = "Description",
            description = "SEO meta description"
    )
    private String description;

    @ArraySchema(
            schema = @Schema(
                    title = "Keyword",
                    example = "spring-boot",
                    type = "string"
            )
    )
    private List<String> keywords;

    @Schema(
            title = "Cover Image URL",
            example = "https://cdn.example.com/cover.jpg"
    )
    private String coverImageUrl;
}
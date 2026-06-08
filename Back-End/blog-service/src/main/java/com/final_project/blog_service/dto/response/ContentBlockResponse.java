package com.final_project.blog_service.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Content Block Response",
        description = "A single content block in response"
)
public class ContentBlockResponse {

    @Schema(
            title = "Block Type",
            example = "text"
    )
    private ArticleBlockType type;

    @Schema(
            title = "Block Data",
            example = "{\"text\": \"Content here\"}"
    )
    private JsonNode data;
}
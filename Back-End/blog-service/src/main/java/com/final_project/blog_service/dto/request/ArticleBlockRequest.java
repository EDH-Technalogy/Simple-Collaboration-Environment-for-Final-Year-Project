package com.final_project.blog_service.dto.request;

import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Flexible article content block")
public class ArticleBlockRequest {
    @NotNull
    @Schema(
            description = "Block type",
            example = "TEXT",
            allowableValues = {"TEXT", "HEADING", "IMAGE", "VIDEO", "CODE", "QUOTE", "EMBED", "DIVIDER"}
    )
    private ArticleBlockType type;

    @PositiveOrZero
    @Schema(description = "Block order in article", example = "0")
    private Integer order;

    @NotNull
    @Schema(description = "Flexible block payload. Required fields depend on block type.")
    private Map<String, Object> data;
}

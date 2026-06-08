package com.final_project.blog_service.dto.request;


import com.fasterxml.jackson.databind.JsonNode;
import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
        title = "Content Block Request",
        description = "A single content block (text, image, video, code, quote, embed, etc.)",
        example = "{\"type\": \"text\", \"data\": {\"text\": \"Your content here\"}}"
)
public class ContentBlockRequest {

    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Block type must be one of: text, heading, image, video, code, quote, embed, divider"
    )
    @Schema(
            title = "Block Type",
            description = "The type of content block",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"},
            type = "string"
    )
    private ArticleBlockType type;

    @Schema(
            title = "Block Data",
            description = "Block-specific data structure (varies by type)",
            example = "{\"text\": \"This is a text block\"}"
    )
    private JsonNode data;
}

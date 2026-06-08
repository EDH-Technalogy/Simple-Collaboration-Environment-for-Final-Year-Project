package com.final_project.blog_service.dto;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;


/**
 * Text Block - Simple text content
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Text Block",
        description = "Rich text content block",
        example = "{\"type\": \"text\", \"data\": {\"text\": \"Paragraph text here\"}}"
)
public class TextBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Text content is required")
    @Size(max = 10000, message = "Text must not exceed 10000 characters")
    @Schema(
            title = "Text Content",
            description = "The text content",
            example = "This is a paragraph of article content"
    )
    private String text;

    public TextBlockDTO(String type, String text) {
        this.type = type;
        this.text = text;
    }
}






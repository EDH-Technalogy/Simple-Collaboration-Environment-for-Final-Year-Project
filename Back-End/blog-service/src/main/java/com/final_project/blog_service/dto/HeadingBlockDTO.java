package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Heading Block - Section headers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Heading Block",
        description = "Section heading (h1-h6)",
        example = "{\"type\": \"heading\", \"data\": {\"level\": 2, \"text\": \"Section Title\"}}"
)
public class HeadingBlockDTO extends ContentBlockDTO {

    @NotNull(message = "Heading level is required")
    @Min(value = 1, message = "Heading level must be 1-6")
    @Max(value = 6, message = "Heading level must be 1-6")
    @Schema(
            title = "Heading Level",
            description = "h1 to h6",
            example = "2",
            minimum = "1",
            maximum = "6"
    )
    private Integer level;

    @NotBlank(message = "Heading text is required")
    @Size(max = 500, message = "Heading must not exceed 500 characters")
    @Schema(
            title = "Heading Text",
            example = "Section Title"
    )
    private String text;

    public HeadingBlockDTO(String type, Integer level, String text) {
        this.type = type;
        this.level = level;
        this.text = text;
    }
}
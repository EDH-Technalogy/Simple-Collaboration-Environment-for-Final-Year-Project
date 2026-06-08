package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Quote Block - Quoted text with attribution
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Quote Block",
        description = "Quoted text with optional attribution",
        example = "{\"type\": \"quote\", \"data\": {\"text\": \"Life is 10% what happens and 90% how you react\", \"attribution\": \"Charles Swindoll\"}}"
)
public class QuoteBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Quote text is required")
    @Size(max = 2000, message = "Quote must not exceed 2000 characters")
    @Schema(
            title = "Quote Text",
            example = "Life is 10% what happens to you and 90% how you react to it"
    )
    private String text;

    @Size(max = 500, message = "Attribution must not exceed 500 characters")
    @Schema(
            title = "Attribution",
            description = "Quote author or source",
            example = "Charles R. Swindoll"
    )
    private String attribution;

    public QuoteBlockDTO(String type, String text, String attribution) {
        this.type = type;
        this.text = text;
        this.attribution = attribution;
    }
}
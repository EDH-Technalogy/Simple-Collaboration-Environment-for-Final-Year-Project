package com.final_project.blog_service.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Base Content Block with Type Discriminator
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "type",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextBlockDTO.class, name = "text"),
        @JsonSubTypes.Type(value = HeadingBlockDTO.class, name = "heading"),
        @JsonSubTypes.Type(value = ImageBlockDTO.class, name = "image"),
        @JsonSubTypes.Type(value = VideoBlockDTO.class, name = "video"),
        @JsonSubTypes.Type(value = CodeBlockDTO.class, name = "code"),
        @JsonSubTypes.Type(value = QuoteBlockDTO.class, name = "quote"),
        @JsonSubTypes.Type(value = EmbedBlockDTO.class, name = "embed"),
        @JsonSubTypes.Type(value = DividerBlockDTO.class, name = "divider")
})
@Schema(
        title = "Content Block",
        description = "Flexible content block for article composition",
        oneOf = {
                TextBlockDTO.class,
                HeadingBlockDTO.class,
                ImageBlockDTO.class,
                VideoBlockDTO.class,
                CodeBlockDTO.class,
                QuoteBlockDTO.class,
                EmbedBlockDTO.class,
                DividerBlockDTO.class
        }
)
public class ContentBlockDTO {
    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Invalid block type"
    )
    @Schema(
            title = "Block Type",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"}
    )
    protected String type;

}


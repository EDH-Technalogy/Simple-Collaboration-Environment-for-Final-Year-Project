package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Embed Block - External embeds (YouTube, Twitter, etc.)
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Embed Block",
        description = "External content embed",
        example = "{\"type\": \"embed\", \"data\": {\"provider\": \"youtube\", \"embedUrl\": \"https://www.youtube.com/embed/dQw4w9WgXcQ\"}}"
)
public class EmbedBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Provider is required")
    @Pattern(
            regexp = "^(youtube|twitter|vimeo|codepen|gist|instagram)$",
            message = "Invalid provider"
    )
    @Schema(
            title = "Provider",
            description = "Embed service provider",
            example = "youtube",
            allowableValues = {"youtube", "twitter", "vimeo", "codepen", "gist", "instagram"}
    )
    private String provider;

    @NotBlank(message = "Embed URL is required")
    @Schema(
            title = "Embed URL",
            description = "URL to embed content",
            example = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
    private String embedUrl;

    @Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(
            title = "Title",
            description = "Embed title",
            example = "Tutorial video"
    )
    private String title;

    public EmbedBlockDTO(String type, String provider, String embedUrl) {
        this.type = type;
        this.provider = provider;
        this.embedUrl = embedUrl;
    }
}
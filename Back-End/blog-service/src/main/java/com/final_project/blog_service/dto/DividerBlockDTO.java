package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Divider Block - Visual separator
 */
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Divider Block",
        description = "Visual divider/separator",
        example = "{\"type\": \"divider\", \"data\": {}}"
)
public class DividerBlockDTO extends ContentBlockDTO {

    public DividerBlockDTO(String type) {
        this.type = type;
    }
}
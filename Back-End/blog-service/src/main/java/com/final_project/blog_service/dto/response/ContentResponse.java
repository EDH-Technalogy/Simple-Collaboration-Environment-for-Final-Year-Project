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
        title = "Content Response",
        description = "Article content with blocks and metadata"
)
public class ContentResponse {

    @ArraySchema(
            schema = @Schema(implementation = ContentBlockResponse.class),
            minItems = 1
    )
    private List<ContentBlockResponse> blocks;

    @Schema(
            title = "Estimated Read Time",
            description = "Time to read in minutes",
            example = "5"
    )
    private Integer estimatedReadTime;
}
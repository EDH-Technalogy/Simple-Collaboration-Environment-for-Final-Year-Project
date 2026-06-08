package com.final_project.blog_service.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
        title = "Search Article Request",
        description = "Request for full-text search on articles"
)
public class SearchArticleRequest {

    @NotBlank(message = "Search query is required")
    @Schema(
            title = "Query",
            description = "The search query string",
            example = "spring boot mongodb",
            minLength = 1
    )
    private String query;

    @Schema(
            title = "Tags",
            description = "Filter by specific tags",
            example = "[\"java\", \"spring\"]"
    )
    private List<String> tags;

    @Schema(
            title = "Category",
            description = "Filter by category",
            example = "Technology"
    )
    private String category;

    @Min(value = 0, message = "Page must be >= 0")
    @Schema(
            title = "Page",
            description = "Page number (zero-indexed)",
            example = "0",
            minimum = "0"
    )
    private Integer page;

    @Min(value = 1, message = "Page size must be >= 1")
    @Max(value = 100, message = "Page size must be <= 100")
    @Builder.Default
    @Schema(
            title = "Page Size",
            description = "Number of results per page",
            example = "20",
            minimum = "1",
            maximum = "100"
    )
    private Integer pageSize = 20;

    @Pattern(
            regexp = "^(relevance|recent|trending)$",
            message = "Sort by must be one of: relevance, recent, trending"
    )
    @Builder.Default
    @Schema(
            title = "Sort By",
            description = "Sort order for results",
            example = "relevance",
            allowableValues = {"relevance", "recent", "trending"}
    )
    private String sortBy = "relevance";
}
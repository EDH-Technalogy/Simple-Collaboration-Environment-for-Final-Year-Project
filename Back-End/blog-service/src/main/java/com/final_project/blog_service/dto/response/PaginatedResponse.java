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
        title = "Paginated Response",
        description = "Generic paginated response wrapper"
)
public class PaginatedResponse<T> {

    @ArraySchema(
            schema = @Schema(implementation = Object.class),
            arraySchema = @Schema(
                    title = "Data",
                    description = "Array of items on this page"
            )
    )
    private List<T> data;

    @Schema(
            title = "Pagination",
            description = "Pagination metadata"
    )
    private PaginationMetadata pagination;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(
            title = "Pagination Metadata",
            description = "Metadata about pagination"
    )
    public static class PaginationMetadata {

        @Schema(
                title = "Current Page",
                description = "Zero-indexed page number",
                example = "0"
        )
        private Integer page;

        @Schema(
                title = "Page Size",
                description = "Number of items per page",
                example = "20"
        )
        private Integer pageSize;

        @Schema(
                title = "Total Count",
                description = "Total number of items across all pages",
                example = "150"
        )
        private Long totalCount;

        @Schema(
                title = "Total Pages",
                description = "Total number of pages",
                example = "8"
        )
        private Integer totalPages;

        @Schema(
                title = "Has Next",
                description = "Whether there are more pages",
                example = "true"
        )
        private Boolean hasNext;

        @Schema(
                title = "Has Previous",
                description = "Whether there are previous pages",
                example = "false"
        )
        private Boolean hasPrevious;

        @Schema(
                title = "Next Cursor",
                description = "Cursor for next page (if using cursor pagination)",
                example = "article_150",
                nullable = true
        )
        private String nextCursor;

        @Schema(
                title = "Previous Cursor",
                description = "Cursor for previous page",
                example = "article_20",
                nullable = true
        )
        private String previousCursor;
    }
}

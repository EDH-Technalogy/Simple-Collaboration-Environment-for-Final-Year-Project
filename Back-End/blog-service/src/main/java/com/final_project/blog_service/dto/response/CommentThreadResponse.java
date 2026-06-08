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
        title = "Comment Thread Response",
        description = "A comment with its nested replies (threaded structure)"
)
public class CommentThreadResponse {

    @Schema(
            title = "Comment",
            description = "The main comment"
    )
    private CommentResponse comment;

    @ArraySchema(
            schema = @Schema(implementation = CommentThreadResponse.class),
            arraySchema = @Schema(
                    title = "Replies",
                    description = "Nested replies to this comment"
            )
    )
    private List<CommentThreadResponse> replies;
}

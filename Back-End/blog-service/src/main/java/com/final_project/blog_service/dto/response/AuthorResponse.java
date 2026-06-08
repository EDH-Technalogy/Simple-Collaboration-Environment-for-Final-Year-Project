package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Author Response",
        description = "Author profile information"
)
public class AuthorResponse {

    @Schema(
            title = "Author ID",
            example = "user_123"
    )
    private String id;

    @Schema(
            title = "Author Display Name",
            example = "John Doe"
    )
    private String displayName;

    @Schema(
            title = "Author Profile Image",
            example = "https://cdn.example.com/profiles/john.jpg"
    )
    private String profileImageUrl;

    @Schema(
            title = "Total Articles",
            description = "Number of articles written by this author",
            example = "15"
    )
    private Long totalArticles;
    private String email;
    private String username;
}

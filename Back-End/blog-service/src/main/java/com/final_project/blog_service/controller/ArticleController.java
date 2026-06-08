package com.final_project.blog_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.blog_service.dto.request.*;
import com.final_project.blog_service.dto.response.*;
import com.final_project.blog_service.service.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.tags.Tags;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@Tags({
        @Tag(
                name = "Articles",
                description = "Article management endpoints - create, read, update, publish articles"
        )
})
public class ArticleController {

    private final ArticleService articleService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/with-files/author/{author}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Create article with files",
            description = "Creates a flexible article and uploads cover/inline files through file-service"
    )
    public ResponseEntity<ArticleResponse> createArticleWithFiles(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam("blocks") String blocksJson,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            @RequestPart(value = "inlineFiles", required = false) List<MultipartFile> inlineFiles,
            @RequestParam(value = "tags") String tags,
            @RequestParam(value = "visibility", required = false) String visibility,
            @PathVariable String author
    ) {
        ArticleResponse response = articleService.createArticleWithFiles(
                title,
                description,
                subtitle,
                tags,
                blocksJson,
                coverImage,
                inlineFiles,
                visibility,
                author
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create article with JSON only.
     *
     * Endpoint:
     * POST /api/v1/articles
     */
    @PostMapping(value = "/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Create article with JSON",
            description = "Creates an article using application/json.",
            tags = {"Articles"},
            operationId = "createArticleJson"
    )
    public ResponseEntity<ArticleResponse> createArticleJson(
            @Valid @RequestBody CreateArticleRequest request,
            @PathVariable String userId
    ) {
        ArticleResponse response = articleService.createArticle(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create draft article for a specific user.
     *
     * Endpoint:
     * POST /api/v1/articles/drafts/users/{userId}
     */
    @PostMapping("/drafts/users/{userId}")
    @Operation(
            summary = "Create draft article for user",
            description = "Creates a new draft article for a specific user.",
            tags = {"Articles"},
            operationId = "createDraftArticleForUser"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Article created successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ArticleResponse.class)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Invalid request - validation failed"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ArticleResponse> createDraftArticleForUser(
            @Valid @RequestBody CreateArticleRequest request,
            @PathVariable String userId
    ) {
        ArticleResponse response = articleService.createArticle(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get published articles feed.
     *
     * Endpoint:
     * GET /api/v1/articles?page=0&pageSize=20
     */
    @GetMapping
    @Operation(
            summary = "Get published articles",
            description = "Retrieves a paginated list of all published articles.",
            tags = {"Articles"},
            operationId = "getPublishedArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getPublishedArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "search", required = false) String search
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getPublishedArticles(page, pageSize, firstNonBlank(q, search));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public")
    @Operation(
            summary = "Get public published articles",
            description = "Retrieves public published articles without requiring a reader session.",
            tags = {"Articles"},
            operationId = "getPublicPublishedArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getPublicPublishedArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "search", required = false) String search
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getPublishedArticles(page, pageSize, firstNonBlank(q, search));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/all")
    @Operation(
            summary = "Get all articles for admin moderation",
            description = "Retrieves drafts, published, and archived articles for the admin review desk.",
            tags = {"Articles"},
            operationId = "getAllArticlesForAdmin"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getAllArticlesForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getAllArticlesForAdmin(page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Get article by ID.
     *
     * Endpoint:
     * GET /api/v1/articles/{articleId}
     */
    @GetMapping("/{articleId}")
    @Operation(
            summary = "Get article by ID",
            description = "Retrieves a single article by its ID.",
            tags = {"Articles"},
            operationId = "getArticleById"
    )
    public ResponseEntity<ArticleResponse> getArticleById(
            @PathVariable String articleId
    ) {
        ArticleResponse response = articleService.getArticleById(articleId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/{articleId}")
    @Operation(
            summary = "Get public published article by ID",
            description = "Retrieves one published public article without requiring a reader session.",
            tags = {"Articles"},
            operationId = "getPublicArticleById"
    )
    public ResponseEntity<ArticleResponse> getPublicArticleById(
            @PathVariable String articleId
    ) {
        ArticleResponse response = articleService.getPublishedArticleById(articleId);
        return ResponseEntity.ok(response);
    }
    /**
     * Update article with multipart/form-data.
     *
     * Endpoint:
     * PUT /api/v1/articles/{articleId}
     */
    @PutMapping(value = "/with-file/{articleId}/author/{authorId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Update article with files",
            description = "Updates an article using multipart/form-data.",
            tags = {"Articles"},
            operationId = "updateArticleWithFiles"
    )
    public ResponseEntity<ArticleResponse> updateArticleWithFiles(
            @PathVariable String articleId,
            @RequestPart("article") String articleJsonString,
            @PathVariable String authorId

    ) {

        try {
            UpdateArticleRequest request = objectMapper.readValue(
                    articleJsonString,
                    UpdateArticleRequest.class
            );

            ArticleResponse response = articleService.updateArticle(articleId, authorId, request);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid article JSON format", e);
        }
    }

    /**
     * Update article with JSON only.
     *
     * Endpoint:
     * PUT /api/v1/articles/{articleId}
     */
    @PutMapping(value = "/{articleId}/author/{authorId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Update article with JSON",
            description = "Updates an existing article using application/json.",
            tags = {"Articles"},
            operationId = "updateArticleJson"
    )
    public ResponseEntity<ArticleResponse> updateArticleJson(
            @PathVariable String articleId,
            @Valid @RequestBody UpdateArticleRequest request,
            @PathVariable String authorId
    ) {

        ArticleResponse response = articleService.updateArticle(articleId, authorId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Publish article.
     *
     * Endpoint:
     * PATCH /api/v1/articles/{articleId}/publish
     */
    @PatchMapping("/publish/{articleId}/author/{authorId}")
    @Operation(
            summary = "Publish article",
            description = "Publishes a draft article.",
            tags = {"Articles"},
            operationId = "publishArticle"
    )

    public ResponseEntity<ArticleResponse> publishArticle(
            @PathVariable String articleId,
            @Valid @RequestBody PublishArticleRequest request,
            @PathVariable String authorId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String user = jwt.getSubject();
        ArticleResponse response = articleService.publishArticle(articleId, authorId, request, user);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete/archive article.
     *
     * Endpoint:
     * DELETE /api/v1/articles/{articleId}
     */
    @DeleteMapping("/{articleId}/author/{authorId}")
    @Operation(
            summary = "Delete article",
            description = "Soft deletes or archives an article.",
            tags = {"Articles"},
            operationId = "deleteArticle"
    )
    public ResponseEntity<Void> deleteArticle(
            @PathVariable String articleId,
            @PathVariable String authorId
    ) {
        articleService.deleteArticle(articleId, authorId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get author's articles.
     * by viewer
     *
     * Endpoint:
     * GET /api/v1/articles/authors/{authorId}?page=0&pageSize=20
     */
    @GetMapping("/authors/{authorId}")
    @Operation(
            summary = "Get author's articles",
            description = "Retrieves all published articles by a specific author.",
            tags = {"Articles"},
            operationId = "getAuthorArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getAuthorArticles(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getUserArticles(authorId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/authors/{authorId}/published")
    @Operation(
            summary = "Get author's articles",
            description = "Retrieves all published articles by a specific author.",
            tags = {"Articles"},
            operationId = "getAuthorArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getAuthorsPublishedArticle(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getPublishedUserArticles(authorId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Get author's specific article.
     *
     * Endpoint:
     * GET /api/v1/articles/authors/{authorId}/articles/{articleId}
     */
    @GetMapping("/authors/{authorId}/articles/{articleId}")
    @Operation(
            summary = "Get author's specific article",
            description = "Retrieves a specific article by author ID and article ID.",
            tags = {"Articles"},
            operationId = "getAuthorArticleById"
    )
    public ResponseEntity<ArticleResponse> getAuthorArticleById(
            @PathVariable String authorId,
            @PathVariable String articleId
    ) {
        ArticleResponse response = articleService.getArticleByAuthorAndId(authorId, articleId);
        return ResponseEntity.ok(response);
    }

    /**
     * Post comment.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/comments
     */
    @PostMapping("/{articleId}/comments")
    @Operation(
            summary = "Post comment",
            description = "Posts a top-level comment on an article.",
            tags = {"Comments"},
            operationId = "postComment"
    )
    public ResponseEntity<CommentResponse> postComment(
            @PathVariable String articleId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        CommentResponse response = articleService.postComment(articleId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get article comments.
     *
     * Endpoint:
     * GET /api/v1/articles/{articleId}/comments?page=0&pageSize=10
     */
    @GetMapping("/{articleId}/comments")
    @Operation(
            summary = "Get article comments",
            description = "Retrieves all comments on an article.",
            tags = {"Comments"},
            operationId = "getArticleComments"
    )
    public ResponseEntity<PaginatedResponse<CommentThreadResponse>> getArticleComments(
            @PathVariable String articleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        PaginatedResponse<CommentThreadResponse> response = articleService.getArticleComments(articleId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Reply to comment.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/comments/{parentCommentId}/replies
     */
    @PostMapping("/{articleId}/comments/{parentCommentId}/replies")
    @Operation(
            summary = "Reply to comment",
            description = "Posts a reply to an existing comment.",
            tags = {"Comments"},
            operationId = "replyToComment"
    )
    public ResponseEntity<CommentResponse> replyToComment(
            @PathVariable String articleId,
            @PathVariable String parentCommentId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        CommentResponse response = articleService.replyToComment(articleId, parentCommentId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Delete comment.
     *
     * Endpoint:
     * DELETE /api/v1/articles/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    @Operation(
            summary = "Delete comment",
            description = "Soft deletes a comment.",
            tags = {"Comments"},
            operationId = "deleteComment"
    )
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        articleService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Like article.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/likes
     */
    @PostMapping("/{articleId}/likes")
    @Operation(
            summary = "Like article",
            description = "Adds a like to an article.",
            tags = {"Engagement"},
            operationId = "likeArticle"
    )
    public ResponseEntity<LikeResponse> likeArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        LikeResponse response = articleService.likeArticle(articleId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{articleId}/likes/me")
    @Operation(
            summary = "Check current user's article like",
            description = "Returns whether the authenticated user has liked this article.",
            tags = {"Engagement"},
            operationId = "hasCurrentUserLikedArticle"
    )
    public ResponseEntity<Map<String, Object>> hasCurrentUserLikedArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        boolean liked = articleService.hasUserLikedArticle(articleId, userId);
        return ResponseEntity.ok(Map.of(
                "articleId", articleId,
                "userId", userId,
                "liked", liked
        ));
    }

    /**
     * Unlike article.
     *
     * Endpoint:
     * DELETE /api/v1/articles/{articleId}/likes
     */
    @DeleteMapping("/{articleId}/likes")
    @Operation(
            summary = "Unlike article",
            description = "Removes a like from an article.",
            tags = {"Engagement"},
            operationId = "unlikeArticle"
    )
    public ResponseEntity<Void> unlikeArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        articleService.unlikeArticle(articleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Share article.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/shares
     */
    @PostMapping("/{articleId}/shares")
    @Operation(
            summary = "Share article",
            description = "Tracks sharing of an article.",
            tags = {"Engagement"},
            operationId = "shareArticle"
    )
    public ResponseEntity<ShareResponse> shareArticle(
            @PathVariable String articleId,
            @Valid @RequestBody ShareRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        ShareResponse response = articleService.shareArticle(articleId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private CreateArticleWithFilesRequest processAndMapFiles(
            CreateArticleWithFilesRequest request,
            MultipartFile coverImage,
            MultipartFile[] additionalFiles,
            String userId
    ) {
        if (coverImage != null && !coverImage.isEmpty()) {
            log.debug("Cover image provided but should be uploaded separately");
        }

        return request;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}

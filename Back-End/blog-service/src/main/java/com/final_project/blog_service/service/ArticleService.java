package com.final_project.blog_service.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.blog_service.client.FileServiceClient;
import com.final_project.blog_service.client.UserServiceClient;
import com.final_project.blog_service.dto.request.*;
import com.final_project.blog_service.dto.response.*;
import com.final_project.blog_service.event.BlogInteractionEvent;
import com.final_project.blog_service.exception.ResourceNotFoundException;
import com.final_project.blog_service.exception.UnauthorizedException;
import com.final_project.blog_service.exception.UserNotFoundException;
import com.final_project.blog_service.exception.UserServiceUnavailableException;
import com.final_project.blog_service.kafka.KafkaProducer;
import com.final_project.blog_service.utile.ContentBlockValidator;
import com.final_project.blog_service.utile.ReadTimeCalculator;
import com.final_project.blog_service.utile.SlugUtil;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.final_project.blog_service.dto.*;
import  com.final_project.blog_service.model.*;
import com.final_project.blog_service.repo.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;

/**
 * Article Service - Core business logic for article management
 * Handles: create, update, publish, delete articles and comments
 */
@Slf4j
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ShareRepository shareRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final FileServiceClient fileServiceClient;
    private final UserServiceClient userServiceClient;
    private final KafkaProducer kafkaProducer;
    private final ObjectMapper objectMapper;
    private final ContentBlockValidator contentBlockValidator;
    private final ReadTimeCalculator readTimeCalculator;
    private final FileUploadService fileUploadService;
    private final ArticleViewRepository articleViewRepository;

    public ArticleService(ArticleRepository articleRepository,
                          CommentRepository commentRepository,
                          ReadTimeCalculator readTimeCalculator,
                          LikeRepository likeRepository,
                          RedisTemplate<String, String> redisTemplate,
                          FileServiceClient fileServiceClient,
                          UserServiceClient userServiceClient,
                          KafkaProducer kafkaProducer,
                          ObjectMapper objectMapper,
                          ShareRepository shareRepository,
                          ContentBlockValidator contentBlockValidator,
                          FileUploadService fileUploadService,
                          ArticleViewRepository articleViewRepository

    ){
        this.fileUploadService = fileUploadService;
        this.articleViewRepository = articleViewRepository;
        this.readTimeCalculator = readTimeCalculator;
        this.contentBlockValidator = contentBlockValidator;
        this.articleRepository = articleRepository;
        this.commentRepository = commentRepository;
        this.fileServiceClient = fileServiceClient;
        this.likeRepository = likeRepository;
        this.objectMapper = objectMapper;
        this.shareRepository = shareRepository;
        this.redisTemplate = redisTemplate;
        this.userServiceClient = userServiceClient;
        this.kafkaProducer = kafkaProducer;

    }

    private static final String ARTICLE_CACHE_KEY = "article:";
    private static final String ARTICLE_STATS_CACHE_KEY = "article:stats:";
    private static final int CACHE_TTL_MINUTES = 5;
    /**
     * Create a new draft article
     */

    @Transactional
    public ArticleResponse createArticle(CreateArticleRequest request, String authorId) {
           UserAuthorResponse author =  userServiceClient.getUserAuthor(authorId);
           log.info(author.getEmail());
////        fix this and it might cause errors
        contentBlockValidator.validate(request.getBlocks());
        validateFileReferences(request.getBlocks(), author.getId());

        Article article = Article.builder()
                .id(request.getId())
                .authorId(author.getId())
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .slug(generateUniqueSlug(request.getTitle()))
                .metadata(
                        Metadata
                                .builder()
                                .tags(request.getTags())
                                .coverImageUrl(request.getCoverImageUrl())
                                .description(request.getDescription())
                                .keywords(request.getKeywords())
                                .build()
                )
                .content(
                        Content
                                .builder()
                                .estimatedReadTime(
                                        readTimeCalculator.calculateFromBlocks(request.getBlocks()))
                                .blocks(request
                                        .getBlocks()
                                        .stream()
                                        .map((req) ->
                                                ContentBlock
                                                        .builder()
                                                        .type(req.getType())
                                                        .order(req.getOrder())
                                                        .data(req.getData())
                                                        .build()
                                        ).toList()
                                )
                                .build()
                )
                .stats(
                        Stats.builder()
                                .reads(0L)
                                .views(0L)
                                .likes(0L)
                                .commentCount(0L)
                                .shareCount(0L)
                                .build()
                )
                .coverImageFileId(request.getCoverImageFileId())
                .coverImageUrl(request.getCoverImageUrl())
                .visibility(request.getVisibility())
                .status(ArticleStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Article saved = articleRepository.save(article);
        return mapToResponse(saved);
    }


    @Transactional
    public ArticleResponse createArticleWithFiles(
            String title,
            String description,
            String subtitle,
            String tags,
            String blocksJson,
            MultipartFile coverImage,
            List<MultipartFile> inlineFiles,
            String visibility,
            String authorId
    ) {
        try {
            String articleId = new ObjectId().toHexString();
            List<MultipartFile> safeInlineFiles = inlineFiles == null ? List.of() : inlineFiles;
            List<ArticleBlockRequest> blocks = objectMapper.readValue(
                    blocksJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<ArticleBlockRequest>>() {}
            );

            List<String> mappedTags = objectMapper.readValue(tags, new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){});

            String coverFileId = null;
            String coverUrl = null;

            if (coverImage != null && !coverImage.isEmpty()) {
                FileUploadResponse cover = fileUploadService.uploadArticleImage(coverImage, authorId, articleId);
                coverFileId = cover.getFileId();
                coverUrl = cover.getCdnUrl();
            }

            if (!safeInlineFiles.isEmpty()) {
                for (ArticleBlockRequest block : blocks) {
                    if ((block.getType() == ArticleBlockType.IMAGE || block.getType() == ArticleBlockType.VIDEO)
                            && block.getData().containsKey("uploadIndex")) {

                        int index = ((Number) block.getData().get("uploadIndex")).intValue();
                        MultipartFile file = safeInlineFiles.get(index);

                        FileUploadResponse uploaded = block.getType() == ArticleBlockType.IMAGE
                                ? fileUploadService.uploadArticleImage(file, authorId, articleId)
                                : fileUploadService.uploadArticleVideo(file, authorId, articleId);


                        block.getData().put("fileId", uploaded.getFileId());
                        block.getData().put("url", uploaded.getCdnUrl());
                        block.getData().remove("uploadIndex");
                    }
                }
            }

            CreateArticleRequest request = CreateArticleRequest.builder()
                    .id(articleId)
                    .title(title)
                    .subtitle(subtitle)
                    .description(description)
                    .keywords(extractKeywords(title, description))
                    .tags(mappedTags)
                    .blocks(blocks)
                    .coverImageFileId(coverFileId)
                    .coverImageUrl(coverUrl)
                    .visibility(parseVisibility(visibility))
                    .build();

            return createArticle(request, authorId);

        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid multipart article request: " + ex.getMessage(), ex);
        }
    }

    /**
     * Update article (draft or published)
     */
    @Transactional
    public ArticleResponse updateArticle(String articleId, String authorId, UpdateArticleRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        validateAuthor(article, authorId);


        article.setTitle(request.getTitle());
        article
                .getContent()
                        .setBlocks(
                                request
                                        .getBlocks()
                                        .stream()
                                        .map((req) -> ContentBlock
                                                .builder()
                                                .order(req.getOrder())
                                                .type(req.getType())
                                                .data(req.getData())
                                                .build()
                                        ).toList()
                        );
        article.getContent().setEstimatedReadTime(readTimeCalculator.calculateFromBlocks(request.getBlocks()));
        article.getMetadata().setTags(request.getTags());
        article.getMetadata().setDescription(request.getDescription());
        article.getMetadata().setCoverImageUrl(request.getCoverImageUrl());
        article.setUpdatedAt(LocalDateTime.now());
        addEditHistory(article, authorId, "Updated content");
        Article updated = articleRepository.save(article);
        invalidateCache(articleId);
        return mapToResponse(updated);
    }

    /**
     * Publish an article (transition from DRAFT to PUBLISHED)
     */
    @Transactional
    public ArticleResponse publishArticle(String articleId, String authorId, PublishArticleRequest request, String user) {
        UserProfileResponse actor = userServiceClient.getUserProfile(user);
        if (actor == null) {
            throw new UnauthorizedException("Invliad Credentials");
        }

        Article article = getArticleByIdOrThrow(articleId);
        UserAuthorResponse author = userServiceClient.getUserAuthor(authorId);

        if(author == null) {
            throw new ResourceNotFoundException("Author Not Exist");
        }

        validateAuthor(article, authorId);
        if (!ArticleStatus.DRAFT.equals(article.getStatus())) {
            throw new IllegalStateException("Only draft articles can be published");
        }

        article.setStatus(ArticleStatus.PUBLISHED);
        article.setVisibility(request.getVisibility());
        article.setPublishedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        addEditHistory(article, authorId, "Published article");
        Article published = articleRepository.save(article);
        invalidateCache(articleId);
        kafkaProducer.produce(
                BlogInteractionEvent
                        .builder()
                        .eventId(UUID.randomUUID().toString())
                        .occurredAt(LocalDateTime.now())
                        .authorEmail(author.getEmail())
                        .authorName(author.getUserName())
                        .actorName(actor.getDisplayName())
                        .actorUserId(actor.getId())
                        .actorEmail(actor.getEmail())
                        .authorUserId(author.getId())

                        .blogPostId(article.getId())
                        .blogPostUrl("/story/" + article.getId())

                        .blogPostTitle(article.getTitle())
                        .eventType(ArticleEventType.ARTICLE_PUBLISHED)
                        .metadata(Map.of(
                                "uiPath", "/author/publish/" + article.getId(),
                                "publicPath", "/story/" + article.getId(),
                                "articleId", article.getId(),
                                "articleStatus", "PUBLISHED"
                        ))
                        .build()
        );
        return mapToResponse(published);
    }

    /**
     * Get article by ID (with cache)
     */
    @Transactional
    public ArticleResponse getArticleById(String articleId) {
        return getArticleById(articleId, null);
    }

    @Transactional
    public ArticleResponse getArticleById(String articleId, String viewerKey) {
        String cacheKey = ARTICLE_CACHE_KEY + articleId;

        // Try cache first
        String cachedArticle = redisTemplate.opsForValue().get(cacheKey);
        if (cachedArticle != null) {
            log.debug("Cache hit for article: {}", articleId);
            // Would deserialize here in production
        }

        Article article = getArticleByIdOrThrow(articleId);

        // Cache the result
        redisTemplate.opsForValue().set(cacheKey, article.getId(), CACHE_TTL_MINUTES, TimeUnit.MINUTES);

        // Increment views asynchronously
        incrementViewsAsync(articleId, viewerKey);

        return mapToResponse(article);
    }

    private ArticleVisiblity parseVisibility(String value) {
        if (value == null || value.isBlank()) {
            return ArticleVisiblity.PUBLIC;
        }
        try {
            return ArticleVisiblity.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ArticleVisiblity.PUBLIC;
        }
    }

    @Transactional
    public ArticleResponse getPublishedArticleById(String articleId) {
        return getPublishedArticleById(articleId, null);
    }

    @Transactional
    public ArticleResponse getPublishedArticleById(String articleId, String viewerKey) {
        Article article = articleRepository.findByIdAndStatsIsPublish(articleId);
        if (article == null) {
            throw new ResourceNotFoundException("Published article not found: " + articleId);
        }
        incrementViewsAsync(articleId, viewerKey);
        return mapToResponse(article);
    }

    /**
     * Get article by slug (for URL routing)
     */
    @Transactional(readOnly = true)
    public ArticleResponse getArticleBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + slug));

        return mapToResponse(article);
    }

    /**
     * Get user's articles with pagination
     * for admin only
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getUserArticles(String authorId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Article> articles = articleRepository.findByAuthorId(
                authorId,
                pageable
        );

        return mapToPaginatedResponse(articles, page, pageSize);
    }

    /**
     * Get user's articles with pagination
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getPublishedUserArticles(String authorId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Article> articles = articleRepository.findByAuthorIdAndStatusOrderByPublishedAtDesc(
                authorId,
                ArticleStatus.PUBLISHED,
                pageable
        );

        return mapToPaginatedResponse(articles, page, pageSize);
    }


    /**
     * Get published articles feed (paginated)
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getPublishedArticles(int page, int pageSize) {
        return getPublishedArticles(page, pageSize, null);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getPublishedArticles(int page, int pageSize, String search) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Article> articles = search == null || search.isBlank()
                ? articleRepository.findPublishedArticles(pageable)
                : articleRepository.searchPublishedArticles(search.trim(), pageable);

        return mapToPaginatedResponse(articles, page, pageSize);
    }

    /**
     * Get every article for admin moderation, including drafts awaiting review.
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getAllArticlesForAdmin(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Article> articles = articleRepository.findAll(pageable);
        return mapToPaginatedResponse(articles, page, pageSize);
    }

    /**
     * Soft delete article (archive)
     */
    @Transactional
    public void deleteArticle(String articleId, String authorId) {
        Article article = getArticleByIdOrThrow(articleId);
        validateAuthor(article, authorId);

        log.info("Archiving article: {}", articleId);

        article.setStatus(ArticleStatus.ARCHIVED);
        article.setArchivedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());

        articleRepository.save(article);
        invalidateCache(articleId);
    }


    /**
     * Post a comment on an article
     */
    @Transactional
    public CommentResponse postComment(String articleId, String writerId, CreateCommentRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        UserAuthorResponse writer = userServiceClient.getUserAuthor(writerId);
        if(writer == null){
            throw new ResourceNotFoundException("User Not Found");
        }
        UserAuthorResponse author = userServiceClient.getUserAuthor(article.getAuthorId());
        if (author == null){
            throw new ResourceNotFoundException("Not FOund user");
        }
        Comment comment = Comment.builder()
                .articleId(articleId)
                .parentCommentId(null)  // Top-level comment
                .authorId(writer.getId())
                .author(Comment.Author.builder()
                        .displayName(writer.getUserName())
                        .profileImageUrl(writer.getProfile())
                        .build())
                .body(request.getBody())
                .status(CommentStatus.PUBLISHED)
                .engagement(Comment.Engagement.builder()
                        .likes(0L)
                        .replyCount(0L)
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Comment saved = commentRepository.save(comment);

        // Update article comment count
        article.getStats().setCommentCount(article.getStats().getCommentCount() + 1);
        articleRepository.save(article);
        invalidateCache(articleId);

        kafkaProducer.produce(
                BlogInteractionEvent
                        .builder()
                        .occurredAt(LocalDateTime.now())
                        .commentId(saved.getId())
                        .eventId(UUID.randomUUID().toString())
                        .eventType(ArticleEventType.COMMENT_CREATED)
                        .blogPostTitle(article.getTitle())
                        .blogPostId(articleId)
                        .blogPostUrl("/api/v1/articles/"+articleId+"/comments")


                        .authorUserId(author.getId())
                        .authorName(author.getUserName())
                        .authorEmail(author.getEmail())

                        .actorEmail(writer.getEmail())
                        .actorName(writer.getUserName())
                        .actorUserId(writer.getId())
                        .profile(writer.getProfile())
                        .commentSnippet(saved.getBody())
                        .authorUserId(article.getAuthorId())
                        .build()
        );

        log.info("Comment posted on article: {}", articleId);

        return mapCommentToResponse(saved);
    }

    /**
     * Reply to a comment
     */
    @Transactional
    public CommentResponse replyToComment(String articleId, String parentCommentId,
                                          String writerId, CreateCommentRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        Comment parentComment = getCommentByIdOrThrow(parentCommentId);
        UserProfileResponse replier = userServiceClient.getUserProfile(writerId);

        if (replier == null){
            throw new  ResourceNotFoundException("User Not Found");
        }

        UserProfileResponse parentOwner = userServiceClient.getUserProfile(parentComment.getAuthorId());
        if (parentOwner == null){
            throw new ResourceNotFoundException("Parent comment author not found");
        }

        Comment reply = Comment.builder()
                .articleId(articleId)
                .parentCommentId(parentCommentId)
                .authorId(replier.getId())
                .body(request.getBody())
                .status(CommentStatus.PUBLISHED)
                .author(Comment.Author
                        .builder()
                        .displayName(replier.getDisplayName() != null && !replier.getDisplayName().isBlank()
                                ? replier.getDisplayName()
                                : replier.getUsername())
                        .profileImageUrl(replier.getProfile())
                        .build())
                .engagement(Comment.Engagement.builder()
                        .likes(0L)
                        .replyCount(0L)
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Comment saved = commentRepository.save(reply);

        // Update parent comment reply count
        parentComment.getEngagement().setReplyCount(parentComment.getEngagement().getReplyCount() + 1);
        commentRepository.save(parentComment);

        // Update article comment count
        article.getStats().setCommentCount(article.getStats().getCommentCount() + 1);
        articleRepository.save(article);
        invalidateCache(articleId);

        // COMMENT_REPLIED
        kafkaProducer.produce(
                BlogInteractionEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(ArticleEventType.COMMENT_REPLIED)
                        .occurredAt(LocalDateTime.now())

                        .blogPostId(articleId)
                        .blogPostTitle(article.getTitle())
                        .blogPostUrl("/api/v1/articles/"+articleId+"/comments/"+parentCommentId+"/replies")

                        .commentId(reply.getId())
                        .parentCommentId(parentComment.getId())
                        .commentSnippet(reply.getBody())

                        .actorUserId(replier.getId())
                        .actorName(replier.getUsername())
                        .actorEmail(replier.getEmail())
                        .profile(replier.getProfile())
                        // Replies notify the user who wrote the parent comment.
                        .authorUserId(parentOwner.getId())
                        .authorEmail(parentOwner.getEmail())
                        .authorName(parentOwner.getDisplayName() != null ? parentOwner.getDisplayName() : parentOwner.getUsername())
                        .build()
        );
        return mapCommentToResponse(saved);
    }

    /**
     * Get comments for an article (threaded)
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<CommentThreadResponse> getArticleComments(String articleId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Comment> comments = commentRepository.findByArticleIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtDesc(
                articleId,
                CommentStatus.PUBLISHED,
                pageable
        );

        List<CommentThreadResponse> threads = comments.getContent().stream()
                .map(this::buildCommentThread)
                .toList();

        return PaginatedResponse.<CommentThreadResponse>builder()
                .data(threads)
                .pagination(PaginatedResponse.PaginationMetadata.builder()
                        .page(page)
                        .pageSize(pageSize)
                        .totalCount(comments.getTotalElements())
                        .totalPages(comments.getTotalPages())
                        .hasNext(comments.hasNext())
                        .hasPrevious(comments.hasPrevious())
                        .build()
                )
                .build();
    }

    /**
     * Delete a comment (soft delete)
     */
    @Transactional
    public void deleteComment(String commentId, String authorId) {
        Comment comment = getCommentByIdOrThrow(commentId);

        if (!comment.getAuthorId().equals(authorId)) {
            throw new UnauthorizedException("Not authorized to delete this comment");
        }

        log.info("Deleting comment: {}", commentId);

        comment.setStatus(CommentStatus.DELETE);
        comment.setEditedAt(LocalDateTime.now());

        commentRepository.save(comment);
    }


    /**
     * Like an article
     */
    @Transactional
    public LikeResponse likeArticle(String articleId, String userId) {
        Article article = getArticleByIdOrThrow(articleId);
        if (article == null){
            throw new ResourceNotFoundException("Article Not Found");
        }
        UserProfileResponse user = userServiceClient.getUserProfile(userId);
        if (user == null){
            throw new ResourceNotFoundException("user Not Found");
        }
        UserAuthorResponse articleUser = userServiceClient.getUserAuthor(article.getAuthorId());

        if (articleUser == null){
            throw new ResourceNotFoundException("The Article User You are Looking For is not Found");
        }

        // Check if already liked
        Optional<Like> existingLike = likeRepository.findByUserIdAndArticleId(userId, articleId);
        if (existingLike.isPresent()) {
            throw new IllegalStateException("Article already liked");
        }

        Like like = Like.builder()
                .userId(userId)
                .articleId(articleId)
                .createdAt(LocalDateTime.now())
                .build();

        Like saved = likeRepository.save(like);

        // Update article like count
        article.getStats().setLikes(article.getStats().getLikes() + 1);
        article.getStats().setLastEngagedAt(LocalDateTime.now());
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article liked: {}", articleId);

        // ARTICLE_LIKED
        kafkaProducer.produce(
                BlogInteractionEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(ArticleEventType.ARTICLE_LIKED)
                        .occurredAt(LocalDateTime.now())

                        .blogPostId(articleId)
                        .blogPostTitle(article.getTitle())
                        .blogPostUrl("/api/v1/articles/"+articleId)

                        .actorUserId(user.getId())
                        .actorName(user.getUsername())
                        .actorEmail(user.getEmail())
                        .profile(user.getProfile())

                        .authorUserId(article.getAuthorId())
                        .authorName(articleUser.getUserName())
                        .authorEmail(articleUser.getEmail())
                        .build()
        );

        return mapLikeToResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean hasUserLikedArticle(String articleId, String userId) {
        getArticleByIdOrThrow(articleId);
        if (likeRepository.findByUserIdAndArticleId(userId, articleId).isPresent()) {
            return true;
        }
        UserProfileResponse user = userServiceClient.getUserProfile(userId);
        return user != null
                && user.getId() != null
                && !user.getId().equals(userId)
                && likeRepository.findByUserIdAndArticleId(user.getId(), articleId).isPresent();
    }

    /**
     * Unlike an article
     */
    @Transactional
    public void unlikeArticle(String articleId, String userId) {
        Article article = getArticleByIdOrThrow(articleId);
        UserProfileResponse user = userServiceClient.getUserProfile(userId);

        likeRepository.deleteByUserIdAndArticleId(userId, articleId);
        if (user != null && user.getId() != null && !user.getId().equals(userId)) {
            likeRepository.deleteByUserIdAndArticleId(user.getId(), articleId);
        }

        // Update article like count from persisted likes to avoid drift across id aliases.
        article.getStats().setLikes(likeRepository.countByArticleId(articleId));
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article unliked: {}", articleId);
    }

    /**
     * Track share
     */
    @Transactional
    public ShareResponse shareArticle(String articleId, String userId, ShareRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        UserProfileResponse user = userServiceClient.getUserProfile(userId);
        if (user == null){
            throw new ResourceNotFoundException("User Not Exist");
        }

        UserAuthorResponse authorResponse = userServiceClient.getUserAuthor(article.getAuthorId());
        if (authorResponse == null){
            throw new ResourceNotFoundException("User Not Found");
        }
        Share share = Share.builder()
                .userId(userId)
                .articleId(articleId)
                .platform(request.getPlatform())
                .metadata(Share.Metadata.builder()
                        .customMessage(request.getCustomMessage())
                        .timestamp(LocalDateTime.now())
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Share saved = shareRepository.save(share);

        // Update article share count
        article.getStats().setShareCount(article.getStats().getShareCount() + 1);
        article.getStats().setLastEngagedAt(LocalDateTime.now());
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article shared: {} on {}", articleId, request.getPlatform());

        // ARTICLE_SHARED
        kafkaProducer.produce(
                BlogInteractionEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(ArticleEventType.ARTICLE_SHARED)
                        .occurredAt(LocalDateTime.now())
                        .blogPostId(articleId)
                        .blogPostTitle(article.getTitle())
                        .blogPostUrl("/api/v1/articles/"+articleId)
                        .actorUserId(user.getId())
                        .actorName(user.getUsername())
                        .actorEmail(user.getEmail())
                        .profile(user.getProfile())

                        .authorUserId(article.getAuthorId())
                        .authorName(authorResponse.getUserName())
                        .authorEmail(authorResponse.getEmail())

                        .sharePlatform(share.getPlatform().name())

                        .build()
        );
        return mapShareToResponse(saved);
    }


    private String generateUniqueSlug(String title) {
        String baseSlug = SlugUtil.generateSlug(title);
        String slug = baseSlug;
        int counter = 1;

        while (articleRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        return slug;
    }

    private Integer calculateReadTime(List<ContentBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return 1;
        }

        int wordCount = blocks.stream()
                .mapToInt(block -> {
                    if ("text".equalsIgnoreCase(block.getType().getType()) && block.getData().has("text")) {
                        return block.getData().get("text").asText().split("\\s+").length;
                    }
                    return 0;
                })
                .sum();

        // Average reading speed: 200 words per minute
        return Math.max(1, (wordCount + 199) / 200);
    }

    private List<ContentBlock> mapContentBlocks(List<ContentBlockRequest> requests) {
        if (requests == null) {
            return new ArrayList<>();
        }

        return requests.stream()
                .map(req ->
                        ContentBlock.
                                builder()
                                .type(req.getType())
                                .data(objectMapper.convertValue(req.getData(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}))
                                .build()
                )
                .toList();
    }

    private void addEditHistory(Article article, String editorId, String summary) {
        EditHistory history = new EditHistory();
        history.setVersion((int) (articleRepository.countByAuthorIdAndStatus(article.getAuthorId(), article.getStatus()) + 1));
        history.setUpdatedAt(LocalDateTime.now());
        history.setEditorId(editorId);
        history.setSummary(summary);

        article.getEditHistory().add(history);
    }

    private void incrementViewsAsync(String articleId) {
        incrementViewsAsync(articleId, null);
    }

    private void incrementViewsAsync(String articleId, String viewerKey) {
        if (!recordArticleView(articleId, viewerKey)) {
            return;
        }
        articleRepository.findById(articleId).ifPresent(article -> {
            if (article.getStats() == null) {
                article.setStats(Stats.builder()
                        .views(0L)
                        .reads(0L)
                        .likes(0L)
                        .commentCount(0L)
                        .shareCount(0L)
                        .build());
            }
            Stats stats = article.getStats();
            stats.setViews((stats.getViews() == null ? 0L : stats.getViews()) + 1);
            stats.setReads((stats.getReads() == null ? 0L : stats.getReads()) + 1);
            articleRepository.save(article);
            invalidateCache(articleId);
        });
    }

    private boolean recordArticleView(String articleId, String viewerKey) {
        if (viewerKey == null || viewerKey.isBlank()) {
            return true;
        }
        String normalizedViewer = viewerKey.trim();
        if (articleViewRepository.existsByArticleIdAndViewerKey(articleId, normalizedViewer)) {
            return false;
        }
        try {
            articleViewRepository.save(ArticleView.builder()
                    .articleId(articleId)
                    .viewerKey(normalizedViewer)
                    .firstViewedAt(LocalDateTime.now())
                    .build());
            return true;
        } catch (DuplicateKeyException ignored) {
            return false;
        }
    }

    private void validateAuthor(Article article, String userId) {
        if (!article.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to modify this article");
        }
    }

    private void invalidateCache(String articleId) {
        redisTemplate.delete(ARTICLE_CACHE_KEY + articleId);
        redisTemplate.delete(ARTICLE_STATS_CACHE_KEY + articleId);
    }

    private CommentThreadResponse buildCommentThread(Comment comment) {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Comment> replies = commentRepository.findByParentCommentIdAndStatusOrderByCreatedAtAsc(
                comment.getId(),
                CommentStatus.PUBLISHED,
                pageable
        );

        List<CommentThreadResponse> replyThreads = replies.getContent().stream()
                .map(this::buildCommentThread)
                .toList();

        return CommentThreadResponse.builder()
                .comment(mapCommentToResponse(comment))
                .replies(replyThreads)
                .build();
    }

    private Article getArticleByIdOrThrow(String id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + id));
    }
    private Comment getCommentByIdOrThrow(String id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
    }
    private ArticleResponse mapToResponse(Article article) {

        Long total = articleRepository.countByAuthorIdAndStatus(article.getAuthorId(), ArticleStatus.PUBLISHED);
        AuthorResponse author = resolveAuthorResponse(article.getAuthorId(), total);
        return ArticleResponse.builder()
                .id(article.getId())
                .author(author)
                .slug(article.getSlug())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .content(ContentResponse
                        .builder()
                        .blocks(article
                                .getContent()
                                .getBlocks()
                                .stream()
                                .map(block -> ContentBlockResponse
                                        .builder()
                                        .data(objectMapper.valueToTree(block.getData()))
                                        .type(block.getType())
                                        .build()).toList())
                        .build())
                .metadata(MetadataResponse.builder()
                        .tags(article.getMetadata().getTags())
                        .category(article.getMetadata().getCategory())
                        .description(article.getMetadata().getDescription())
                        .coverImageUrl(article.getMetadata().getCoverImageUrl())
                        .build()
                )
                .status(article.getStatus())
                .visibility(article.getVisibility())

                .stats(
                        StatsResponse.builder()
                        .views(article.getStats().getViews())
                        .reads(article.getStats().getReads())
                        .likes(article.getStats().getLikes())
                        .commentCount(article.getStats().getCommentCount())
                        .shareCount(article.getStats().getShareCount())
                        .build()
                )
                .publishedAt(article.getPublishedAt())
                .updatedAt(article.getUpdatedAt())
                .createdAt(article.getCreatedAt())
                .estimatedReadTime(article.getContent().getEstimatedReadTime())
                .build();
    }
    private PaginatedResponse<ArticlePreviewResponse> mapToPaginatedResponse(Page<Article> page, int pageNum, int pageSize) {
        List<ArticlePreviewResponse> previews = page.getContent().stream()
                .map(this::mapToPreview)
                .toList();
        return PaginatedResponse.<ArticlePreviewResponse>builder()
                .data(previews)
                .pagination(PaginatedResponse.PaginationMetadata.builder()
                        .page(pageNum)
                        .pageSize(pageSize)
                        .totalCount(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .hasNext(page.hasNext())
                        .hasPrevious(page.hasPrevious())
                        .build()
                )
                .build();
    }

    private ArticlePreviewResponse mapToPreview(Article article) {
        long total = articleRepository.countByAuthorIdAndStatus(article.getAuthorId(), ArticleStatus.PUBLISHED);
        AuthorResponse author = resolveAuthorResponse(article.getAuthorId(), total);
        return ArticlePreviewResponse.builder()
                .id(article.getId())
                .slug(article.getSlug())
                .author(author)
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .coverImageUrl(article.getMetadata().getCoverImageUrl())
                .description(article.getMetadata().getDescription())
                .status(article.getStatus())
                .visibility(article.getVisibility())
                .stats(StatsResponse.builder()
                        .views(article.getStats().getViews())
                        .reads(article.getStats().getReads())
                        .likes(article.getStats().getLikes())
                        .commentCount(article.getStats().getCommentCount())
                        .shareCount(article.getStats().getShareCount())
                        .build()
                )
                .publishedAt(article.getPublishedAt())
                .estimatedReadTime(article.getContent().getEstimatedReadTime())
                .tags(article.getMetadata().getTags())
                .build();
    }

    private AuthorResponse resolveAuthorResponse(String authorId, long totalArticles) {
        try {
            UserAuthorResponse user = userServiceClient.getUserAuthor(authorId);
            return AuthorResponse.builder()
                    .profileImageUrl(user.getProfile())
                    .displayName(user.getUserName())
                    .username(user.getUserName())
                    .email(user.getEmail())
                    .id(user.getId())
                    .totalArticles(totalArticles)
                    .build();
        } catch (UserNotFoundException ex) {
            log.warn("Author {} no longer exists in User Service; returning fallback author", authorId);
        } catch (UserServiceUnavailableException ex) {
            log.warn("User Service unavailable while resolving author {}; returning fallback author", authorId);
        }

        return AuthorResponse.builder()
                .id(authorId)
                .displayName("Unknown author")
                .username(authorId)
                .totalArticles(totalArticles)
                .build();
    }

    private CommentResponse mapCommentToResponse(Comment comment) {
        String displayName = comment.getAuthor() != null ? comment.getAuthor().getDisplayName() : null;
        String profileImageUrl = comment.getAuthor() != null ? comment.getAuthor().getProfileImageUrl() : null;
        String email = null;
        String username = null;
        if ((displayName == null || displayName.isBlank() || profileImageUrl == null || profileImageUrl.isBlank())
                && comment.getAuthorId() != null) {
            UserProfileResponse user = userServiceClient.getUserProfile(comment.getAuthorId());
            if (user != null) {
                username = user.getUsername();
                displayName = displayName == null || displayName.isBlank()
                        ? (user.getDisplayName() != null && !user.getDisplayName().isBlank()
                                ? user.getDisplayName()
                                : user.getUsername())
                        : displayName;
                profileImageUrl = profileImageUrl == null || profileImageUrl.isBlank()
                        ? user.getProfile()
                        : profileImageUrl;
                email = user.getEmail();
            }
        }
        if (displayName == null || displayName.isBlank()) {
            displayName = username != null && !username.isBlank() ? username : comment.getAuthorId();
        }
        return CommentResponse.builder()
                .id(comment.getId())
                .articleId(comment.getArticleId())
                .parentCommentId(comment.getParentCommentId())
                .body(comment.getBody())
                .author(AuthorResponse.builder()
                        .id(comment.getAuthorId())
                        .displayName(displayName)
                        .profileImageUrl(profileImageUrl)
                        .email(email)
                        .username(username)
                        .build())
                .engagement(CommentEngagementResponse.builder()
                        .likes(comment.getEngagement().getLikes())
                        .replyCount(comment.getEngagement().getReplyCount())
                        .build()
                )
                .createdAt(comment.getCreatedAt())
                .editedAt(comment.getEditedAt())
                .build();
    }

    private LikeResponse mapLikeToResponse(Like like) {
        return LikeResponse.builder()
                .id(like.getId())
                .userId(like.getUserId())
                .articleId(like.getArticleId())
                .createdAt(like.getCreatedAt())
                .build();
    }

    private ShareResponse mapShareToResponse(Share share) {
        return ShareResponse.builder()
                .id(share.getId())
                .userId(share.getUserId())
                .articleId(share.getArticleId())
                .platform(share.getPlatform())
                .createdAt(share.getCreatedAt())
                .build();
    }
    @Transactional
    public ArticleResponse getArticleByAuthorAndId(String authorId, String articleId) {
        return getArticleByAuthorAndId(authorId, articleId, null);
    }

    @Transactional
    public ArticleResponse getArticleByAuthorAndId(String authorId, String articleId, String viewerKey) {
        Article article = articleRepository.findArticleByIdAndAuthorId(articleId, authorId)
                .orElseThrow(() -> new  ResourceNotFoundException("This Article by this user"));
        incrementViewsAsync(articleId, viewerKey);
        return mapToResponse(article);


    }

    /**
     * Validate individual content block
     */
    private void validateBlock(FlexibleContentBlockRequest block) {
        switch (block.getType()) {
            case TEXT:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Text block requires 'text' field");
                }
                break;
            case HEADING:
                if (block.getLevel() == null || block.getLevel() < 1 || block.getLevel() > 6) {
                    throw new IllegalArgumentException("Heading block requires valid 'level' (1-6)");
                }
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Heading block requires 'text' field");
                }
                break;
            case IMAGE:
            case VIDEO:
                if (block.getFileId() == null || block.getFileUrl() == null) {
                    throw new IllegalArgumentException(
                            block.getType() + " block requires 'fileId' and 'fileUrl' fields"
                    );
                }
                break;
            case CODE:
                if (block.getCode() == null || block.getCode().isBlank()) {
                    throw new IllegalArgumentException("Code block requires 'code' field");
                }
                break;
            case QUOTE:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Quote block requires 'text' field");
                }
                break;
            case EMBED:
                if (block.getProvider() == null || block.getEmbedUrl() == null) {
                    throw new IllegalArgumentException(
                            "Embed block requires 'provider' and 'embedUrl' fields"
                    );
                }
                break;
            case DIVIDER:
                // No specific validation needed
                break;
            default:
                throw new IllegalArgumentException("Unknown block type: " + block.getType());
        }
    }

    private ContentBlock convertContentBlockRequestToEntity(
            ContentBlockRequest blockRequest
    ) {
        if (blockRequest == null) {
            throw new IllegalArgumentException("Content block cannot be null");
        }

        JsonNode blockData = objectMapper.valueToTree(blockRequest);
        Map<String , Object> data = objectMapper.convertValue(blockData, new com.fasterxml.jackson.core.type.TypeReference<Map<String , Object>>(){});

        return ContentBlock.builder()
                .type(blockRequest.getType())
                .data(data)
                .build();
    }


    /**
     * Validate flexible content block structure
     */
    private void validateFlexibleContentBlock(FlexibleContentBlockRequest block) {


        switch (block.getType()) {
            case TEXT:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Text block requires non-empty 'text' field");
                }
                if (block.getText().length() > 10000) {
                    throw new IllegalArgumentException("Text block exceeds maximum length");
                }
                break;

            case HEADING:
                if (block.getLevel() == null || block.getLevel() < 1 || block.getLevel() > 6) {
                    throw new IllegalArgumentException("Heading level must be 1-6");
                }
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Heading block requires 'text'");
                }
                break;

            case IMAGE:
                if (block.getFileId() == null || block.getFileId().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'fileId'");
                }
                if (block.getFileUrl() == null || block.getFileUrl().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'fileUrl'");
                }
                if (block.getAlt() == null || block.getAlt().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'alt' text for accessibility");
                }
                break;

            case VIDEO:
                if (block.getFileId() == null || block.getFileId().isBlank()) {
                    throw new IllegalArgumentException("Video block requires 'fileId'");
                }
                if (block.getFileUrl() == null || block.getFileUrl().isBlank()) {
                    throw new IllegalArgumentException("Video block requires 'fileUrl'");
                }
                if (block.getDuration() == null || block.getDuration() < 1) {
                    throw new IllegalArgumentException("Video block requires valid 'duration'");
                }
                break;

            case CODE:
                if (block.getCode() == null || block.getCode().isBlank()) {
                    throw new IllegalArgumentException("Code block requires 'code'");
                }
                if (block.getLanguage() == null) {
                    throw new IllegalArgumentException("Code block requires 'language'");
                }
                break;

            case QUOTE:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Quote block requires 'text'");
                }
                break;

            case EMBED:
                if (block.getProvider() == null || block.getProvider().isBlank()) {
                    throw new IllegalArgumentException("Embed block requires 'provider'");
                }
                if (block.getEmbedUrl() == null || block.getEmbedUrl().isBlank()) {
                    throw new IllegalArgumentException("Embed block requires 'embedUrl'");
                }
                break;

            case DIVIDER:
                // No validation needed
                break;

            default:
                throw new IllegalArgumentException("Unknown block type: ");
        }
    }

    /**
     * Validate file reference exists in File Service
     */

    private List<ContentBlock> mapBlocks(List<ArticleBlockRequest> requests) {
        return requests.stream()
                .map(block -> ContentBlock.builder()
                        .type(block.getType())
                        .order(block.getOrder())
                        .data(block.getData())
                        .build())
                .toList();
    }

    private void validateFileReferences(List<ArticleBlockRequest> blocks, String authorId) {
        for (ArticleBlockRequest block : blocks) {
            if (block.getType() == ArticleBlockType.IMAGE || block.getType() == ArticleBlockType.VIDEO) {
                Object fileId = block.getData().get("fileId");
                if (fileId == null || fileId.toString().isBlank()) {
                    throw new IllegalArgumentException(block.getType() + " block requires fileId");
                }
               FileMetadataResponse fileMetadataResponse =  fileServiceClient.getFileMetadata(fileId.toString(), authorId);

            }
        }
    }
    /**
     * Extract keywords from title and description
     */
    private List<String> extractKeywords(String title, String description) {
        if (title == null && description == null) {
            return List.of();
        }

        String combined = (title != null ? title : "") + " " + (description != null ? description : "");

        return Stream.of(combined.split("\\s+"))
                .filter(word -> word.length() > 3)
                .distinct()
                .limit(10)
                .collect(toList());
    }


    /**
     * Map Article entity to ArticleResponse DTO
     */


    private ContentResponse mapContentToResponse(Content content) {
        return ContentResponse.builder()
                .blocks(content.getBlocks()
                        .stream()
                        .map(block ->
                                ContentBlockResponse.builder()
                                .type(block.getType())
                                .data((JsonNode) block.getData())
                                .build()
                        )
                        .collect(toList())
                )
                .estimatedReadTime(content.getEstimatedReadTime())
                .build();
    }

    private MetadataResponse mapMetadataToResponse(Metadata metadata) {
        return MetadataResponse.builder()
                .tags(metadata.getTags())
                .category(metadata.getCategory())
                .description(metadata.getDescription())
                .keywords(metadata.getKeywords())
                .coverImageUrl(metadata.getCoverImageUrl())
                .build();
    }

    private StatsResponse mapStatsToResponse(Stats stats) {
        return StatsResponse.builder()
                .views(stats.getViews())
                .reads(stats.getReads())
                .likes(stats.getLikes())
                .commentCount(stats.getCommentCount())
                .shareCount(stats.getShareCount())
                .lastEngagedAt(stats.getLastEngagedAt())
                .build();
    }

    private AuthorResponse mapAuthorResponse(UserProfileResponse user) {
        return AuthorResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .username(user.getUsername())
                .profileImageUrl(user.getProfile())
                .totalArticles(user.getTotalArticles() != null ? user.getTotalArticles() : 0L)
                .build();
    }
}


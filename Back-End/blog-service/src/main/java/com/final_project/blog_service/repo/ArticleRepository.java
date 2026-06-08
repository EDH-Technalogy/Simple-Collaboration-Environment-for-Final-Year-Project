package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Article;
import com.final_project.blog_service.model.ArticleStatus;
import com.final_project.blog_service.model.ArticleVisiblity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Article Repository - handles article persistence
 */
@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {

    // Find by slug (for URL routing)
    Optional<Article> findBySlug(String slug);

    // Find published articles by author
    Page<Article> findByAuthorIdAndStatusOrderByPublishedAtDesc(
            String authorId,
            ArticleStatus status,
            Pageable pageable
    );
    // Find published articles by author
    Page<Article> findByAuthorId(
            String authorId,
            Pageable pageable
    );

    // Find all published articles (for feed)
    @Query("{ 'status': 'PUBLISHED', 'visibility': 'PUBLIC' }")
    Page<Article> findPublishedArticles(Pageable pageable);

    @Query("""
            {
              'status': 'PUBLISHED',
              'visibility': 'PUBLIC',
              '$or': [
                { 'title': { $regex: ?0, $options: 'i' } },
                { 'subtitle': { $regex: ?0, $options: 'i' } },
                { 'metadata.description': { $regex: ?0, $options: 'i' } },
                { 'metadata.tags': { $regex: ?0, $options: 'i' } },
                { 'metadata.keywords': { $regex: ?0, $options: 'i' } }
              ]
            }
            """)
    Page<Article> searchPublishedArticles(String query, Pageable pageable);

    @Query("{'_id': '?0' ,'status':  'PUBLISHED', 'visibility' :  'PUBLIC'}")
    Article findByIdAndStatsIsPublish(String id);


    // Find articles by tags
    Page<Article> findByMetadataTagsInAndStatusAndVisibility(
            List<String> tags,
            ArticleStatus status,
            ArticleVisiblity visibility,
            Pageable pageable
    );

    // Find articles by category
    Page<Article> findByMetadataCategoryAndStatusAndVisibility(
            String category,
            ArticleStatus status,
            ArticleVisiblity visibility,
            Pageable pageable
    );

    // Find articles by author and status
    List<Article> findByAuthorIdAndStatus(String authorId, ArticleStatus status);

    // Count articles by author
    Long countByAuthorIdAndStatus(String authorId, ArticleStatus status);

    // Find articles published after a date
    List<Article> findByPublishedAtAfterAndStatusOrderByPublishedAtDesc(
            LocalDateTime publishedAt,
            ArticleStatus status
    );

    // Delete soft-deleted articles (archives older than 30 days)
    @Query("{ 'status': 'ARCHIVED', 'archivedAt': { $lt: ?0 } }")
    void deleteOldArchives(LocalDateTime threshold);


//    FOR AUTHOR

    @Query("{'_id':  ?0, 'authorId':  ?1}")
    Optional<Article> findArticleByIdAndAuthor(String articleId, String authorId);


//    FOR VIEWER

    @Query("{'_id':  ?0, 'authorId':  ?1, 'status':  'PUBLISHED', 'visibility':  'PUBLIC'}")
    Optional<Article> findArticleByIdAndAuthorId(String articleId, String authorId);
}




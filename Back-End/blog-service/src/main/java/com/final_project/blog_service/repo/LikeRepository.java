package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Like Repository - handles like persistence
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {

    // Check if user has liked article
    Optional<Like> findByUserIdAndArticleId(String userId, String articleId);

    // Get all likes for an article
    Page<Like> findByArticleIdOrderByCreatedAtDesc(String articleId, Pageable pageable);

    // Get all likes by a user
    Page<Like> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Count likes for article
    Long countByArticleId(String articleId);

    // Count likes by user
    Long countByUserId(String userId);

    // Delete like
    void deleteByUserIdAndArticleId(String userId, String articleId);

    // Get user's liked articles (for reading list)
    @Query("{ 'userId': ?0 }")
    Page<Like> getUserLikedArticles(String userId, Pageable pageable);
}

package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ReadingHistory Repository - tracks user reading engagement
 */
@Repository
public interface ReadingHistoryRepository extends MongoRepository<ReadingHistory, String> {

    // Check if user has read article
    Optional<ReadingHistory> findByUserIdAndArticleId(String userId, String articleId);

    // Get user's reading history
    Page<ReadingHistory> findByUserIdOrderByReadAtDesc(String userId, Pageable pageable);

    // Get article's readers
    Page<ReadingHistory> findByArticleIdOrderByReadAtDesc(String articleId, Pageable pageable);

    // Get articles read by user
    @Query("{ 'userId': ?0, 'wasRead': true }")
    List<ReadingHistory> getUserReadArticles(String userId);

    // Count readers
    Long countByArticleId(String articleId);

    // Count articles read by user
    @Query("{ 'userId': ?0, 'wasRead': true }")
    Long countUserReadArticles(String userId);
}

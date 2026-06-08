package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Share;
import com.final_project.blog_service.model.SharedPlatform;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Share Repository - handles share tracking
 */
@Repository
public interface ShareRepository extends MongoRepository<Share, String> {

    // Get all shares for an article
    Page<Share> findByArticleIdOrderByCreatedAtDesc(String articleId, Pageable pageable);

    // Get all shares by a user
    Page<Share> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Count total shares for article
    Long countByArticleId(String articleId);

    // Count shares by platform
    Long countByArticleIdAndPlatform(String articleId, SharedPlatform platform);

    // Get shares for article by platform
    List<Share> findByArticleIdAndPlatformOrderByCreatedAtDesc(String articleId, SharedPlatform platform);
}


package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Comment;
import com.final_project.blog_service.model.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Comment Repository - handles comment persistence
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    // Get all top-level comments for an article
    Page<Comment> findByArticleIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtDesc(
            String articleId,
            CommentStatus status,
            Pageable pageable
    );

    // Get all replies to a specific comment
    Page<Comment> findByParentCommentIdAndStatusOrderByCreatedAtAsc(
            String parentCommentId,
            CommentStatus status,
            Pageable pageable
    );

    // Count total comments on an article
    Long countByArticleIdAndStatus(String articleId, CommentStatus status);

    // Count replies to a comment
    Long countByParentCommentIdAndStatus(String parentCommentId, CommentStatus status);

    // Get comments by user
    Page<Comment> findByAuthorIdAndStatusOrderByCreatedAtDesc(
            String authorId,
            CommentStatus status,
            Pageable pageable
    );

    // Find deleted comments for cleanup
    List<Comment> findByStatusAndEditedAtBefore(CommentStatus status, LocalDateTime threshold);

    // Check if comment exists
    boolean existsByIdAndStatus(String id, CommentStatus status);
}

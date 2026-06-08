package com.final_project.notification_service.repo;

import com.final_project.notification_service.model.Notification;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // ── Idempotency ──────────────────────────────────────────────────────────
    Optional<Notification> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    // ── User-scoped queries ───────────────────────────────────────────────────
    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<Notification> findByRecipientUserIdAndTypeOrderByCreatedAtDesc(
            String userId, NotificationType type, Pageable pageable);

    Page<Notification> findByRecipientUserIdAndStatusOrderByCreatedAtDesc(
            String userId, NotificationStatus status, Pageable pageable);

    long countByRecipientUserIdAndStatus(String userId, NotificationStatus status);

    // ── Admin / ops queries ──────────────────────────────────────────────────
    Page<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status, Pageable pageable);

    Page<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type, Pageable pageable);

    @Query("""
        SELECT n FROM Notification n
        WHERE n.status IN (:statuses)
          AND n.retryCount < n.maxRetries
          AND n.createdAt >= :since
        ORDER BY n.createdAt ASC
        """)
    List<Notification> findRetryableNotifications(
            @Param("statuses") List<NotificationStatus> statuses,
            @Param("since") LocalDateTime since
    );

    @Query("""
        SELECT n FROM Notification n
        WHERE n.status = 'PENDING'
          AND n.createdAt < :cutoff
        ORDER BY n.createdAt ASC
        """)
    List<Notification> findStalePendingNotifications(@Param("cutoff") LocalDateTime cutoff);

    // ── Reference-scoped queries (blog post, repo, comment) ──────────────────
    Page<Notification> findByReferenceIdAndReferenceTypeOrderByCreatedAtDesc(
            String referenceId, String referenceType, Pageable pageable);

    // ── Stats ────────────────────────────────────────────────────────────────
    @Query("""
        SELECT n.type, n.status, COUNT(n)
        FROM Notification n
        WHERE n.createdAt BETWEEN :from AND :to
        GROUP BY n.type, n.status
        """)
    List<Object[]> getNotificationStatsByPeriod(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientUserId = :userId AND n.createdAt >= :since")
    long countRecentByUser(@Param("userId") String userId, @Param("since") LocalDateTime since);

    // ── Bulk status update ───────────────────────────────────────────────────
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.updatedAt = :now WHERE n.id IN :ids")
    int bulkUpdateStatus(
            @Param("ids") List<UUID> ids,
            @Param("status") NotificationStatus status,
            @Param("now") LocalDateTime now
    );

    // ── Cleanup ──────────────────────────────────────────────────────────────
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.status = 'SENT' AND n.sentAt < :cutoff")
    int deleteOldSentNotifications(@Param("cutoff") LocalDateTime cutoff);
}
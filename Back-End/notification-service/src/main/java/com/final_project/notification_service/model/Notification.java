package com.final_project.notification_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_notif_user_id",   columnList = "recipient_user_id"),
                @Index(name = "idx_notif_type",      columnList = "type"),
                @Index(name = "idx_notif_status",    columnList = "status"),
                @Index(name = "idx_notif_created",   columnList = "created_at"),
                @Index(name = "idx_notif_idempotency", columnList = "idempotency_key", unique = true)
        }
)
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "metadata")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "recipient_user_id", nullable = false)
    private String recipientUserId;

    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    // ── Classification ───────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    // ── Content ──────────────────────────────────────────────
    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    // ── Reference context ────────────────────────────────────
    @Column(name = "reference_id", length = 100)
    private String referenceId;       // blogPostId, repoId, commentId, etc.

    @Column(name = "reference_type", length = 50)
    private String referenceType;     // BLOG_POST, REPOSITORY, COMMENT

    // ── Reliability ──────────────────────────────────────────
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 200)
    private String idempotencyKey;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 3;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    // ── Metadata JSON (source event data snapshot) ───────────
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // ── Audit ────────────────────────────────────────────────
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean canRetry() {
        return retryCount < maxRetries && status != NotificationStatus.SENT;
    }

    public void markSent() {
        this.status = NotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    public void markRead() {
        this.status = NotificationStatus.READ;
    }

    public void markFailed(String reason) {
        this.status = NotificationStatus.FAILED;
        this.failureReason = reason;
    }

    public void incrementRetry() {
        this.retryCount++;
        this.status = NotificationStatus.RETRYING;
    }
}

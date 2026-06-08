package com.final_project.notification_service.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.dto.mapper.NotificationMapper;
import com.final_project.notification_service.dto.request.ResendNotificationRequest;
import com.final_project.notification_service.dto.request.SendNotificationRequest;
import com.final_project.notification_service.dto.response.NotificationResponse;
import com.final_project.notification_service.dto.response.NotificationStatsResponse;
import com.final_project.notification_service.dto.response.PagedResponse;
import com.final_project.notification_service.exception.DuplicateNotificationException;
import com.final_project.notification_service.exception.NotificationNotFoundException;
import com.final_project.notification_service.exception.RateLimitExceededException;
import com.final_project.notification_service.model.Notification;
import com.final_project.notification_service.model.NotificationChannel;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import com.final_project.notification_service.repo.NotificationRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@Transactional(readOnly = true)
@AllArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final NotificationMapper mapper;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Override
    @Transactional
    public NotificationResponse send(SendNotificationRequest req) {
        String idempotencyKey = resolveIdempotencyKey(req);

        // 1. Idempotency check
        if (repository.existsByIdempotencyKey(idempotencyKey)) {
            log.warn("Duplicate notification request. Key={}", idempotencyKey);
            throw new DuplicateNotificationException(
                    "Notification with this idempotency key already exists: " + idempotencyKey);
        }

        // 2. Rate limit check
        if (!rateLimitService.isAllowed(req.getRecipientUserId())) {
            throw new RateLimitExceededException(
                    "Notification rate limit exceeded for user: " + req.getRecipientUserId());
        }

        // 3. Persist
        Notification notification = Notification.builder()
                .recipientUserId(req.getRecipientUserId())
                .recipientEmail(req.getRecipientEmail())
                .recipientName(req.getRecipientName())
                .type(req.getType())
                .channel(req.getChannel() != null ? req.getChannel() : NotificationChannel.IN_APP)
                .status(NotificationStatus.PENDING)
                .subject(req.getSubject())
                .body(req.getBody())
                .referenceId(req.getReferenceId())
                .referenceType(req.getReferenceType())
                .idempotencyKey(idempotencyKey)
                .build();

        return mapper.toResponse(saveAndProcess(notification));
    }

    @Override
    @Transactional
    public NotificationResponse resend(ResendNotificationRequest req) {
        Notification original = repository.findById(req.getNotificationId())
                .orElseThrow(() -> new NotificationNotFoundException(req.getNotificationId()));

        if (!original.canRetry()) {
            throw new IllegalStateException(
                    "Notification cannot be retried. Status=" + original.getStatus()
                            + " RetryCount=" + original.getRetryCount());
        }

        String targetEmail = req.getOverrideEmail() != null
                ? req.getOverrideEmail()
                : original.getRecipientEmail();

        original.incrementRetry();
        dispatchEmail(original, targetEmail);

        return mapper.toResponse(repository.save(original));
    }

    // ── Querying ─────────────────────────────────────────────────────────────

    @Override
    public NotificationResponse findById(UUID id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new NotificationNotFoundException(id));
    }

    @Override
    @Transactional
    public NotificationResponse markRead(UUID id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new NotificationNotFoundException(id));
        notification.markRead();
        return mapper.toResponse(repository.save(notification));
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotificationNotFoundException(id);
        }
        repository.deleteById(id);
        log.info("Deleted notification id={}", id);
    }

    @Override
    public PagedResponse<NotificationResponse> findByUser(String userId, Pageable pageable) {
        Page<Notification> page = repository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
        return PagedResponse.of(page.map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findByUserAndType(
            String userId, NotificationType type, Pageable pageable
    ) {
        Page<Notification> page = repository
                .findByRecipientUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
        return PagedResponse.of(page.map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findByUserAndStatus(
            String userId, NotificationStatus status, Pageable pageable
    ) {
        Page<Notification> page = repository
                .findByRecipientUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable);
        return PagedResponse.of(page.map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findAll(Pageable pageable) {
        return PagedResponse.of(repository.findAll(pageable).map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findByStatus(
            NotificationStatus status, Pageable pageable
    ) {
        return PagedResponse.of(
                repository.findByStatusOrderByCreatedAtDesc(status, pageable).map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findByType(
            NotificationType type, Pageable pageable
    ) {
        return PagedResponse.of(
                repository.findByTypeOrderByCreatedAtDesc(type, pageable).map(mapper::toResponse));
    }

    @Override
    public PagedResponse<NotificationResponse> findByReference(
            String referenceId, String referenceType, Pageable pageable
    ) {
        Page<Notification> page = repository
                .findByReferenceIdAndReferenceTypeOrderByCreatedAtDesc(referenceId, referenceType, pageable);
        return PagedResponse.of(page.map(mapper::toResponse));
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @Override
    public NotificationStatsResponse getStats(LocalDateTime from, LocalDateTime to) {
        List<Object[]> raw = repository.getNotificationStatsByPeriod(from, to);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        Map<String, Long> byType   = new LinkedHashMap<>();
        long total = 0;

        for (Object[] row : raw) {
            String type   = row[0].toString();
            String status = row[1].toString();
            long count    = ((Number) row[2]).longValue();
            total += count;
            byType.merge(type, count, Long::sum);
            byStatus.merge(status, count, Long::sum);
        }

        long sent   = byStatus.getOrDefault("SENT", 0L);
        double rate = total > 0 ? (sent * 100.0 / total) : 0.0;

        return NotificationStatsResponse.builder()
                .total(total)
                .byStatus(byStatus)
                .byType(byType)
                .successRate(Math.round(rate * 100.0) / 100.0)
                .averageRetries(0.0) // could be derived with an extra query
                .build();
    }

    @Override
    public long countUnreadByUser(String userId) {
        return repository.countByRecipientUserIdAndStatus(userId, NotificationStatus.PENDING);
    }

    // ── Admin / scheduled ops ────────────────────────────────────────────────

    @Override
    @Transactional
    @Scheduled(fixedDelayString = "PT5M")
    public void retryFailedNotifications() {
        List<NotificationStatus> retryableStatuses =
                List.of(NotificationStatus.FAILED, NotificationStatus.RETRYING);

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Notification> candidates = repository.findRetryableNotifications(retryableStatuses, since);

        if (candidates.isEmpty()) {
            log.debug("No retryable notifications found.");
            return;
        }

        log.info("Retrying {} failed notifications.", candidates.size());
        for (Notification n : candidates) {
            try {
                n.incrementRetry();
                dispatchEmail(n, n.getRecipientEmail());
                repository.save(n);
            } catch (Exception ex) {
                log.error("Retry failed for notification id={}. Error={}", n.getId(), ex.getMessage());
                n.markFailed(ex.getMessage());
                repository.save(n);
            }
        }
    }

    @Override
    @Transactional
    public void deleteOldSentNotifications(LocalDateTime before) {
        int deleted = repository.deleteOldSentNotifications(before);
        log.info("Cleaned up {} old sent notifications older than {}", deleted, before);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Notification saveAndProcess(Notification notification) {
        Notification saved = repository.save(notification);

        try {
            saved.setStatus(NotificationStatus.PENDING);

            if (saved.getChannel() == NotificationChannel.EMAIL) {
                dispatchEmail(saved, saved.getRecipientEmail());
                saved.markSent();
            } else if (
                    saved.getChannel() == NotificationChannel.IN_APP ||
                            saved.getChannel() == NotificationChannel.PUSH
            ) {
                webSocketNotificationService.sendToUser(saved.getRecipientUserId(), mapper.toResponse(saved));
                saved.setSentAt(LocalDateTime.now());
            } else {
                saved.markFailed("Unsupported channel: " + saved.getChannel());
                return repository.save(saved);
            }

        } catch (Exception ex) {
            saved.markFailed(ex.getMessage());
            log.error("Notification failed id={}", saved.getId(), ex);
        }

        return repository.save(saved);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void dispatchEmail(Notification notification, String targetEmail) {
        emailService.sendPlainTextEmail(
                targetEmail,
                notification.getSubject(),
                notification.getBody()
        ).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Async email dispatch failed for notification id={}. Error={}",
                        notification.getId(), ex.getMessage());
            }
        });
    }

    private String resolveIdempotencyKey(SendNotificationRequest req) {
        if (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()) {
            return req.getIdempotencyKey();
        }
        // Auto-generate deterministic key from user + type + current hour
        return String.format("%s:%s:%s",
                req.getRecipientUserId(),
                req.getType(),
                LocalDateTime.now().withMinute(0).withSecond(0).withNano(0)
        );
    }
}

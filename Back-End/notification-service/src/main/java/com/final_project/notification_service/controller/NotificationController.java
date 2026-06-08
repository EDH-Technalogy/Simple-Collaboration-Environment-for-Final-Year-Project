package com.final_project.notification_service.controller;


import com.final_project.notification_service.dto.request.ResendNotificationRequest;
import com.final_project.notification_service.dto.request.SendNotificationRequest;
import com.final_project.notification_service.dto.response.ApiResponse;
import com.final_project.notification_service.dto.response.NotificationResponse;
import com.final_project.notification_service.dto.response.NotificationStatsResponse;
import com.final_project.notification_service.dto.response.PagedResponse;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import com.final_project.notification_service.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "Notification management and delivery endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {
    private final NotificationService notificationService;


    @PostMapping
    @Operation(summary = "Send a custom notification",
            description = "Create and dispatch a one-off notification to a user via REST")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Notification sent"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate — already sent"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    })
    public ResponseEntity<ApiResponse<NotificationResponse>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request
    ) {
        log.info("REST request to send notification. UserId={} Type={}",
                request.getRecipientUserId(), request.getType());
        NotificationResponse response = notificationService.send(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Notification sent successfully"));
    }

    @PostMapping("/{id}/resend")
    @Operation(summary = "Resend a failed notification",
            description = "Retry sending a notification that previously failed")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification resent"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Notification not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot retry this notification")
    })
    public ResponseEntity<ApiResponse<NotificationResponse>> resendNotification(
            @PathVariable UUID id,
            @Valid @RequestBody ResendNotificationRequest request
    ) {
        log.info("REST request to resend notification. Id={}", id);
        request.setNotificationId(id);
        NotificationResponse response = notificationService.resend(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Notification resent"));
    }

    // ── Query single ──────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get a notification by ID")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notification found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Not found")
    })
    public ResponseEntity<ApiResponse<NotificationResponse>> getNotification(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.findById(id)));
    }

    @PostMapping("/{id}/mark-read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(id)));
    }

    @PatchMapping("/{id}/mark-read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markReadPatch(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Notification deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Notification not found")
    })
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        log.info("REST request to delete notification. Id={}", id);
        notificationService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Query by user ─────────────────────────────────────────────────────────

    @GetMapping("/user/{userId}")
    @Operation(summary = "List notifications for a user",
            description = "Paginated list of all notifications received by a user, newest first")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getUserNotifications(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        log.info("messaged reaches: {}", userId);
        PagedResponse<NotificationResponse> result = notificationService.findByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/user/{userId}/type/{type}")
    @Operation(summary = "List notifications by user and type")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getUserNotificationsByType(
            @PathVariable String userId,
            @PathVariable NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result =
                notificationService.findByUserAndType(userId, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/user/{userId}/status/{status}")
    @Operation(summary = "List notifications by user and status")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getUserNotificationsByStatus(
            @PathVariable String userId,
            @PathVariable NotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result =
                notificationService.findByUserAndStatus(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/user/{userId}/unread-count")
    @Operation(summary = "Get unread notification count for a user")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable String userId
    ) {
        long count = notificationService.countUnreadByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(count, "Unread count: " + count));
    }

    // ── Admin: global queries ─────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all notifications (admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result = notificationService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "List notifications by status")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getByStatus(
            @PathVariable NotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result = notificationService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "List notifications by type")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getByType(
            @PathVariable NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result = notificationService.findByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/reference")
    @Operation(summary = "List notifications by reference (blog post, repo, comment)")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getByReference(
            @RequestParam String referenceId,
            @RequestParam String referenceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<NotificationResponse> result =
                notificationService.findByReference(referenceId, referenceType, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Admin: operations ─────────────────────────────────────────────────────

    @PostMapping("/admin/retry-failed")
    @Operation(summary = "Retry all failed notifications (scheduled / manual trigger)")
    public ResponseEntity<ApiResponse<String>> retryFailed() {
        log.info("Admin request to retry failed notifications");
        notificationService.retryFailedNotifications();
        return ResponseEntity.ok(ApiResponse.success("Retry job triggered"));
    }

    @DeleteMapping("/admin/cleanup")
    @Operation(summary = "Delete old sent notifications")
    public ResponseEntity<ApiResponse<String>> cleanup(
            @RequestParam(defaultValue = "30") int daysOld
    ) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOld);
        log.info("Admin request to cleanup notifications before {}", cutoff);
        notificationService.deleteOldSentNotifications(cutoff);
        return ResponseEntity.ok(ApiResponse.success("Cleanup completed"));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GetMapping("/admin/stats")
    @Operation(summary = "Get notification statistics")
    public ResponseEntity<ApiResponse<NotificationStatsResponse>> getStats(
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to
    ) {
        LocalDateTime fromDate = from != null ? from : LocalDateTime.now().minusDays(7);
        LocalDateTime toDate   = to != null ? to : LocalDateTime.now();
        NotificationStatsResponse stats = notificationService.getStats(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

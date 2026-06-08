package com.final_project.notification_service.service;

import com.final_project.notification_service.dto.response.NotificationResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send notification to specific user via WebSocket
     *
     * @param userId Keycloak user ID (from JWT "sub" claim)
     * @param notification NotificationResponse to send
     */
    public void sendToUser(String userId, NotificationResponse notification) {
        try {
            // The /user prefix ensures message goes only to this specific user
            // Spring converts /user/{userId}/queue/notifications
            // to /queue/notifications in user's session
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/notifications",
                    notification
            );
            log.debug("✓ Notification sent to user: {} ({})", userId, notification.getSubject());
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Send notification to multiple users
     */
    public void sendToUsers(java.util.List<String> userIds, NotificationResponse notification) {
        userIds.forEach(userId -> sendToUser(userId, notification));
    }

    /**
     * Broadcast notification to all connected users
     * Use with caution - this sends to everyone!
     */
    public void broadcastToAll(NotificationResponse notification) {
        try {
            messagingTemplate.convertAndSend(
                    "/topic/notifications",
                    notification
            );
            log.debug("✓ Notification broadcast to all users");
        } catch (Exception e) {
            log.error("Failed to broadcast notification: {}", e.getMessage(), e);
        }
    }
}
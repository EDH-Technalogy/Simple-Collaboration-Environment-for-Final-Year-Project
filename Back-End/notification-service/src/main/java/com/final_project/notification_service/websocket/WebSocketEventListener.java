// src/main/java/com/final_project/notification_service/websocket/WebSocketEventListener.java

package com.final_project.notification_service.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Called when a WebSocket client connects
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        try {
            Object principal = event.getUser();

            if (principal instanceof StompPrincipal) {
                StompPrincipal stompPrincipal = (StompPrincipal) principal;
                String userId = stompPrincipal.getUserId();
                String username = stompPrincipal.getUsername();
                String email = stompPrincipal.getEmail();

                log.info("✓ User [{}] ({}) connected to WebSocket", username, userId);

                // Optional: Store active session info in Redis for status tracking
                // Could implement user presence/online status here
            }
        } catch (Exception e) {
            log.error("Error in connect listener: {}", e.getMessage(), e);
        }
    }

    /**
     * Called when a WebSocket client disconnects
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            Object principal = event.getUser();

            if (principal instanceof StompPrincipal) {
                StompPrincipal stompPrincipal = (StompPrincipal) principal;
                String userId = stompPrincipal.getUserId();
                String username = stompPrincipal.getUsername();

                log.info("✗ User [{}] ({}) disconnected from WebSocket", username, userId);

                // Optional: Clean up session metadata from Redis
            }
        } catch (Exception e) {
            log.error("Error in disconnect listener: {}", e.getMessage(), e);
        }
    }
}
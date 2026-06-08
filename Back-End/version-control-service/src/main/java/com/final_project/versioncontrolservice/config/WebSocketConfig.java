package com.final_project.versioncontrolservice.config;


import com.final_project.versioncontrolservice.websocket.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to carry messages back to clients
        config.enableSimpleBroker(
                "/topic",     // For broadcast messages
                "/queue",     // For user-specific messages
                "/repo"       // For repository-specific events
        );

        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");

        // User-specific message prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new CustomHandshakeHandler())
                .addInterceptors(new AuthHandshakeInterceptor())
                .withSockJS(); // Fallback for browsers that don't support WebSocket

        // Additional endpoint for native WebSocket clients (like Go CLI)
        registry.addEndpoint("/ws/native")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new CustomHandshakeHandler());
    }

    /**
     * Custom handshake handler to assign unique session IDs
     */
    static class CustomHandshakeHandler extends DefaultHandshakeHandler {
        @Override
        protected Principal determineUser(
                org.springframework.http.server.ServerHttpRequest request,
                org.springframework.web.socket.WebSocketHandler wsHandler,
                Map<String, Object> attributes) {
            // Generate a unique principal for each connection
            return new StompPrincipal(UUID.randomUUID().toString());
        }
    }
}

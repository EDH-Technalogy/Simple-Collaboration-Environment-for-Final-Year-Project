
package com.final_project.notification_service.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import com.final_project.notification_service.websocket.StompPrincipal;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtDecoder jwtDecoder;

    public WebSocketConfig(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for actual destinations used by convertAndSendToUser + broadcasts.
        config.enableSimpleBroker("/queue", "/topic");

        // User destination prefix for private messaging
        config.setUserDestinationPrefix("/user");

        // Application destination for client-to-server messages
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws", "/ws/native")
                .setAllowedOriginPatterns(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:5174"
                )
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(keycloakJwtChannelInterceptor());
    }

    /**
     * Channel interceptor that extracts and validates JWT from WebSocket headers
     * Keycloak JWT contains:
     * - sub: Subject (user ID / UUID)
     * - preferred_username: Username
     * - name: Full name
     * - email: Email address
     * - resource_access: Role mappings per client
     */
    @Bean
    public ChannelInterceptor keycloakJwtChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
//                MessageHeaderAccessor accessor =
//                        StompHeaderAccessor.wrap(message);

                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                try {
                    // Extract Authorization header from WebSocket handshake
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);

                        // Decode and validate JWT
                        Jwt jwt = jwtDecoder.decode(token);

                        // Extract user info from JWT claims
                        String userId = jwt.getClaimAsString("sub"); // UUID from Keycloak
                        String username = jwt.getClaimAsString("preferred_username");
                        String email = jwt.getClaimAsString("email");
                        String fullName = jwt.getClaimAsString("name");

                        log.info("WebSocket authenticated user: {} ({})", username, userId);

                        // Create principal with user ID (required for /user routing)
                        StompPrincipal principal = new StompPrincipal(userId);
                        principal.setUsername(username);
                        principal.setEmail(email);
                        principal.setFullName(fullName);
                        accessor.setUser(principal);
                    } else {
                        log.warn("No Authorization header found in WebSocket connection");
                    }
                } catch (Exception e) {
                    log.error("Failed to validate JWT token: {}", e.getMessage(), e);
                    // Don't block connection, let Spring Security handle it
                }
                return message;
            }
        };
    }
}

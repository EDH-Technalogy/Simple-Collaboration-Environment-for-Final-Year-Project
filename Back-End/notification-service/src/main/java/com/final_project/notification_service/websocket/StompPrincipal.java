package com.final_project.notification_service.websocket;


import lombok.Data;

import java.security.Principal;

@Data
public class StompPrincipal implements Principal {
    private final String userId; // Keycloak subject (UUID)
    private String username;
    private String email;
    private String fullName;

    public StompPrincipal(String userId) {
        this.userId = userId;
    }

    @Override
    public String getName() {
        // Must return userId for Spring STOMP /user routing to work correctly
        return userId;
    }
}


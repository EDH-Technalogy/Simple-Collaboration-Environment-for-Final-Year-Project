package com.final_project.auth_service.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

@Configuration
@Slf4j
public class GoogleOAuth2Config {

    @Value("${google.client-id}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    /**
     * Creates Google ID Token Verifier bean.
     *
     * Used to verify Google ID tokens received from frontend.
     *
     * @return GoogleIdTokenVerifier configured with Google client ID
     */
    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier() {
        log.info("Initializing Google ID Token Verifier");

        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * @return Google Client ID
     */
    public String getGoogleClientId() {
        return googleClientId;
    }

    /**
     * @return Google Client Secret
     */
    public String getGoogleClientSecret() {
        return googleClientSecret;
    }
}

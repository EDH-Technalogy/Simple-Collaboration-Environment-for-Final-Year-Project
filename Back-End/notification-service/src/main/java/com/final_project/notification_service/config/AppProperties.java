package com.final_project.notification_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Component
@ConfigurationProperties(prefix = "app")
@Validated
@Data
public class AppProperties {

    private Notification notification = new Notification();
    private Kafka kafka = new Kafka();

    @Data
    public static class Notification {
        @Email
        private String fromEmail = "no-reply@app.com";

        @NotBlank
        private String fromName = "App Notifications";

        @NotBlank
        private String baseUrl = "https://app.com";

        @Positive
        private int idempotencyTtlHours = 24;

        @Positive
        private int maxRetryAttempts = 3;

        @Positive
        private long retryDelayMs = 1000;

        private RateLimit rateLimit = new RateLimit();

        @Data
        public static class RateLimit {
            @Positive
            private int maxPerUserPerHour = 20;
        }
    }

    @Data
    public static class Kafka {
        private Topics topics = new Topics();

        @Data
        public static class Topics {
            private String userRegistered    = "user.registered";
            private String passwordChanged   = "password.changed";
            private String invitationSent    = "invitation.sent";
            private String blogCommented     = "blog.commented";
            private String commentReplied    = "comment.replied";
            private String notificationDlq   = "notification.dlq";
            private String repositoryOperation = "repository.operations";
            private String articleOperations = "article.operations";
            private String resetPassword = "reset.password";
        }
    }
}
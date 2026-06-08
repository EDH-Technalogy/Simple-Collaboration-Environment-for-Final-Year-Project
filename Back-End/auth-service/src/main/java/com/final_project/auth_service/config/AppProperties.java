package com.final_project.auth_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private Kafka kafka = new  Kafka();

    @Data
    public static class Kafka{
        private Topics topics = new  Topics();

        @Data
        public static class Topics{
            private String userRegistered = "user.registered";
            private String changePassword = "change.password";
            private String resetPassword = "reset.password";

        }
    }
}

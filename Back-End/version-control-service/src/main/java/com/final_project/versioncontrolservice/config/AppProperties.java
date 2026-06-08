package com.final_project.versioncontrolservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private Kafka kafka = new  Kafka();
    private String gatewayBaseUrl = "http://localhost:8080";
    @Data
    public static class Kafka{
        private Topics topics = new  Topics();

        @Data
        public static class Topics{
            private String repositoryOperation = "repository.operations";
        }
    }
}

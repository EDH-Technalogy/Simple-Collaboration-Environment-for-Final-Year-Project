package com.final_project.blog_service.config;

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
            private String articleOperations = "article.operations";
        }
    }
}

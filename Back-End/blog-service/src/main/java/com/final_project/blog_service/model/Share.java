package com.final_project.blog_service.model;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Share entity tracking social shares and sharing activity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "shares")
public class Share {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;


    private SharedPlatform platform;

    private Metadata metadata;

    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Metadata {
        private String customMessage;  // optional message when sharing
        private LocalDateTime timestamp;
    }
}
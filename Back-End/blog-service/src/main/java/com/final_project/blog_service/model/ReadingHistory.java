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
 * Reading history entity for tracking user engagement
 * Optional - for future features like recommendations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reading_history")
public class ReadingHistory {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;

    private LocalDateTime readAt;

    // Time spent reading in seconds
    private Integer timeSpentSeconds;

    // Scroll depth percentage (0-100)
    private Float scrollDepth;

    @Builder.Default
    private Boolean wasRead = false;  // true if spent 2+ minutes
}
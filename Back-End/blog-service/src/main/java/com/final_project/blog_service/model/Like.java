package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Like entity representing user likes on articles
 * Separate collection for better scalability and independence
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "likes")
@CompoundIndexes({
        @CompoundIndex(name = "user_article_unique_idx", def = "{'userId': 1, 'articleId': 1}", unique = true),
        @CompoundIndex(name = "article_idx", def = "{'articleId': 1, 'createdAt': -1}")
})
public class Like {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;

    private LocalDateTime createdAt;
}


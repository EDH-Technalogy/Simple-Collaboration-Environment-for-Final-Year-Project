package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "article_views")
@CompoundIndex(name = "article_viewer_unique_idx", def = "{'articleId': 1, 'viewerKey': 1}", unique = true)
public class ArticleView {
    @Id
    private String id;
    private String articleId;
    private String viewerKey;
    private LocalDateTime firstViewedAt;
}

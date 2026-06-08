package com.final_project.blog_service.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.final_project.blog_service.model.ArticleEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BlogInteractionEvent {

    private String eventId;
    private ArticleEventType eventType;
    private String blogPostId;
    private String blogPostTitle;
    private String blogPostUrl;

    private String authorUserId;
    private String authorEmail;
    private String authorName;

    private String actorUserId;
    private String actorName;
    private String actorEmail;

    private String commentId;
    private String parentCommentId;
    private String commentSnippet;

    private String sharePlatform;
    private String profile;
    private String adminUserId;
    private String adminName;
    private String adminEmail;

    private LocalDateTime occurredAt;

    private Map<String, Object> metadata;
}
package com.final_project.notification_service.event;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Event published when someone leaves a comment on a blog post.
 * Producer: blog-service  |  Topic: blog.commented
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BlogCommentedEvent {
    private String eventId;
    private String commentId;
    private String blogPostId;
    private String blogPostTitle;
    private String blogPostUrl;
    private String authorUserId;        // blog post owner to be notified
    private String authorEmail;
    private String authorName;
    private String commenterUserId;
    private String commenterName;
    private String commentSnippet;      // first 200 chars of comment
    private LocalDateTime occurredAt;
}
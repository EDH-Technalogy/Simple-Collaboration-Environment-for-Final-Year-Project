package com.final_project.notification_service.event;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CommentRepliedEvent {
    private String eventId;
    private String replyId;
    private String parentCommentId;
    private String blogPostId;
    private String blogPostTitle;
    private String blogPostUrl;
    private String originalCommenterUserId;   // person who wrote the parent comment
    private String originalCommenterEmail;
    private String originalCommenterName;
    private String replierUserId;
    private String replierName;
    private String replySnippet;              // first 200 chars of reply
    private LocalDateTime occurredAt;
}
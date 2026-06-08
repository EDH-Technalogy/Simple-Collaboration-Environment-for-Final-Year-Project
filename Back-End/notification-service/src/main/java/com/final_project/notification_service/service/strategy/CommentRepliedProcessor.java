package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.CommentRepliedEvent;
import com.final_project.notification_service.model.Notification;
import com.final_project.notification_service.model.NotificationChannel;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import com.final_project.notification_service.service.EmailService;
import com.final_project.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommentRepliedProcessor implements NotificationProcessor<CommentRepliedEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AppProperties props;

    @Override
    public void process(CommentRepliedEvent event) {
        // Don't notify if someone replied to their own comment
        if (event.getOriginalCommenterUserId().equals(event.getReplierUserId())) {
            log.debug("Skipping self-reply notification for userId={}", event.getReplierUserId());
            return;
        }

        log.info("Processing COMMENT_REPLY commentId={} replier={}",
                event.getParentCommentId(), event.getReplierUserId());

        String subject = event.getReplierName() + " replied to your comment on: " + event.getBlogPostTitle();

        emailService.sendHtmlEmail(
                event.getOriginalCommenterEmail(),
                subject,
                "comment-replied",
                Map.of(
                        "commenterName",    event.getOriginalCommenterName(),
                        "replierName",      event.getReplierName(),
                        "postTitle",        event.getBlogPostTitle(),
                        "postUrl",          event.getBlogPostUrl(),
                        "replySnippet",     truncate(event.getReplySnippet(), 200),
                        "baseUrl",          props.getNotification().getBaseUrl()
                )
        );

        Notification notification = Notification.builder()
                .recipientUserId(event.getOriginalCommenterUserId())
                .recipientEmail(event.getOriginalCommenterEmail())
                .recipientName(event.getOriginalCommenterName())
                .type(NotificationType.BLOG_COMMENT_REPLY)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("Comment reply notification sent.")
                .referenceId(event.getParentCommentId())
                .referenceType("COMMENT")
                .idempotencyKey("comment-reply:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<CommentRepliedEvent> supportedEventType() {
        return CommentRepliedEvent.class;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
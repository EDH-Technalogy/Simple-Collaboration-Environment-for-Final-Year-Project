package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.BlogCommentedEvent;
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
public class BlogCommentedProcessor implements NotificationProcessor<BlogCommentedEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AppProperties props;

    @Override
    public void process(BlogCommentedEvent event) {
        // Don't notify the author if they commented on their own post
        if (event.getAuthorUserId().equals(event.getCommenterUserId())) {
            log.debug("Skipping self-comment notification for userId={}", event.getAuthorUserId());
            return;
        }

        log.info("Processing BLOG_NEW_COMMENT postId={} author={}",
                event.getBlogPostId(), event.getAuthorUserId());

        String subject = event.getCommenterName() + " commented on your post: " + event.getBlogPostTitle();

        emailService.sendHtmlEmail(
                event.getAuthorEmail(),
                subject,
                "blog-new-comment",
                Map.of(
                        "authorName",       event.getAuthorName(),
                        "commenterName",    event.getCommenterName(),
                        "postTitle",        event.getBlogPostTitle(),
                        "postUrl",          event.getBlogPostUrl(),
                        "commentSnippet",   truncate(event.getCommentSnippet(), 200),
                        "baseUrl",          props.getNotification().getBaseUrl()
                )
        );
        Notification notification = Notification.builder()
                .recipientUserId(event.getAuthorUserId())
                .recipientEmail(event.getAuthorEmail())
                .recipientName(event.getAuthorName())
                .type(NotificationType.BLOG_NEW_COMMENT)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("New comment notification sent.")
                .referenceId(event.getBlogPostId())
                .referenceType("BLOG_POST")
                .idempotencyKey("blog-comment:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<BlogCommentedEvent> supportedEventType() {
        return BlogCommentedEvent.class;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
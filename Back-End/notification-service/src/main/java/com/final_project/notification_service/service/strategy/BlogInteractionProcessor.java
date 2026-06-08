package com.final_project.notification_service.service.strategy;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.BlogInteractionEvent;
import com.final_project.notification_service.model.Notification;
import com.final_project.notification_service.model.NotificationChannel;
import com.final_project.notification_service.model.NotificationStatus;
import com.final_project.notification_service.model.NotificationType;
import com.final_project.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BlogInteractionProcessor implements NotificationProcessor<BlogInteractionEvent> {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override
    public void process(BlogInteractionEvent event) {

        if (isSelfAction(event)) {
            log.debug("Skipping self notification for userId={}", event.getActorUserId());
            return;
        }

        switch (event.getEventType()) {
            case COMMENT_REPLIED -> handleCommentReplied(event);

            case COMMENT_CREATED -> processBlogCommented(event);

            case ARTICLE_LIKED -> processBlogLiked(event);

            case ARTICLE_SHARED -> processBlogShared(event);

            case ARTICLE_PUBLISHED -> processBlogPublished(event);
            case ARTICLE_UNLIKED, COMMENT_DELETED -> {
                log.debug("No notification needed for eventType={}", event.getEventType());
            }
            default -> log.warn("Unhandled eventType={}", event.getEventType());
        }
    }

    private void handleCommentReplied(BlogInteractionEvent event) {
        sendArticleNotification(
                event,
                NotificationType.BLOG_COMMENT_REPLY,
                event.getActorName() + " replied to your comment on: " + event.getBlogPostTitle(),
                event.getCommentSnippet(),
                event.getCommentId(),
                "COMMENT"
        );
    }

    private void processBlogCommented(BlogInteractionEvent event) {
        sendArticleNotification(
                event,
                NotificationType.BLOG_NEW_COMMENT,
                event.getActorName() + " commented on your post: " + event.getBlogPostTitle(),
                "Blog comment notification sent.",
                event.getCommentId(),
                "COMMENT"
        );
    }

    private void processBlogLiked(BlogInteractionEvent event) {
        sendArticleNotification(
                event,
                NotificationType.BLOG_POST_LIKED,
                event.getActorName() + " liked your post: " + event.getBlogPostTitle(),
                "Blog like notification sent.",
                event.getBlogPostId(),
                "BLOG_POST"
        );
    }

    private void processBlogShared(BlogInteractionEvent event) {
        sendArticleNotification(
                event,
                NotificationType.BLOG_POST_SHARED,
                event.getActorName() + " shared your post: " + event.getBlogPostTitle(),
                "Blog share notification sent.",
                event.getBlogPostId(),
                "BLOG_POST"
        );
    }

    private void processBlogPublished(BlogInteractionEvent event) {
        sendArticleNotification(
                event,
                NotificationType.BLOG_POST_PUBLISHED,
                "Your blog post has been published: " + event.getBlogPostTitle(),
                "Blog published notification sent.",
                event.getBlogPostId(),
                "BLOG_POST"
        );
    }

    private void sendArticleNotification(
            BlogInteractionEvent event,
            NotificationType notificationType,
            String subject,
            String notificationBody,
            String referenceId,
            String referenceType
    ) {
        saveNotification(
                event,
                notificationType,
                subject,
                notificationBody,
                referenceId,
                referenceType
        );
    }
    private void saveNotification(
            BlogInteractionEvent event,
            NotificationType type,
            String subject,
            String body,
            String referenceId,
            String referenceType
    ) {
        Notification notification = Notification.builder()
                .recipientUserId(event.getAuthorUserId())
                .recipientEmail("no-email@gmail.com")
                .recipientName("unknown")
                .type(type)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body(body)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .metadata(serializeMetadata(event))
                .idempotencyKey(event.getEventType() + ":" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    private String serializeMetadata(BlogInteractionEvent event) {
        try {
            return objectMapper.writeValueAsString(java.util.Map.of(
                    "uiPath", event.getMetadata() != null && event.getMetadata().get("uiPath") != null
                            ? event.getMetadata().get("uiPath")
                            : "/story/" + safe(event.getBlogPostId()),
                    "publicPath", event.getBlogPostUrl() != null
                            ? event.getBlogPostUrl()
                            : "/story/" + safe(event.getBlogPostId()),
                    "articleId", safe(event.getBlogPostId()),
                    "articleTitle", safe(event.getBlogPostTitle())
            ));
        } catch (Exception e) {
            log.warn("Failed to serialize blog notification metadata: {}", e.getMessage());
            return null;
        }
    }

    private boolean isSelfAction(BlogInteractionEvent event) {
        return event.getAuthorUserId() != null
                && event.getAuthorUserId().equals(event.getActorUserId());
    }

    @Override
    public Class<BlogInteractionEvent> supportedEventType() {
        return BlogInteractionEvent.class;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

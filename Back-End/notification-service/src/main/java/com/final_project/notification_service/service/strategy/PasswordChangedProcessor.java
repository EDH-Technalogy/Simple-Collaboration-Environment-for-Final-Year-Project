package com.final_project.notification_service.service.strategy;
import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.PasswordChangedEvent;
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
public class PasswordChangedProcessor implements NotificationProcessor<PasswordChangedEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AppProperties props;

    @Override
    public void process(PasswordChangedEvent event) {
        log.info("Processing PASSWORD_CHANGED for userId={} changeType={}",
                event.getUserId(), event.getChangeType());

        String subject = "RESET".equals(event.getChangeType())
                ? "Your password has been reset"
                : "Your password was changed";

        String securityUrl = props.getNotification().getBaseUrl() + "/security";

        emailService.sendHtmlEmail(
                event.getEmail(),
                subject,
                "password-changed",
                Map.of(
                        "firstName",    event.getFirstName(),
                        "changeType",   event.getChangeType(),
                        "ipAddress",    event.getIpAddress() != null ? event.getIpAddress() : "unknown",
                        "occurredAt",   event.getOccurredAt().toString(),
                        "securityUrl",  securityUrl,
                        "baseUrl",      props.getNotification().getBaseUrl()

                )
        );

        Notification notification = Notification.builder()
                .recipientUserId(event.getUserId())
                .recipientEmail(event.getEmail())
                .recipientName(event.getFirstName())
                .type(NotificationType.PASSWORD_CHANGED)
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("Password " + event.getChangeType().toLowerCase() + " security alert sent.")
                .idempotencyKey("password-changed:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<PasswordChangedEvent> supportedEventType() {
        return PasswordChangedEvent.class;
    }
}
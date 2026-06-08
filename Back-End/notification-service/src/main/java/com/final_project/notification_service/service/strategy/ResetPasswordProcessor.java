package com.final_project.notification_service.service.strategy;
import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.PasswordChangedEvent;
import com.final_project.notification_service.event.ResetPasswordEvent;
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
public class ResetPasswordProcessor implements NotificationProcessor<ResetPasswordEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    @Override
    public void process(ResetPasswordEvent event) {
        log.info("Processing ResetPassword for userId={} changeType={}",
                event.getUserId(), event.getChangeType());
        String subject = "Your password has been reset";
        emailService.sendHtmlEmail(
                event.getEmail(),
                subject,
                "password-reset",
                Map.of(
                        "firstName",    event.getFirstName(),
                        "changeType",   event.getChangeType(),
                        "ipAddress",    event.getIpAddress() != null ? event.getIpAddress() : "unknown",
                        "occurredAt",   event.getOccurredAt().toString(),
                        "securityUrl",  event.getResetToken()
                )
        );

        Notification notification = Notification.builder()
                .recipientUserId(event.getUserId())
                .recipientEmail(event.getEmail())
                .recipientName(event.getFirstName())
                .type(NotificationType.PASSWORD_RESET)
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("Password " + event.getChangeType().toLowerCase() + " security alert sent.")
                .idempotencyKey("password-reset:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<ResetPasswordEvent> supportedEventType() {
        return ResetPasswordEvent.class;
    }
}
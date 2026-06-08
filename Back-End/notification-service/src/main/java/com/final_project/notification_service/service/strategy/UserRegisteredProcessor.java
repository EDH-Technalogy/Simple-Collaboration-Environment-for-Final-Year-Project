package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.UserRegisteredEvent;
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
public class UserRegisteredProcessor implements NotificationProcessor<UserRegisteredEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AppProperties props;

    @Override
    public void process(UserRegisteredEvent event) {
        log.info("Processing USER_REGISTERED for userId={}", event.getUserId());

        String fullName  = event.getFirstName() + " " + event.getLastName();
        String subject = "Your verification code for Kandahar University";
        String verifyUrl = props.getNotification().getBaseUrl()
                + "/signup?email=" + event.getEmail();

        // Send rich HTML email via template
        emailService.sendHtmlEmail(
                event.getEmail(),
                subject,
                "user-registered",
                Map.of(
                        "firstName",        event.getFirstName(),
                        "fullName",         fullName,
                        "verificationUrl",  verifyUrl,
                        "verificationCode", event.getVerificationCode(),
                        "verificationExpiresAt", event.getVerificationExpiresAt(),
                        "baseUrl",          props.getNotification().getBaseUrl()
                )
        );

        // Persist notification record
        Notification notification = Notification.builder()
                .recipientUserId(event.getUserId())
                .recipientEmail(event.getEmail())
                .recipientName(fullName)
                .type(NotificationType.USER_REGISTERED)
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("Signup OTP verification email sent.")
                .idempotencyKey("user-registered:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<UserRegisteredEvent> supportedEventType() {
        return UserRegisteredEvent.class;
    }
}

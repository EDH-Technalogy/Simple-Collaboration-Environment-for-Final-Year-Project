package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.config.AppProperties;
import com.final_project.notification_service.event.InvitationSentEvent;
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
public class InvitationSentProcessor implements NotificationProcessor<InvitationSentEvent> {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AppProperties props;

    @Override
    public void process(InvitationSentEvent event) {
        log.info("Processing INVITATION_SENT type={} invitee={}",
                event.getInvitationType(), event.getInviteeEmail());

        boolean isRepoInvite = "REPOSITORY".equals(event.getInvitationType());

        String subject = isRepoInvite
                ? event.getInviterName() + " invited you to collaborate on " + event.getTargetName()
                : event.getInviterName() + " invited you to join " + event.getTargetName();

        String acceptUrl = props.getNotification().getBaseUrl()
                + "/invitations/accept?token=" + event.getInvitationToken();

        String template = isRepoInvite ? "repo-invitation.html" : "system-invitation";

        emailService.sendHtmlEmail(
                event.getInviteeEmail(),
                subject,
                template,
                Map.of(
                        "inviteeName",    event.getInviteeName() != null ? event.getInviteeName() : "there",
                        "inviterName",    event.getInviterName(),
                        "targetName",     event.getTargetName(),
                        "acceptUrl",      acceptUrl,
                        "expiresAt",      event.getExpiresAt().toString(),
                        "baseUrl",        props.getNotification().getBaseUrl()
                )
        );

        NotificationType type = isRepoInvite
                ? NotificationType.REPOSITORY_INVITATION
                : NotificationType.SYSTEM_INVITATION;

        Notification notification = Notification.builder()
                .recipientUserId(event.getInviteeEmail())      // user may not exist yet
                .recipientEmail(event.getInviteeEmail())
                .recipientName(event.getInviteeName())
                .type(type)
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body("Invitation email sent.")
                .referenceId(event.getTargetId())
                .referenceType(isRepoInvite ? "REPOSITORY" : "SYSTEM")
                .idempotencyKey("invitation:" + event.getEventId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    @Override
    public Class<InvitationSentEvent> supportedEventType() {
        return InvitationSentEvent.class;
    }
}
package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.config.AppProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.RepositoryOperationEvent;
import com.final_project.notification_service.model.*;
import com.final_project.notification_service.service.EmailService;
import com.final_project.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RepositoryOperationProcessor implements NotificationProcessor<RepositoryOperationEvent> {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    @Override
    public void process(RepositoryOperationEvent event) {
        switch (event.getEventType()) {

            case REPOSITORY_PUSHED, COMMIT_CREATED -> notifyRepositoryMembers(
                    event,
                    NotificationType.REPOSITORY_PUSH,
                    safe(event.getActorName()) + " pushed changes to " + safe(event.getRepositoryName()),
                    "Repository push notification sent."
            );

            case REPOSITORY_INVITATION_SENT -> notifyInvitedUser(event);

            case REPOSITORY_INVITATION_ACCEPTED -> notifyRepositoryOwner(
                    event,
                    NotificationType.REPOSITORY_INVITATION_ACCEPTED,
                    safe(event.getInvitedUserName()) + " accepted repository invitation",
                    "Repository invitation accepted notification sent."
            );

            case REPOSITORY_INVITATION_DECLINED -> notifyRepositoryOwner(
                    event,
                    NotificationType.REPOSITORY_INVITATION_DECLINED,
                    safe(event.getInvitedUserName()) + " declined repository invitation",
                    "Repository invitation declined notification sent."
            );

            case BRANCH_CREATED -> notifyRepositoryMembers(
                    event,
                    NotificationType.REPOSITORY_BRANCH_CREATED,
                    safe(event.getActorName()) + " created branch " + safe(event.getBranchName()),
                    "Repository branch created notification sent."
            );

            case BRANCH_MERGED -> notifyRepositoryMembers(
                    event,
                    NotificationType.REPOSITORY_BRANCH_MERGED,
                    safe(event.getActorName()) + " merged " + safe(event.getSourceBranch()) + " into " + safe(event.getTargetBranch()),
                    "Repository branch merged notification sent."
            );

            case PULL_REQUEST_OPENED -> notifyRepositoryMembers(
                    event,
                    NotificationType.REPOSITORY_PULL_REQUEST_OPENED,
                    safe(event.getActorName()) + " opened a pull request in " + safe(event.getRepositoryName()),
                    "Pull request opened notification sent."
            );

            case PULL_REQUEST_MERGED -> notifyRepositoryMembers(
                    event,
                    NotificationType.REPOSITORY_PULL_REQUEST_MERGED,
                    safe(event.getActorName()) + " merged a pull request in " + safe(event.getRepositoryName()),
                    "Pull request merged notification sent."
            );

            case TASK_ASSIGNED -> notifyTaskRecipients(
                    event,
                    NotificationType.REPOSITORY_TASK_ASSIGNED,
                    safe(event.getActorName()) + " assigned you task #" + safeMetadata(event, "taskNumber"),
                    safe(event.getMetadata() == null ? null : String.valueOf(event.getMetadata().get("message")))
            );

            case TASK_SUBMITTED -> notifyTaskRecipients(
                    event,
                    NotificationType.REPOSITORY_TASK_SUBMITTED,
                    safe(event.getActorName()) + " submitted task #" + safeMetadata(event, "taskNumber"),
                    safe(event.getMetadata() == null ? null : String.valueOf(event.getMetadata().get("message")))
            );

            case TASK_COMPLETED -> notifyTaskRecipients(
                    event,
                    NotificationType.REPOSITORY_TASK_COMPLETED,
                    safe(event.getActorName()) + " completed task #" + safeMetadata(event, "taskNumber"),
                    safe(event.getMetadata() == null ? null : String.valueOf(event.getMetadata().get("message")))
            );

            case TASK_DEADLINE_REMINDER -> notifyTaskDeadlineRecipients(
                    event,
                    NotificationType.REPOSITORY_TASK_DEADLINE_REMINDER,
                    "Task #" + safeMetadata(event, "taskNumber") + " deadline is coming",
                    safe(event.getMetadata() == null ? null : String.valueOf(event.getMetadata().get("message")))
            );

            case REPOSITORY_PULLED, REPOSITORY_FETCHED, REPOSITORY_CLONED -> {
                log.debug("No notification needed for eventType={}", event.getEventType());
            }

            default -> log.warn("Unhandled repository eventType={}", event.getEventType());
        }
    }

    private void notifyRepositoryMembers(
            RepositoryOperationEvent event,
            NotificationType notificationType,
            String subject,
            String body
    ) {
        List<RepositoryMemberRecipient> recipients = event.getRecipients();

        if (recipients == null || recipients.isEmpty()) {
            log.warn("No recipients found for repository eventId={}", event.getEventId());
            return;
        }

        for (RepositoryMemberRecipient recipient : recipients) {

            if (isActor(event, recipient)) {
                log.debug("Skipping actor notification for userId={}", recipient.getUserId());
                continue;
            }
            saveNotification(
                    event,
                    recipient,
                    notificationType,
                    subject,
                    body,
                    resolveReferenceId(event),
                    "REPOSITORY"
            );
        }
    }

    private void notifyInvitedUser(RepositoryOperationEvent event) {
        if (event.getInvitedUserId() != null &&
                event.getInvitedUserId().equals(event.getActorUserId())) {
            log.debug("Skipping self invitation notification userId={}", event.getActorUserId());
            return;
        }

        String subject = safe(event.getActorName())
                + " invited you to repository "
                + safe(event.getRepositoryName());

        RepositoryMemberRecipient recipient = RepositoryMemberRecipient.builder()
                .userId(event.getInvitedUserId())
                .name(event.getInvitedUserName())
                .email(event.getInvitedUserEmail())
                .role("INVITED")
                .build();
        saveNotification(
                event,
                recipient,
                NotificationType.REPOSITORY_INVITATION_SENT,
                subject,
                safe(event.getActorName()) + " invited you to join " + safe(event.getRepositoryName()) + ".",
                resolveReferenceId(event),
                "REPOSITORY"
        );
    }

    private void notifyRepositoryOwner(
            RepositoryOperationEvent event,
            NotificationType notificationType,
            String subject,
            String body
    ) {
        if (event.getOwnerUserId() == null || event.getOwnerUserId().isBlank()) {
            log.warn("Missing owner recipient for repository eventId={}", event.getEventId());
            return;
        }
        if (event.getOwnerUserId().equals(event.getActorUserId())) {
            log.debug("Skipping owner notification for actor userId={}", event.getActorUserId());
            return;
        }

        RepositoryMemberRecipient recipient = RepositoryMemberRecipient.builder()
                .userId(event.getOwnerUserId())
                .name(event.getOwnerName())
                .email(event.getOwnerEmail())
                .role("OWNER")
                .build();

        saveNotification(
                event,
                recipient,
                notificationType,
                subject,
                body,
                resolveReferenceId(event),
                "REPOSITORY"
        );
    }

    private void notifyTaskRecipients(
            RepositoryOperationEvent event,
            NotificationType notificationType,
            String subject,
            String body
    ) {
        List<RepositoryMemberRecipient> recipients = event.getRecipients();
        if (recipients == null || recipients.isEmpty()) {
            log.warn("No recipients found for task eventId={}", event.getEventId());
            return;
        }

        for (RepositoryMemberRecipient recipient : recipients) {
            if (isActor(event, recipient)) {
                log.debug("Skipping actor notification for task event userId={}", recipient.getUserId());
                continue;
            }
            saveNotification(
                    event,
                    recipient,
                    notificationType,
                    subject,
                    body == null || body.isBlank() ? subject : body,
                    resolveReferenceId(event),
                    "REPOSITORY_TASK"
            );
        }
    }

    private void notifyTaskDeadlineRecipients(
            RepositoryOperationEvent event,
            NotificationType notificationType,
            String subject,
            String body
    ) {
        List<RepositoryMemberRecipient> recipients = event.getRecipients();
        if (recipients == null || recipients.isEmpty()) {
            log.warn("No recipients found for task deadline reminder eventId={}", event.getEventId());
            return;
        }

        for (RepositoryMemberRecipient recipient : recipients) {
            saveNotification(
                    event,
                    recipient,
                    notificationType,
                    subject,
                    body == null || body.isBlank() ? subject : body,
                    resolveReferenceId(event),
                    "REPOSITORY_TASK",
                    NotificationChannel.EMAIL
            );
        }
    }

    private void saveNotification(
            RepositoryOperationEvent event,
            RepositoryMemberRecipient recipient,
            NotificationType type,
            String subject,
            String body,
            String referenceId,
            String referenceType
    ) {
        Notification notification = Notification.builder()
                .recipientUserId(recipient.getUserId())
                .recipientEmail(recipient.getEmail())
                .recipientName(recipient.getName())
                .type(type)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body(body)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .metadata(serializeMetadata(buildEventMetadataSnapshot(event, recipient)))
                .idempotencyKey(event.getEventType() + ":" + event.getEventId() + ":" + recipient.getUserId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    private void saveNotification(
            RepositoryOperationEvent event,
            RepositoryMemberRecipient recipient,
            NotificationType type,
            String subject,
            String body,
            String referenceId,
            String referenceType,
            NotificationChannel channel
    ) {
        Notification notification = Notification.builder()
                .recipientUserId(recipient.getUserId())
                .recipientEmail(recipient.getEmail())
                .recipientName(recipient.getName())
                .type(type)
                .channel(channel)
                .status(NotificationStatus.PROCESSING)
                .subject(subject)
                .body(body)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .metadata(serializeMetadata(buildEventMetadataSnapshot(event, recipient)))
                .idempotencyKey(event.getEventType() + ":" + event.getEventId() + ":" + channel + ":" + recipient.getUserId())
                .build();

        notificationService.saveAndProcess(notification);
    }

    private boolean isActor(RepositoryOperationEvent event, RepositoryMemberRecipient recipient) {
        return recipient.getUserId() != null
                && recipient.getUserId().equals(event.getActorUserId());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String resolveReferenceId(RepositoryOperationEvent event) {
        if (event.getPullRequestId() != null && !event.getPullRequestId().isBlank()) {
            return event.getPullRequestId();
        }
        if (event.getRepositoryId() != null && !event.getRepositoryId().isBlank()) {
            return event.getRepositoryId();
        }
        if (event.getMetadata() != null) {
            Object invitationId = event.getMetadata().get("invitationId");
            if (invitationId != null && !String.valueOf(invitationId).isBlank()) {
                return String.valueOf(invitationId);
            }
        }
        String repositoryName = safe(event.getRepositoryName());
        if (!repositoryName.isBlank()) {
            return repositoryName;
        }
        return event.getEventId();
    }

    private String safeMetadata(RepositoryOperationEvent event, String key) {
        if (event == null || event.getMetadata() == null || key == null) {
            return "";
        }
        Object value = event.getMetadata().get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private Map<String, Object> buildEventMetadataSnapshot(
            RepositoryOperationEvent event,
            RepositoryMemberRecipient recipient
    ) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("eventId", event.getEventId());
        snapshot.put("eventType", event.getEventType() == null ? null : event.getEventType().name());
        snapshot.put("repositoryId", event.getRepositoryId());
        snapshot.put("repositoryName", event.getRepositoryName());
        snapshot.put("repositoryUrl", event.getRepositoryUrl());
        snapshot.put("actorUserId", event.getActorUserId());
        snapshot.put("actorName", event.getActorName());
        snapshot.put("actorEmail", event.getActorEmail());
        snapshot.put("ownerUserId", event.getOwnerUserId());
        snapshot.put("ownerName", event.getOwnerName());
        snapshot.put("ownerEmail", event.getOwnerEmail());
        snapshot.put("branchName", event.getBranchName());
        snapshot.put("sourceBranch", event.getSourceBranch());
        snapshot.put("targetBranch", event.getTargetBranch());
        snapshot.put("commitId", event.getCommitId());
        snapshot.put("commitMessage", event.getCommitMessage());
        snapshot.put("commitCount", event.getCommitCount());
        snapshot.put("pullRequestId", event.getPullRequestId());
        snapshot.put("pullRequestTitle", event.getPullRequestTitle());
        snapshot.put("pullRequestUrl", event.getPullRequestUrl());
        snapshot.put("invitedUserId", event.getInvitedUserId());
        snapshot.put("invitedUserName", event.getInvitedUserName());
        snapshot.put("invitedUserEmail", event.getInvitedUserEmail());
        snapshot.put("occurredAt", event.getOccurredAt());
        snapshot.put("recipientUserId", recipient.getUserId());
        snapshot.put("recipientName", recipient.getName());
        snapshot.put("recipientEmail", recipient.getEmail());
        snapshot.put("recipientRole", recipient.getRole());

        if (event.getMetadata() != null && !event.getMetadata().isEmpty()) {
            snapshot.putAll(event.getMetadata());
        }
        return snapshot;
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize notification metadata: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public Class<RepositoryOperationEvent> supportedEventType() {
        return RepositoryOperationEvent.class;
    }
}

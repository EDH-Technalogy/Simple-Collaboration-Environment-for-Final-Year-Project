# Notification Service

## Overview

This service is a Spring Boot 3.5.13 microservice that handles notification creation, persistence, delivery, querying, retries, cleanup, and real-time in-app delivery.

Main capabilities implemented in this project:

- REST API for sending, resending, querying, cleaning up, and reporting on notifications
- Kafka consumers for event-driven notifications
- PostgreSQL persistence with JPA
- Redis-backed idempotency and rate limiting
- Email delivery with Thymeleaf templates and Resilience4j
- STOMP over WebSocket for in-app real-time notifications
- Swagger/OpenAPI docs with bearer auth declared

Base REST path:

```text
/api/v1/notifications
```

WebSocket endpoints:

```text
/ws
/ws/native
```

## Tech Stack

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Flyway
- Spring Kafka
- Spring Mail
- Thymeleaf
- Spring WebSocket + STOMP + SockJS
- Redis
- Resilience4j
- springdoc OpenAPI

## Project Structure

```text
src/main/java/com/final_project/notification_service
├── config
│   ├── AppProperties.java
│   ├── AsyncConfig.java
│   ├── CorsConfig.java
│   ├── EmailConfig.java
│   ├── KafkaConfig.java
│   ├── OpenApiConfig.java
│   └── WebSocketConfig.java
├── controller
│   └── NotificationController.java
├── dto
│   ├── mapper
│   │   └── NotificationMapper.java
│   ├── request
│   │   ├── ResendNotificationRequest.java
│   │   └── SendNotificationRequest.java
│   └── response
│       ├── ApiResponse.java
│       ├── NotificationResponse.java
│       ├── NotificationStatsResponse.java
│       └── PagedResponse.java
├── event
│   ├── BlogCommentedEvent.java
│   ├── BlogInteractionEvent.java
│   ├── CommentRepliedEvent.java
│   ├── InvitationSentEvent.java
│   ├── PasswordChangedEvent.java
│   ├── RepositoryOperationEvent.java
│   ├── ResetPasswordEvent.java
│   └── UserRegisteredEvent.java
├── exception
│   ├── BaseException.java
│   ├── DuplicateNotificationException.java
│   ├── GlobalExceptionHandler.java
│   ├── NotificationNotFoundException.java
│   └── RateLimitExceededException.java
├── kafka
│   └── consumer
│       ├── BlogCommentedConsumer.java
│       ├── BlogInteractionConsumer.java
│       ├── CommentRepliedConsumer.java
│       ├── InvitationSentConsumer.java
│       ├── PasswordChangedConsumer.java
│       ├── RepositoryOperationConsumer.java
│       ├── ResetPasswordConsumer.java
│       └── UserRegisteredConsumer.java
├── model
│   ├── ArticleEventType.java
│   ├── Notification.java
│   ├── NotificationChannel.java
│   ├── NotificationStatus.java
│   ├── NotificationType.java
│   ├── RepositoryEventType.java
│   └── RepositoryMemberRecipient.java
├── repo
│   └── NotificationRepository.java
├── service
│   ├── EmailService.java
│   ├── IdempotencyService.java
│   ├── NotificationService.java
│   ├── NotificationServiceImpl.java
│   ├── RateLimitService.java
│   ├── WebSocketNotificationService.java
│   └── strategy
│       ├── BlogCommentedProcessor.java
│       ├── BlogInteractionProcessor.java
│       ├── CommentRepliedProcessor.java
│       ├── InvitationSentProcessor.java
│       ├── NotificationProcessor.java
│       ├── PasswordChangedProcessor.java
│       ├── RepositoryOperationProcessor.java
│       ├── ResetPasswordProcessor.java
│       └── UserRegisteredProcessor.java
└── websocket
    ├── StompPrincipal.java
    └── WebSocketEventListener.java
```

Resources:

```text
src/main/resources
├── application.yaml
└── templates/email
    ├── article-notification.html
    ├── blog-new-comment.html
    ├── comment-replied.html
    ├── password-changed.html
    ├── password-reset.html
    ├── repo-invitation.html
    ├── repository-notification.html
    ├── system-invitation.html
    └── user-registered.html
```

SQL schema file:

```text
V1 initial notification schema.sql
```

## Notification Entity

Table: `notifications`

Entity fields:

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key |
| `recipientUserId` | `String` | Target application user id |
| `recipientEmail` | `String` | Target email |
| `recipientName` | `String` | Optional display name |
| `type` | `NotificationType` | Business notification type |
| `channel` | `NotificationChannel` | `SMS`, `EMAIL`, `PUSH`, `IN_APP` |
| `status` | `NotificationStatus` | `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `RETRYING`, `SKIPPED` |
| `subject` | `String` | Notification subject |
| `body` | `String` | Notification body |
| `referenceId` | `String` | Related object id |
| `referenceType` | `String` | Related object type |
| `idempotencyKey` | `String` | Unique deduplication key |
| `retryCount` | `Integer` | Retry count |
| `maxRetries` | `Integer` | Max retry attempts, default `3` |
| `failureReason` | `String` | Failure detail |
| `sentAt` | `LocalDateTime` | Send timestamp |
| `metadata` | `String` | Optional JSON snapshot |
| `createdAt` | `LocalDateTime` | Audited create time |
| `updatedAt` | `LocalDateTime` | Audited update time |

Important entity behavior:

- `canRetry()` returns true when `retryCount < maxRetries` and status is not `SENT`
- `markSent()` sets status to `SENT` and fills `sentAt`
- `markFailed(reason)` sets status to `FAILED`
- `incrementRetry()` increments `retryCount` and sets status to `RETRYING`

Indexes defined:

- `idx_notif_user_id`
- `idx_notif_type`
- `idx_notif_status`
- `idx_notif_created`
- `idx_notif_idempotency`
- `idx_notif_reference`
- `idx_notif_status_created`
- `idx_notif_sent_at`

## Enums

### NotificationChannel

```text
SMS
EMAIL
PUSH
IN_APP
```

### NotificationStatus

```text
PENDING
PROCESSING
SENT
FAILED
RETRYING
SKIPPED
```

### NotificationType

```text
USER_REGISTERED
PASSWORD_CHANGED
PASSWORD_RESET
EMAIL_VERIFIED
ACCOUNT_LOCKED
SYSTEM_INVITATION
REPOSITORY_INVITATION
BLOG_NEW_COMMENT
BLOG_COMMENT_REPLY
BLOG_POST_LIKED
BLOG_POST_SHARED
BLOG_POST_PUBLISHED
REPOSITORY_PUSH
REPOSITORY_INVITATION_SENT
REPOSITORY_INVITATION_ACCEPTED
REPOSITORY_BRANCH_CREATED
REPOSITORY_BRANCH_MERGED
REPOSITORY_PULL_REQUEST_OPENED
REPOSITORY_PULL_REQUEST_MERGED
CUSTOM
```

### ArticleEventType

```text
ARTICLE_LIKED
ARTICLE_UNLIKED
ARTICLE_SHARED
COMMENT_CREATED
COMMENT_REPLIED
COMMENT_DELETED
ARTICLE_PUBLISHED
```

### RepositoryEventType

```text
REPOSITORY_PUSHED
REPOSITORY_PULLED
REPOSITORY_FETCHED
REPOSITORY_CLONED
REPOSITORY_INVITATION_SENT
REPOSITORY_INVITATION_ACCEPTED
REPOSITORY_INVITATION_DECLINED
REPOSITORY_CREATED
REPOSITORY_DELETED
REPOSITORY_RENAMED
REPOSITORY_VISIBILITY_CHANGED
BRANCH_CREATED
BRANCH_DELETED
BRANCH_MERGED
COMMIT_CREATED
PULL_REQUEST_OPENED
PULL_REQUEST_MERGED
PULL_REQUEST_CLOSED
```

## Runtime Flow

### REST flow

1. Client calls REST endpoint.
2. Request is validated.
3. Idempotency key is checked against database.
4. Rate limit is checked in Redis.
5. Notification row is saved.
6. Delivery happens by channel:
   - `EMAIL` -> async email send
   - `IN_APP` or `PUSH` -> STOMP user queue send
7. Final status becomes `SENT` or `FAILED`.

### Kafka flow

1. Kafka consumer receives event.
2. Event is converted with Jackson.
3. Redis idempotency lock is acquired.
4. Matching processor maps event to notification.
5. Processor may send email template and/or create in-app notification.
6. Notification is saved and delivered.

## Redis Features

### Idempotency

`IdempotencyService` uses Redis key prefix:

```text
notif:idempotency:
```

Behavior:

- `tryAcquire(key)` sets a Redis key with TTL in hours from `app.notification.idempotencyTtlHours`
- duplicate Kafka events are skipped
- `release(key)` deletes a key
- `exists(key)` checks if key exists
- `remainingTtlSeconds(key)` returns TTL

### Rate Limiting

`RateLimitService` uses Redis key prefix:

```text
notif:ratelimit:
```

Behavior:

- counts notifications per target user in a fixed 1-hour window
- first increment sets a 1 hour TTL
- blocks requests above `app.notification.rateLimit.maxPerUserPerHour`

Default from `AppProperties`:

- `maxPerUserPerHour = 20`

## Email Features

`EmailService` supports:

- `sendHtmlEmail(...)`
- `sendPlainTextEmail(...)`

Email delivery characteristics:

- async via executor `notificationExecutor`
- Resilience4j circuit breaker name `emailService`
- Resilience4j retry name `emailService`
- HTML emails use Thymeleaf templates
- plain text is used by REST send/resend flow

Configured sender defaults:

- `fromEmail = no-reply@app.com`
- `fromName = App Notifications`

## WebSocket / Real-Time Notifications

### Configuration

The service enables STOMP message broker with:

- broker destinations: `/topic`, `/queue`, `/repo`
- application prefix: `/app`
- user destination prefix: `/user`

Endpoints:

- `/ws` with SockJS fallback
- `/ws/native` for native WebSocket clients

### How notifications are sent in code

`WebSocketNotificationService` sends user-targeted notifications like this:

```java
messagingTemplate.convertAndSendToUser(
    notification.getRecipientUserId(),
    "/queue/notifications",
    mapper.toResponse(notification)
);
```

That means the intended destination for a connected client is:

```text
/user/queue/notifications
```

### What the client/browser should subscribe to

For real-time per-user notifications, the browser should:

1. Connect to `/ws` using SockJS + STOMP, or `/ws/native` using a native WebSocket STOMP client.
2. Establish the user identity on the server side.
3. Subscribe to:

```text
/user/queue/notifications
```

4. Receive `NotificationResponse` objects as message bodies.

Example payload pushed over websocket:

```json
{
  "id": "c7f9f6a3-7d2f-4a72-85eb-b2d3df54c0cd",
  "recipientUserId": "usr_abc123",
  "recipientEmail": "john@example.com",
  "recipientName": "John Doe",
  "type": "BLOG_NEW_COMMENT",
  "channel": "IN_APP",
  "status": "SENT",
  "subject": "Ali commented on your post: Spring Tips",
  "body": "New comment notification sent.",
  "referenceId": "post_42",
  "referenceType": "BLOG_POST",
  "retryCount": 0,
  "maxRetries": 3,
  "failureReason": null,
  "sentAt": "2026-05-04T18:00:00",
  "createdAt": "2026-05-04T17:59:59",
  "updatedAt": "2026-05-04T18:00:00"
}
```

### Important current limitation in this codebase

The current `WebSocketConfig` does not bind the websocket `Principal` to your application `userId`.

Current behavior in code:

- `CustomHandshakeHandler` creates a random `UUID` principal for every connection
- `convertAndSendToUser(...)` sends to `recipientUserId`

Because of that mismatch, real user-specific delivery will only work if the websocket connection principal name equals the same `recipientUserId`. In the current code, that does not happen automatically.

In other words:

- intended subscription path is correct: `/user/queue/notifications`
- intended server send method is correct: `convertAndSendToUser(recipientUserId, ...)`
- but actual specific-user routing is incomplete because the websocket session principal is random, not the real logged-in user id

### What is needed for true user-specific browser subscriptions

To make per-user real-time notifications work correctly, the server must identify the websocket user with the real app user id, usually from:

- JWT bearer token
- session authentication
- custom handshake header or query parameter

The principal name should become something like:

```text
usr_abc123
```

Then the browser subscribes only to:

```text
/user/queue/notifications
```

Spring resolves that to the current authenticated principal internally.

### Browser example with SockJS + STOMP

This is the client-side pattern the browser should use after the server principal is fixed to the real user id:

```js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const socketFactory = () => new SockJS("http://localhost:8080/ws");

const client = new Client({
  webSocketFactory: socketFactory,
  reconnectDelay: 5000,
  debug: console.log
});

client.onConnect = () => {
  client.subscribe("/user/queue/notifications", (message) => {
    const notification = JSON.parse(message.body);
    console.log("Real-time notification:", notification);
  });
};

client.activate();
```

### Native WebSocket STOMP example

```js
import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: "ws://localhost:8080/ws/native",
  reconnectDelay: 5000
});

client.onConnect = () => {
  client.subscribe("/user/queue/notifications", (message) => {
    console.log(JSON.parse(message.body));
  });
};

client.activate();
```

### WebSocket events logged by the service

`WebSocketEventListener` logs:

- connect
- disconnect
- subscribe
- unsubscribe

Note:

- it tries to read `sessionAttributes["username"]`
- this attribute is not set by the current handshake code
- so these logs are mainly connection diagnostics, not reliable user identity tracking

## REST API

All responses use:

```json
{
  "success": true,
  "message": "optional message",
  "data": {},
  "error": null,
  "timestamp": "2026-05-04T18:00:00"
}
```

Failure shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": null,
    "fieldErrors": {
      "recipientEmail": "Must be a valid email address"
    }
  },
  "timestamp": "2026-05-04T18:00:00"
}
```

### 1. Send a custom notification

`POST /api/v1/notifications`

Purpose:

- create and dispatch a custom one-off notification

Request body:

```json
{
  "recipientUserId": "usr_abc123",
  "recipientEmail": "john@example.com",
  "recipientName": "John Doe",
  "type": "CUSTOM",
  "channel": "IN_APP",
  "subject": "Build finished",
  "body": "Your repository build completed successfully.",
  "referenceId": "repo_100",
  "referenceType": "REPOSITORY",
  "idempotencyKey": "build:repo_100:user_abc123"
}
```

Validation rules:

- `recipientUserId` required
- `recipientEmail` required and valid email
- `recipientName` max 200
- `type` required
- `channel` required
- `subject` required, max 500
- `body` required
- `referenceId` max 100
- `referenceType` max 50
- `idempotencyKey` max 200

Response:

- `201 Created`

`data` object type: `NotificationResponse`

### 2. Resend a failed notification

`POST /api/v1/notifications/{id}/resend`

Purpose:

- retry sending an existing failed notification

Path parameter:

- `id` = notification UUID

Request body:

```json
{
  "notificationId": "11111111-2222-3333-4444-555555555555",
  "overrideEmail": "new-target@example.com"
}
```

Important behavior:

- controller overwrites `notificationId` from path variable
- resend is allowed only when `canRetry()` returns true
- resend sends plain text email

Response:

- `200 OK`

### 3. Get notification by id

`GET /api/v1/notifications/{id}`

Response:

- `200 OK`
- `404 Not Found`

`data` object type: `NotificationResponse`

### 4. Get notifications for a user

`GET /api/v1/notifications/user/{userId}?page=0&size=20`

Purpose:

- paginated notifications for one user

Sorting:

- `createdAt DESC`

Response:

- `200 OK`

`data` object type: `PagedResponse<NotificationResponse>`

Example `data`:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "last": true,
  "first": true
}
```

### 5. Get notifications for a user by type

`GET /api/v1/notifications/user/{userId}/type/{type}?page=0&size=20`

Example:

```text
/api/v1/notifications/user/usr_abc123/type/BLOG_NEW_COMMENT?page=0&size=10
```

### 6. Get notifications for a user by status

`GET /api/v1/notifications/user/{userId}/status/{status}?page=0&size=20`

Example:

```text
/api/v1/notifications/user/usr_abc123/status/SENT?page=0&size=10
```

### 7. Get unread count for a user

`GET /api/v1/notifications/user/{userId}/unread-count`

Current implementation detail:

- unread count is computed as count of notifications with status `PENDING`

Response:

```json
{
  "success": true,
  "message": "Unread count: 3",
  "data": 3,
  "timestamp": "2026-05-04T18:00:00"
}
```

### 8. Get all notifications

`GET /api/v1/notifications?page=0&size=20`

Purpose:

- global paginated list, described as admin-only by controller docs

### 9. Get notifications by status

`GET /api/v1/notifications/status/{status}?page=0&size=20`

Example:

```text
/api/v1/notifications/status/FAILED?page=0&size=20
```

### 10. Get notifications by type

`GET /api/v1/notifications/type/{type}?page=0&size=20`

Example:

```text
/api/v1/notifications/type/REPOSITORY_PUSH?page=0&size=20
```

### 11. Get notifications by reference

`GET /api/v1/notifications/reference?referenceId=repo_100&referenceType=REPOSITORY&page=0&size=20`

Purpose:

- fetch notifications connected to a specific blog post, repository, comment, or other entity

### 12. Retry failed notifications job

`POST /api/v1/notifications/admin/retry-failed`

Purpose:

- manually trigger retry job

Response:

```json
{
  "success": true,
  "message": null,
  "data": "Retry job triggered",
  "timestamp": "2026-05-04T18:00:00"
}
```

Also note:

- the same retry logic runs automatically every 5 minutes with `@Scheduled(fixedDelayString = "PT5M")`

### 13. Cleanup old sent notifications

`DELETE /api/v1/notifications/admin/cleanup?daysOld=30`

Purpose:

- delete old notifications with status `SENT` where `sentAt < now - daysOld`

Response:

```json
{
  "success": true,
  "message": null,
  "data": "Cleanup completed",
  "timestamp": "2026-05-04T18:00:00"
}
```

### 14. Get notification statistics

`GET /api/v1/notifications/admin/stats`

Optional query params:

- `from`
- `to`

If omitted:

- `from = now - 7 days`
- `to = now`

Example:

```text
/api/v1/notifications/admin/stats?from=2026-05-01T00:00:00&to=2026-05-04T23:59:59
```

Response `data` type:

```json
{
  "total": 15,
  "byStatus": {
    "SENT": 12,
    "FAILED": 3
  },
  "byType": {
    "BLOG_NEW_COMMENT": 5,
    "CUSTOM": 10
  },
  "successRate": 80.0,
  "averageRetries": 0.0
}
```

## NotificationResponse Object

This object is returned by REST APIs and also pushed over websocket for in-app notifications.

```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "recipientUserId": "usr_abc123",
  "recipientEmail": "john@example.com",
  "recipientName": "John Doe",
  "type": "CUSTOM",
  "channel": "IN_APP",
  "status": "SENT",
  "subject": "Build finished",
  "body": "Your repository build completed successfully.",
  "referenceId": "repo_100",
  "referenceType": "REPOSITORY",
  "retryCount": 0,
  "maxRetries": 3,
  "failureReason": null,
  "sentAt": "2026-05-04T18:00:00",
  "createdAt": "2026-05-04T17:59:58",
  "updatedAt": "2026-05-04T18:00:00"
}
```

## Repository Queries Exposed by Behavior

- `findByIdempotencyKey`
- `existsByIdempotencyKey`
- `findByRecipientUserIdOrderByCreatedAtDesc`
- `findByRecipientUserIdAndTypeOrderByCreatedAtDesc`
- `findByRecipientUserIdAndStatusOrderByCreatedAtDesc`
- `countByRecipientUserIdAndStatus`
- `findByStatusOrderByCreatedAtDesc`
- `findByTypeOrderByCreatedAtDesc`
- `findRetryableNotifications`
- `findStalePendingNotifications`
- `findByReferenceIdAndReferenceTypeOrderByCreatedAtDesc`
- `getNotificationStatsByPeriod`
- `countRecentByUser`
- `bulkUpdateStatus`
- `deleteOldSentNotifications`

## Kafka Topics and Consumers

Configured topic defaults in `AppProperties`:

| Property | Default topic |
|---|---|
| `app.kafka.topics.userRegistered` | `user.registered` |
| `app.kafka.topics.passwordChanged` | `password.changed` |
| `app.kafka.topics.invitationSent` | `invitation.sent` |
| `app.kafka.topics.blogCommented` | `blog.commented` |
| `app.kafka.topics.commentReplied` | `comment.replied` |
| `app.kafka.topics.notificationDlq` | `notification.dlq` |
| `app.kafka.topics.repositoryOperation` | `repository.operations` |
| `app.kafka.topics.articleOperations` | `article.operations` |
| `app.kafka.topics.resetPassword` | `reset.password` |

Consumers present:

| Consumer | Topic expression in code | Event class | Processor |
|---|---|---|---|
| `UserRegisteredConsumer` | `${app.kafka.topics.user-registered}` | `UserRegisteredEvent` | `UserRegisteredProcessor` |
| `PasswordChangedConsumer` | `${app.kafka.topics.password-changed}` | `PasswordChangedEvent` | `PasswordChangedProcessor` |
| `ResetPasswordConsumer` | `reset.password` | `ResetPasswordEvent` | `ResetPasswordProcessor` |
| `InvitationSentConsumer` | `${app.kafka.topics.invitation-sent}` | `InvitationSentEvent` | `InvitationSentProcessor` |
| `BlogCommentedConsumer` | `${app.kafka.topics.blog-commented}` | `BlogCommentedEvent` | `BlogCommentedProcessor` |
| `CommentRepliedConsumer` | `${app.kafka.topics.comment-replied}` | `CommentRepliedEvent` | `CommentRepliedProcessor` |
| `BlogInteractionConsumer` | `${app.kafka.topics.article-operation}` | `BlogInteractionEvent` | `BlogInteractionProcessor` |
| `RepositoryOperationConsumer` | `${app.kafka.topics.repository.operation}` | `RepositoryOperationEvent` | `RepositoryOperationProcessor` |

Important note:

- several `@KafkaListener` property placeholders do not match the camelCase property names defined in `AppProperties`
- `KafkaConfig` also calls getters such as `getArticleOperations()` and `getRepositoryOperation()` while the property class fields are `articleOperations` and `repositoryOperation`
- this is relevant for deployment and should be reviewed in environment configuration

### Event payloads

#### UserRegisteredEvent

```json
{
  "eventId": "evt-1",
  "userId": "usr_1",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "verificationToken": "token",
  "registrationSource": "WEB",
  "occurredAt": "2026-05-04T18:00:00"
}
```

Effect:

- sends `user-registered` HTML email
- stores `USER_REGISTERED` notification with channel `EMAIL`

#### ResetPasswordEvent

```json
{
  "eventId": "evt-2",
  "userId": "usr_1",
  "email": "john@example.com",
  "firstName": "John",
  "changeType": "RESET",
  "ipAddress": "127.0.0.1",
  "userAgent": "Chrome",
  "occurredAt": "2026-05-04T18:00:00",
  "resetToken": "token"
}
```

Effect:

- sends `password-reset` HTML email
- stores `PASSWORD_RESET` notification with channel `EMAIL`

#### PasswordChangedEvent

```json
{
  "eventId": "evt-3",
  "userId": "usr_1",
  "email": "john@example.com",
  "firstName": "John",
  "changeType": "CHANGED",
  "ipAddress": "127.0.0.1",
  "userAgent": "Chrome",
  "occurredAt": "2026-05-04T18:00:00"
}
```

Effect:

- sends `password-changed` HTML email
- stores `PASSWORD_CHANGED` notification with channel `EMAIL`

#### InvitationSentEvent

```json
{
  "eventId": "evt-4",
  "invitationId": "inv-1",
  "inviteeEmail": "guest@example.com",
  "inviteeName": "Guest",
  "inviterUserId": "usr_admin",
  "inviterName": "Admin",
  "invitationType": "REPOSITORY",
  "targetId": "repo_100",
  "targetName": "alpha-repo",
  "targetUrl": "https://app/repo/100",
  "invitationToken": "token",
  "expiresAt": "2026-05-10T00:00:00",
  "occurredAt": "2026-05-04T18:00:00"
}
```

Effect:

- sends repository or system invitation email
- stores `REPOSITORY_INVITATION` or `SYSTEM_INVITATION`

#### BlogCommentedEvent

```json
{
  "eventId": "evt-5",
  "commentId": "c1",
  "blogPostId": "post_1",
  "blogPostTitle": "Spring Tips",
  "blogPostUrl": "https://app/blog/post_1",
  "authorUserId": "usr_author",
  "authorEmail": "author@example.com",
  "authorName": "Author",
  "commenterUserId": "usr_actor",
  "commenterName": "Ali",
  "commentSnippet": "Great article",
  "occurredAt": "2026-05-04T18:00:00"
}
```

Effect:

- skips self-comment
- sends `blog-new-comment` email
- creates `BLOG_NEW_COMMENT` in-app notification

#### CommentRepliedEvent

```json
{
  "eventId": "evt-6",
  "replyId": "r1",
  "parentCommentId": "c1",
  "blogPostId": "post_1",
  "blogPostTitle": "Spring Tips",
  "blogPostUrl": "https://app/blog/post_1",
  "originalCommenterUserId": "usr_original",
  "originalCommenterEmail": "owner@example.com",
  "originalCommenterName": "Owner",
  "replierUserId": "usr_replier",
  "replierName": "Ali",
  "replySnippet": "Thanks",
  "occurredAt": "2026-05-04T18:00:00"
}
```

Effect:

- skips self-reply
- sends `comment-replied` email
- creates `BLOG_COMMENT_REPLY` in-app notification

#### BlogInteractionEvent

```json
{
  "eventId": "evt-7",
  "eventType": "ARTICLE_LIKED",
  "blogPostId": "post_1",
  "blogPostTitle": "Spring Tips",
  "blogPostUrl": "https://app/blog/post_1",
  "authorUserId": "usr_author",
  "authorEmail": "author@example.com",
  "authorName": "Author",
  "actorUserId": "usr_actor",
  "actorName": "Ali",
  "actorEmail": "ali@example.com",
  "commentId": null,
  "parentCommentId": null,
  "commentSnippet": null,
  "sharePlatform": null,
  "profile": null,
  "adminUserId": null,
  "adminName": null,
  "adminEmail": null,
  "occurredAt": "2026-05-04T18:00:00",
  "metadata": {}
}
```

Handled mappings:

- `COMMENT_REPLIED` -> `BLOG_COMMENT_REPLY`
- `COMMENT_CREATED` -> `BLOG_NEW_COMMENT`
- `ARTICLE_LIKED` -> `BLOG_POST_LIKED`
- `ARTICLE_SHARED` -> `BLOG_POST_SHARED`
- `ARTICLE_PUBLISHED` -> `BLOG_POST_PUBLISHED`
- `ARTICLE_UNLIKED` and `COMMENT_DELETED` -> no notification

Effect:

- skips self-actions
- creates `IN_APP` notifications only

#### RepositoryOperationEvent

```json
{
  "eventId": "evt-8",
  "eventType": "PULL_REQUEST_OPENED",
  "repositoryId": "repo_100",
  "repositoryName": "alpha-repo",
  "repositoryUrl": "https://app/repos/repo_100",
  "actorUserId": "usr_actor",
  "actorName": "Ali",
  "actorEmail": "ali@example.com",
  "ownerUserId": "usr_owner",
  "ownerName": "Owner",
  "ownerEmail": "owner@example.com",
  "branchName": "feature-x",
  "sourceBranch": "feature-x",
  "targetBranch": "main",
  "commitId": "abc123",
  "commitMessage": "add feature",
  "commitCount": 1,
  "pullRequestId": "pr_10",
  "pullRequestTitle": "Feature X",
  "pullRequestUrl": "https://app/pr/pr_10",
  "invitedUserId": "usr_guest",
  "invitedUserName": "Guest",
  "invitedUserEmail": "guest@example.com",
  "recipients": [
    {
      "userId": "usr_owner",
      "name": "Owner",
      "email": "owner@example.com",
      "role": "OWNER"
    }
  ],
  "occurredAt": "2026-05-04T18:00:00",
  "metadata": {}
}
```

Handled mappings:

- `REPOSITORY_PUSHED`, `COMMIT_CREATED` -> `REPOSITORY_PUSH`
- `REPOSITORY_INVITATION_SENT` -> `REPOSITORY_INVITATION_SENT`
- `REPOSITORY_INVITATION_ACCEPTED` -> `REPOSITORY_INVITATION_ACCEPTED`
- `BRANCH_CREATED` -> `REPOSITORY_BRANCH_CREATED`
- `BRANCH_MERGED` -> `REPOSITORY_BRANCH_MERGED`
- `PULL_REQUEST_OPENED` -> `REPOSITORY_PULL_REQUEST_OPENED`
- `PULL_REQUEST_MERGED` -> `REPOSITORY_PULL_REQUEST_MERGED`
- pulled/fetched/cloned -> ignored

Effect:

- skips actor notifications
- creates per-recipient `IN_APP` notifications

## Error Handling

Handled exceptions:

| Exception | HTTP status | Error code |
|---|---|---|
| `NotificationNotFoundException` | `404` | `NOTIFICATION_NOT_FOUND` |
| `DuplicateNotificationException` | `409` | `DUPLICATE_NOTIFICATION` |
| `RateLimitExceededException` | `429` | `RATE_LIMIT_EXCEEDED` |
| `MethodArgumentNotValidException` | `400` | `VALIDATION_ERROR` |
| `BaseException` | `500` | `INTERNAL_ERROR` |
| generic `Exception` | `500` | `INTERNAL_ERROR` |

## Scheduling and Retry

Scheduled retry job:

```text
every 5 minutes
```

Retry candidate selection:

- status in `FAILED`, `RETRYING`
- `retryCount < maxRetries`
- created within last 24 hours

Cleanup rule:

- delete rows where status is `SENT` and `sentAt` is older than cutoff

## Security and CORS

OpenAPI declares bearer auth:

```text
scheme: bearer
format: JWT
```

REST CORS allows:

- `http://localhost:63342`
- `http://localhost:3000`
- `http://localhost:5173`

Methods:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

WebSocket endpoint currently allows:

```text
setAllowedOriginPatterns("*")
```

## Configuration Summary

`application.yaml` currently contains:

- application name `notification-service`
- optional Spring Config Server import from `http://localhost:8888`
- Flyway enabled

Many runtime properties are expected from external configuration, especially:

- `spring.kafka.bootstrap-servers`
- `spring.mail.*`
- `spring.datasource.*`
- `spring.data.redis.*`
- `app.notification.*`
- `app.kafka.topics.*`

## Known Implementation Notes

These are important if this file is used as a delivery contract.

1. Real user-specific websocket delivery is not fully wired yet because websocket principal names are random UUIDs, while sends target `recipientUserId`.
2. `WebSocketEventListener` reads a `username` session attribute that is never set by the handshake logic.
3. Some Kafka topic placeholders in `@KafkaListener` annotations do not match the property names defined in `AppProperties`.
4. `BlogInteractionProcessor` currently stores placeholder values for some recipient fields:
   - `recipientEmail = "no-email@gmail.com"`
   - `recipientName = "unknown"`
5. `InvitationSentProcessor` uses `recipientUserId = inviteeEmail` because the invited user may not exist yet.
6. `countUnreadByUser` currently treats `PENDING` as unread; there is no separate read/unread flag in the entity.
7. SQL enum check list in `V1 initial notification schema.sql` is narrower than the current Java `NotificationType` enum, so schema and code should be kept aligned.

## Client Integration Summary

If the client wants complete notification support, it should use both patterns:

- REST for history, pagination, filtering, unread counts, retry/admin actions
- WebSocket for live in-app updates

Recommended browser flow for a specific logged-in user:

1. Load historical notifications from:
   - `GET /api/v1/notifications/user/{userId}`
2. Open STOMP websocket connection to:
   - `/ws` or `/ws/native`
3. Subscribe to:
   - `/user/queue/notifications`
4. When a message arrives, append the received `NotificationResponse` to UI state.

Critical requirement:

- the websocket session principal must equal the actual app `userId`, otherwise user-specific real-time delivery will not route correctly.

# Source Dump from `src/main`

This file mirrors the current contents of every file under `src/main`.

## `src/main\resources\application.yaml`

```yaml
spring:
  application:
    name: version-control-service
  config:
    import: optional:configserver:http://localhost:8888
  profiles:
    active: native

```

## `src/main\java\com\final_project\versioncontrolservice\websocket\WebSocketEvents.java`

```java
package com.final_project.versioncontrolservice.websocket;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class WebSocketEvents {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WebSocketMessage {
        private String type;        // Event type
        private String repository;  // owner/repo
        private String branch;
        private String user;        // Username who triggered the event
        private Object payload;     // Event-specific data
        private Instant timestamp;
        private String messageId;   // Unique message ID for deduplication
    }

    // ─── Push Event ───────────────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PushEvent {
        private String ref;           // e.g., "refs/heads/main"
        private String before;        // Commit SHA before push
        private String after;         // Commit SHA after push
        private boolean created;      // New branch created?
        private boolean deleted;      // Branch deleted?
        private boolean forced;       // Force push?
        private List<CommitInfo> commits;
        private RepositoryInfo repository;
        private PusherInfo pusher;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitInfo {
        private String id;
        private String message;
        private String timestamp;
        private String author;
        private List<String> added;
        private List<String> modified;
        private List<String> removed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositoryInfo {
        private String name;
        private String owner;
        private String fullName;
        private String url;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PusherInfo {
        private String name;
        private String email;
    }

    // ─── Pull Request Events ──────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PullRequestEvent {
        private String action;        // "opened", "closed", "merged", "updated"
        private int number;
        private PullRequestInfo pullRequest;
        private RepositoryInfo repository;
        private UserInfo sender;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PullRequestInfo {
        private String id;
        private String title;
        private String body;
        private String state;         // "open", "closed", "merged"
        private String sourceBranch;
        private String targetBranch;
        private UserInfo author;
        private List<String> reviewers;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String username;
        private String avatarUrl;
        private String profileUrl;
    }

    // ─── File Change Events ───────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileChangeEvent {
        private String path;
        private String action;        // "created", "updated", "deleted", "renamed"
        private String previousPath;  // For renames
        private String content;       // New content (for real-time editing)
        private String diff;          // Unified diff
        private UserInfo editor;
        private Instant editedAt;
    }

    // ─── Collaboration Events ─────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollaborationEvent {
        private String filePath;
        private String editor;
        private CursorPosition cursor;
        private String selection;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CursorPosition {
        private int line;
        private int column;
    }

    // ─── Notification Events ──────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationEvent {
        private String id;
        private String type;          // "mention", "review", "comment", "invite"
        private String title;
        private String message;
        private String url;
        private UserInfo sender;
        private Instant createdAt;
        private boolean read;
    }

    // ─── Repository Activity ──────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositoryActivity {
        private String type;          // "commit", "branch", "tag", "release"
        private String description;
        private UserInfo actor;
        private Instant timestamp;
        private Map<String, Object> metadata;
    }

    // ─── Live Edit Session ────────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiveEditSession {
        private String sessionId;
        private String filePath;
        private String branch;
        private List<String> participants;
        private String content;
        private long version;         // For conflict resolution
        private Instant lastModified;
    }

    // ─── Merge Conflict Event ─────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MergeConflictEvent {
        private String filePath;
        private String baseContent;
        private String ourContent;
        private String theirContent;
        private List<ConflictRegion> conflicts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictRegion {
        private int ourStartLine;
        private int ourEndLine;
        private int theirStartLine;
        private int theirEndLine;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\websocket\WebSocketEventListener.java`

```java
package com.final_project.versioncontrolservice.websocket;
import com.final_project.versioncontrolservice.service.WebSocketNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

import java.util.Map;

@Component
public class WebSocketEventListener {

    @Autowired
    private WebSocketNotificationService notificationService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        System.out.println("WebSocket Connected: " + username);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes != null) {
            String username = (String) sessionAttributes.get("username");
            System.out.println("WebSocket Disconnected: " + username);

            // Clean up - remove user from any repos they were viewing
            // In production, you'd track which repos the user was viewing
        }
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        System.out.println("Subscribed to: " + destination);
    }

    @EventListener
    public void handleUnsubscribeEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        System.out.println("Unsubscribed from: " + destination);
    }
}
//// Add WebSocket notifications to PullRequestController
//
//@Autowired
//private WebSocketNotificationService notificationService;
//
//// Update create method
//@PostMapping(path = "/repos/{owner}/{repo}/pulls", ...)
//public ResponseEntity<PullRequestResponse> create(...) {
//    // ... existing code ...
//
//    PullRequest pr = pullRequestApplicationService.create(...);
//
//    // Send WebSocket notification
//    PullRequestEvent prEvent = PullRequestEvent.builder()
//            .action("opened")
//            .pullRequest(PullRequestInfo.builder()
//                    .id(pr.getId().toHexString())
//                    .title(pr.getTitle())
//                    .body(pr.getDescription())
//                    .state("open")
//                    .sourceBranch(pr.getSourceBranch())
//                    .targetBranch(pr.getTargetBranch())
//                    .author(UserInfo.builder().username(user.getUsername()).build())
//                    .build())
//            .repository(RepositoryInfo.builder()
//                    .name(repo)
//                    .owner(owner)
//                    .fullName(owner + "/" + repo)
//                    .build())
//            .sender(UserInfo.builder().username(user.getUsername()).build())
//            .build();
//
//    notificationService.notifyPullRequest(owner, repo, prEvent);
//
//    return ResponseEntity.status(HttpStatus.CREATED).body(PullRequestResponse.from(pr));
//}


//// Add to the existing RepositoryController class:
//
//@Autowired
//private WebSocketNotificationService notificationService;
//
//// Update the updateBranch method to send WebSocket notification
//@PostMapping(
//        path = "/repos/{owner}/{repo}/refs/heads/{branch}",
//        consumes = MediaType.APPLICATION_JSON_VALUE,
//        produces = MediaType.APPLICATION_JSON_VALUE
//)
//public UpdateBranchResponse updateBranch(
//        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
//        @PathVariable String owner,
//        @PathVariable String repo,
//        @PathVariable String branch,
//        @RequestBody UpdateBranchBody body
//) {
//    UserDocument user = authService.requireUser(authorization);
//    var meta = vicRepositoryService.loadMeta(owner, repo);
//
//    if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
//        throw new ForbiddenException("forbidden");
//    }
//
//    if (body == null || body.hash() == null || body.hash().isBlank()) {
//        throw new BadRequestException("hash is required");
//    }
//
//    // Get old hash before update
//    String oldHash = meta.getBranchHeads().getOrDefault(branch, "");
//
//    vicRepositoryService.updateBranchRef(meta, branch, body.hash().trim());
//
//    // Send WebSocket notification
//    PushEvent pushEvent = PushEvent.builder()
//            .ref("refs/heads/" + branch)
//            .before(oldHash)
//            .after(body.hash().trim())
//            .created(oldHash.isEmpty())
//            .deleted(false)
//            .forced(false)
//            .repository(RepositoryInfo.builder()
//                    .name(repo)
//                    .owner(owner)
//                    .fullName(owner + "/" + repo)
//                    .build())
//            .pusher(PusherInfo.builder()
//                    .name(user.getUsername())
//                    .email(user.getEmail())
//                    .build())
//            .build();
//
//    notificationService.notifyPush(owner, repo, pushEvent);
//
//    return new UpdateBranchResponse("updated", branch.trim());
//}
```

## `src/main\java\com\final_project\versioncontrolservice\websocket\StompPrincipal.java`

```java
package com.final_project.versioncontrolservice.websocket;


import java.security.Principal;

public class StompPrincipal implements Principal {
    private final String name;

    public StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}

```

## `src/main\java\com\final_project\versioncontrolservice\websocket\AuthHandshakeInterceptor.java`

```java
package com.final_project.versioncontrolservice.websocket;


import com.final_project.versioncontrolservice.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Component
public class AuthHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {

        // Extract token from query parameter or header
        String token = null;
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            token = servletRequest.getParameter("token");

            if (token == null) {
                // Try from Authorization header
                String authHeader = servletRequest.getHeader(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                }
            }
        }

        // Authenticate user
//        if (token != null) {
//            Optional<UserDocument> user = authService.getContributorUser("232");
//            if (user.isPresent()) {
//                attributes.put("username", user.get().getUsername());
//                attributes.put("userId", user.get().getId().toString());
//                attributes.put("authenticated", true);
//                return true;
//            }
//        }

        attributes.put("authenticated", false);
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\VersionControlServiceApplication.java`

```java
package com.final_project.versioncontrolservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VersionControlServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VersionControlServiceApplication.class, args);
    }

}
```

## `src/main\java\com\final_project\versioncontrolservice\service\WebSocketNotificationService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.websocket.WebSocketEvents.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Track active editing sessions
    private final Map<String, LiveEditSession> activeEdits = new ConcurrentHashMap<>();

    // Track online users per repository
    private final Map<String, Map<String, Boolean>> repoViewers = new ConcurrentHashMap<>();

    /**
     * Broadcast push event to all repository watchers
     */
    public void notifyPush(String owner, String repo, PushEvent event) {
        String destination = "/repo/" + owner + "/" + repo + "/push";
        WebSocketMessage message = WebSocketMessage.builder()
                .type("push")
                .repository(owner + "/" + repo)
                .user(event.getPusher().getName())
                .payload(event)
                .timestamp(Instant.now())
                .messageId(UUID.randomUUID().toString())
                .build();

        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * Notify about pull request changes
     */
    public void notifyPullRequest(String owner, String repo, PullRequestEvent event) {
        String destination = "/repo/" + owner + "/" + repo + "/pulls";
        WebSocketMessage message = WebSocketMessage.builder()
                .type("pull_request")
                .repository(owner + "/" + repo)
                .user(event.getSender().getUsername())
                .payload(event)
                .timestamp(Instant.now())
                .messageId(UUID.randomUUID().toString())
                .build();

        messagingTemplate.convertAndSend(destination, message);

        // Also notify specific users (reviewers, author)
        if (event.getPullRequest().getReviewers() != null) {
            for (String reviewer : event.getPullRequest().getReviewers()) {
                messagingTemplate.convertAndSendToUser(
                        reviewer,
                        "/queue/pull-requests",
                        message
                );
            }
        }
    }

    /**
     * Broadcast file changes for real-time collaboration
     */
    public void notifyFileChange(String owner, String repo, String branch, FileChangeEvent event) {
        String destination = "/repo/" + owner + "/" + repo + "/files/" + branch;
        WebSocketMessage message = WebSocketMessage.builder()
                .type("file_change")
                .repository(owner + "/" + repo)
                .branch(branch)
                .user(event.getEditor().getUsername())
                .payload(event)
                .timestamp(Instant.now())
                .messageId(UUID.randomUUID().toString())
                .build();

        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * Send notification to specific user
     */
    public void sendUserNotification(String username, NotificationEvent notification) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type("notification")
                .user(username)
                .payload(notification)
                .timestamp(Instant.now())
                .messageId(UUID.randomUUID().toString())
                .build();

        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                message
        );
    }

    /**
     * Broadcast repository activity
     */
    public void broadcastActivity(String owner, String repo, RepositoryActivity activity) {
        String destination = "/repo/" + owner + "/" + repo + "/activity";
        WebSocketMessage message = WebSocketMessage.builder()
                .type("activity")
                .repository(owner + "/" + repo)
                .user(activity.getActor().getUsername())
                .payload(activity)
                .timestamp(Instant.now())
                .messageId(UUID.randomUUID().toString())
                .build();

        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * Start or update live editing session
     */
    public void startLiveEdit(String owner, String repo, String branch, String filePath, String username) {
        String sessionKey = owner + "/" + repo + "/" + branch + "/" + filePath;

        LiveEditSession session = activeEdits.computeIfAbsent(sessionKey, k ->
                LiveEditSession.builder()
                        .sessionId(UUID.randomUUID().toString())
                        .filePath(filePath)
                        .branch(branch)
                        .build()
        );

        if (!session.getParticipants().contains(username)) {
            session.getParticipants().add(username);
        }

        // Notify others that user started editing
        CollaborationEvent collabEvent = CollaborationEvent.builder()
                .filePath(filePath)
                .editor(username)
                .build();

        String destination = "/repo/" + owner + "/" + repo + "/collaboration/" + branch;
        messagingTemplate.convertAndSend(destination,
                WebSocketMessage.builder()
                        .type("user_joined_edit")
                        .repository(owner + "/" + repo)
                        .user(username)
                        .payload(collabEvent)
                        .build()
        );
    }

    /**
     * Update cursor position for collaborative editing
     */
    public void updateCursorPosition(String owner, String repo, String branch,
                                     String filePath, String username,
                                     int line, int column) {
        CollaborationEvent event = CollaborationEvent.builder()
                .filePath(filePath)
                .editor(username)
                .cursor(CursorPosition.builder().line(line).column(column).build())
                .build();

        String destination = "/repo/" + owner + "/" + repo + "/cursors/" + branch;
        messagingTemplate.convertAndSend(destination,
                WebSocketMessage.builder()
                        .type("cursor_update")
                        .repository(owner + "/" + repo)
                        .user(username)
                        .payload(event)
                        .build()
        );
    }

    /**
     * Notify about merge conflicts
     */
    public void notifyMergeConflict(String owner, String repo, String branch,
                                    MergeConflictEvent conflict) {
        String destination = "/repo/" + owner + "/" + repo + "/merge/" + branch;
        messagingTemplate.convertAndSend(destination,
                WebSocketMessage.builder()
                        .type("merge_conflict")
                        .repository(owner + "/" + repo)
                        .branch(branch)
                        .payload(conflict)
                        .timestamp(Instant.now())
                        .build()
        );
    }

    /**
     * Track repository viewers (online users)
     */
    public void userJoinedRepo(String owner, String repo, String username) {
        String key = owner + "/" + repo;
        repoViewers.computeIfAbsent(key, k -> new ConcurrentHashMap<>())
                .put(username, true);

        // Broadcast updated viewer list
        broadcastViewerList(owner, repo);
    }

    public void userLeftRepo(String owner, String repo, String username) {
        String key = owner + "/" + repo;
        Map<String, Boolean> viewers = repoViewers.get(key);
        if (viewers != null) {
            viewers.remove(username);
            broadcastViewerList(owner, repo);
        }
    }

    private void broadcastViewerList(String owner, String repo) {
        String key = owner + "/" + repo;
        Map<String, Boolean> viewers = repoViewers.getOrDefault(key, new ConcurrentHashMap<>());

        String destination = "/repo/" + owner + "/" + repo + "/viewers";
        messagingTemplate.convertAndSend(destination,
                WebSocketMessage.builder()
                        .type("viewers_update")
                        .repository(key)
                        .payload(Map.of("viewers", viewers.keySet()))
                        .timestamp(Instant.now())
                        .build()
        );
    }

    /**
     * Get active editing sessions for a repository
     */
    public Map<String, LiveEditSession> getActiveEdits(String owner, String repo) {
        String prefix = owner + "/" + repo + "/";
        Map<String, LiveEditSession> repoEdits = new ConcurrentHashMap<>();

        for (Map.Entry<String, LiveEditSession> entry : activeEdits.entrySet()) {
            if (entry.getKey().startsWith(prefix)) {
                repoEdits.put(entry.getKey(), entry.getValue());
            }
        }

        return repoEdits;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\VicObjectFormat.java`

```java
package com.final_project.versioncontrolservice.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.InflaterInputStream;

public final class VicObjectFormat {

    private VicObjectFormat() {}

    public record ParsedObject(String type, byte[] content) {}

    public static byte[] zlibInflate(byte[] compressed) throws IOException {
        try (InflaterInputStream zin = new InflaterInputStream(new ByteArrayInputStream(compressed))) {
            return zin.readAllBytes();
        }
    }

    public static ParsedObject parseInflated(byte[] raw) {
        int z = indexOfZero(raw);
        if (z < 0) {
            throw new IllegalArgumentException("invalid object: missing header separator");
        }
        byte[] header = new byte[z];
        System.arraycopy(raw, 0, header, 0, z);
        byte[] content = new byte[raw.length - z - 1];
        System.arraycopy(raw, z + 1, content, 0, content.length);

        String headerStr = new String(header, java.nio.charset.StandardCharsets.UTF_8);
        int sp = headerStr.indexOf(' ');
        if (sp < 0) {
            throw new IllegalArgumentException("invalid object header");
        }
        String type = headerStr.substring(0, sp);
        return new ParsedObject(type, content);
    }

    public static ParsedObject parseCompressed(byte[] compressed) throws IOException {
        return parseInflated(zlibInflate(compressed));
    }

    private static int indexOfZero(byte[] raw) {
        for (int i = 0; i < raw.length; i++) {
            if (raw[i] == 0) {
                return i;
            }
        }
        return -1;
    }

    public static String headerValue(String commitText, String key) {
        List<String> values = headerValues(commitText, key);
        return values.isEmpty() ? "" : values.get(0);
    }

    public static List<String> headerValues(String commitText, String key) {
        String prefix = key + " ";
        List<String> out = new ArrayList<>();
        for (String ln : commitText.split("\n", -1)) {
            if (ln.isBlank()) {
                break;
            }
            if (ln.startsWith(prefix)) {
                out.add(ln.substring(prefix.length()).trim());
            }
        }
        return out;
    }

    public static CommitData parseCommitContent(byte[] content) {
        String text = new String(content, java.nio.charset.StandardCharsets.UTF_8);
        String tree = headerValue(text, "tree");
        List<String> parents = headerValues(text, "parent");
        return new CommitData(tree, parents);
    }

    public record CommitData(String tree, List<String> parents) {}
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\TaskService.java`

```java
package com.final_project.versioncontrolservice.service;


import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import com.final_project.versioncontrolservice.dto.SubmissionResponse;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.*;
import com.final_project.versioncontrolservice.websocket.WebSocketEvents;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
@AllArgsConstructor
@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskCommentRepository commentRepository;
    private final SubmissionRepository submissionRepository;
    private final RepositoryService vicRepositoryService;
    private final MilestoneService milestoneService;
    private final WebSocketNotificationService notificationService;
    private final AuthService authService;
    /**
     * Create a new task (with optional milestone assignment)
     */
    public MilestoneService.TaskResponse createTask(String owner, String repo, TaskRequest request, String username) {

        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser == null) {
            throw new NotFoundException("User Not Found");
        }
        UserDTO repoUser = authService.getUserByUsername(username);
        if (repoUser == null) {
            throw new NotFoundException("Repo User Not Found");
        }



        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        int number = getNextTaskNumber(owner, repo);

        List<ContributorUser> contributorUser = meta.getCollaborators();

        Task task = Task.builder()
                .priority(request.getPriority())
                .status(TaskStatus.OPEN)
                .repoName(meta.getRepositoryName())
                .assignedAt(Instant.now())
                .number(number)
                .repoOwner(MilestoneTaskUser
                        .builder()
                        .email(ownerUser.getEmail())
                        .firstName(ownerUser.getFirstName())
                        .userId(ownerUser.getId())
                        .userName(ownerUser.getUsername())
                        .profile(ownerUser.getProfile())
                        .build())
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(repoUser.getUsername())
                .updatedAt(Instant.now())
                .labels(request.getLabels())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .maxScore(request.getMaxScore())
                .build();
        if (request.getRequirements() != null) {
            task.setRequirementsChecklist(
                    request.getRequirements()
                            .stream()
                            .map(req -> {
                                Task.RequirementCheck check = new Task.RequirementCheck();
                                check.setRequirement(req);
                                check.setCompleted(false);
                                return check;
                            })
                            .collect(Collectors.toList())
            );
        }
        if (request.getMilestoneNumber() != null) {
            Milestone milestone = milestoneRepository
                    .findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, request.getMilestoneNumber())
                    .orElseThrow(() -> new NotFoundException("milestone #" + request.getMilestoneNumber() + " not found"));
            task.setMilestoneId(milestone.getId());
            task.setMilestoneNumber(milestone.getNumber());
            milestoneService.updateMilestoneProgress(owner, repo, milestone.getId());
        }


        Task saved = taskRepository.save(task);

        // Send notification
//        sendTaskNotification(owner, repo, saved, "created", username);

        return MilestoneService.TaskResponse.fromDocument(saved);
    }

    /**
     * Assign task to a user
     */
    public MilestoneService.TaskResponse assignTask(String owner, String repo, int taskNumber,
                                   String assignee, String assignedBy) {
        UserDTO assigneeUser = authService.getUserByUsername(assignee);
        if (assigneeUser == null) {
            throw new NotFoundException("User Not Found");
        }

        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("Repo User Not Found");
        }

        UserDTO assignedByUser =  authService.getUserByUsername(assignedBy);
        if (assignedByUser == null) {
            throw new NotFoundException("User Not Found");
        }

        Task task = getTask(owner, repo, taskNumber);
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        task.setAssignedTo(
                MilestoneTaskUser.builder()
                        .email(assigneeUser.getEmail())
                        .firstName(assigneeUser.getFirstName())
                        .userId(assigneeUser.getId())
                        .userName(assigneeUser.getUsername())
                        .profile(assigneeUser.getProfile())
                        .build()
        );

        task.setAssignedAt(Instant.now());
        task.setStatus(TaskStatus.PROGRESS);
        task.setUpdatedAt(Instant.now());
        Task updated = taskRepository.save(task);

        // Update milestone if task belongs to one
        if (task.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, task.getMilestoneId());
        }

        // Send notification to assignee
        notificationService.sendUserNotification(assignee,
                WebSocketEvents.NotificationEvent.builder()
                        .type("task_assigned")
                        .title("New Task Assigned")
                        .message("You've been assigned to task #" + taskNumber + ": " + task.getTitle())
                        .url("/repos/" + owner + "/" + repo + "/tasks/" + taskNumber)
                        .createdAt(Instant.now())
                        .build()
        );

        return MilestoneService.TaskResponse.fromDocument(updated);
    }

    /**
     * Submit work for a task
     */
    public SubmissionResponse submitTask(String owner, String repo, int taskNumber,
                                         SubmissionRequest request, String username) {
        UserDTO user = authService.getUserByUsername(username);
        if (user == null) {
            throw new NotFoundException("User Not Found");
        }
        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("Repo User Not Found");
        }

        Task task = getTask(owner, repo, taskNumber);
        Submission submission = Submission
                .builder()
                .taskId(task.getId())
                .submittedBy(
                        MilestoneTaskUser
                                .builder()
                                .profile(user.getProfile())
                                .userName(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .userId(user.getId())
                                .build()
                )
                .submittedAt(Instant.now())
                .description(request.getDescription())
                .branchName(request.getBranchName())
                .commitHash(request.getCommitHash())
                .pullRequestUrl(request.getPullRequestUrl())
                .files(request.getFiles()).status("submitted")
                .revisionCount(0)
                        .build();
        // Update task status

        task.setStatus(TaskStatus.PROGRESS);
        task.setSubmissionUrl(request.getPullRequestUrl());
        task.setSubmissionBranch(request.getBranchName());
        task.setSubmissionCommit(request.getCommitHash());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        Submission saved = submissionRepository.save(submission);
        // Notify repo admins
        notifyAdminsAboutSubmission(owner, repo, task, username);
        return SubmissionResponse.from(saved);
    }

    /**
     * Review/grading a task submission
     */
    public MilestoneService.TaskResponse reviewTask(String owner, String repo, int taskNumber,
                                                    ReviewRequest request, String reviewer) {
        Task task = getTask(owner, repo, taskNumber);


        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (!RepoAccessRules.canAdmin(meta, reviewer)) {
            throw new ForbiddenException("only admins can review/grading tasks");
        }

        // Create review comment
        TaskComment comment = new TaskComment();
        comment.setTaskId(task.getId());
        comment.setRepoOwner(owner);
        comment.setRepoName(repo);
        comment.setAuthor(reviewer);
        comment.setBody(request.getFeedback());
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        comment.setReview(true);
        comment.setReviewScore(request.getScore());
        commentRepository.save(comment);

        // Update task
        task.setReviewedBy(reviewer);
        task.setReviewedAt(Instant.now());
        task.setReviewComments(request.getFeedback());
        task.setEarnedScore(request.getScore());

        if (request.isApproved()) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(Instant.now());
        } else {
            task.setStatus(TaskStatus.PROGRESS);  // Back to in_progress for revisions
        }

        task.setUpdatedAt(Instant.now());
        task.setCommentsCount((int) commentRepository.countByTaskId(task.getId()));

        Task updated = taskRepository.save(task);

        // Update milestone progress
        if (task.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, task.getMilestoneId());
        }

        // Notify student
        notificationService.sendUserNotification(task.getAssignedTo().getUserName(),
                WebSocketEvents.NotificationEvent.builder()
                        .type("task_reviewed")
                        .title("Task Reviewed")
                        .message("Task #" + taskNumber + " has been reviewed. Score: " + request.getScore())
                        .url("/repos/" + owner + "/" + repo + "/tasks/" + taskNumber)
                        .createdAt(Instant.now())
                        .build()
        );
        return MilestoneService.TaskResponse.fromDocument(updated);
    }

    /**
     * Get student dashboard with all assigned tasks
     */
    public StudentDashboard getStudentDashboard(String owner, String repo, String username) {
        List<Task> tasks = taskRepository
                .findByRepoOwner_UserNameAndRepoNameAndAssignedTo_UserName(owner, repo, username);
        long totalTasks = tasks.size();
        long completedTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.COMPLETED)).count();
        long inProgressTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.PROGRESS)).count();
        long inReviewTasks = tasks
                .stream().filter(t -> t.getStatus().equals(TaskStatus.REVIEW)).count();
        long openTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.OPEN)).count();
        // Calculate total score
        int totalEarnedScore = tasks.stream()
                .filter(t -> t.getEarnedScore() != null)
                .mapToInt(Task::getEarnedScore)
                .sum();
        int totalPossibleScore = tasks.stream()
                .filter(t -> t.getMaxScore() != null)
                .mapToInt(Task::getMaxScore)
                .sum();
        return StudentDashboard.builder()
                .username(username)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .inReviewTasks(inReviewTasks)
                .openTasks(openTasks)
                .totalEarnedScore(totalEarnedScore)
                .totalPossibleScore(totalPossibleScore)
                .scorePercentage(totalPossibleScore > 0 ?
                        (double) totalEarnedScore / totalPossibleScore * 100 : 0)
                .tasks(tasks.stream()
                        .map(MilestoneService.TaskResponse::fromDocument)
                        .collect(Collectors.toList()))
                .build();
    }

    private Task getTask(String owner, String repo, int number) {
        return taskRepository.findByRepoOwner_UserNameAndRepoNameAndNumberOrderByNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("task #" + number + " not found"));
    }

    private int getNextTaskNumber(String owner, String repo) {
        return taskRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .stream()
                .findFirst()
                .map(task -> task.getNumber() + 1)
                .orElse(1);
    }

    private void sendTaskNotification(String owner, String repo, Task task,
                                      String action, String username) {
        WebSocketEvents.RepositoryActivity activity = WebSocketEvents.RepositoryActivity.builder()
                .type("task_" + action)
                .description("Task #" + task.getNumber() + " " + action + ": " + task.getTitle())
                .actor(WebSocketEvents.UserInfo.builder().username(username).build())
                .timestamp(Instant.now())
                .metadata(Map.of(
                        "task_number", task.getNumber(),
                        "task_id", task.getId()
                ))
                .build();

        notificationService.broadcastActivity(owner, repo, activity);
    }

    private void notifyAdminsAboutSubmission(String owner, String repo,
                                             Task task, String submitter) {
        // Get repo admins and notify them
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);

        // Notify owner
        notificationService.sendUserNotification(meta.getOwner().getUsername(),
                WebSocketEvents.NotificationEvent.builder()
                        .type("new_submission")
                        .title("New Submission")
                        .message("Task #" + task.getNumber() + " submitted by " + submitter)
                        .url("/repos/" + owner + "/" + repo + "/tasks/" + task.getNumber())
                        .createdAt(Instant.now())
                        .build()
        );
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class TaskRequest {
        private String title;
        private String description;
        private Integer milestoneNumber;
        private TaskPriority priority;
        private List<Label> labels;
        private Instant dueDate;
        private Integer estimatedHours;
        private Integer maxScore;
        private List<String> requirements;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class SubmissionRequest {
        private String description;
        private String branchName;
        private String commitHash;
        private String pullRequestUrl;
        private List<String> files;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class ReviewRequest {
        private String feedback;
        private Integer score;
        private boolean approved;
        private List<String> checkedRequirements;
    }

    @Data
    @Builder
    public static class StudentDashboard {
        private String username;
        private long totalTasks;
        private long completedTasks;
        private long inProgressTasks;
        private long inReviewTasks;
        private long openTasks;
        private int totalEarnedScore;
        private int totalPossibleScore;
        private double scorePercentage;
        private List<MilestoneService.TaskResponse> tasks;
    }



}

```

## `src/main\java\com\final_project\versioncontrolservice\service\RepositoryService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.ContributorStatus;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import com.final_project.versioncontrolservice.repo.InvitationRepository;
import com.final_project.versioncontrolservice.repo.RepositoryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class RepositoryService {
    private final RepositoryRepository repositoryRepository;
    private final MinioStorageService minio;
    private final AuthService authService;
    private final InvitationRepository invitationRepository;
    private final RepositoryFileIndexService fileIndex;
    public RepositoryDocument loadMeta(String userName, String repo) {
        return repositoryRepository
            .findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(userName.trim(), repo.trim())
            .orElseThrow(() -> new NotFoundException("read repo metadata"));
    }

    public List<RepositoryResponse> searchRepositories(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        List<RepositoryDocument> results =  repositoryRepository.searchRepositories(keyword.trim());
        return results.stream().map(saved -> RepositoryResponse
                .builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .branchHeads(saved.getBranchHeads())
                .repositoryName(saved.getRepositoryName())
                .cloneUrl(saved.getCloneUrl())
                .collaborators(saved.getCollaborators())
                .description(saved.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(saved.getOwner().getId())
                                .email(saved.getOwner().getEmail())
                                .emailVerified(saved.getOwner().getEmailVerified())
                                .username(saved.getOwner().getUsername())
                                .status(saved.getOwner().getStatus())
                                .build()
                )
                .build()).toList();
    }
    public RepositoryResponse createRepo(CreateRepositoryRequest request) {
        UserDTO user = authService.getUserByUsername(request.getUserName());
        if (user == null) {
            throw new NotFoundException("User not found");
        }
        if (repositoryRepository.existsByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(user.getUsername(), request.getRepositoryName().trim())) {
            throw new BadRequestException("repo already exists");
        }
       RepositoryDocument repo =  RepositoryDocument
                .builder()
                .repositoryName(request.getRepositoryName())
                .cloneUrl("http://localhost:8000/api/v1/repo/..")
                .description(request.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .emailVerified(user.getEmailVerified())
                                .username(user.getUsername())
                                .status(user.getStatus())
                                .build()
                )
                .visibility(request.getVisibility())
                .symbolicHead("refs/heads/main")
                .branchHeads(Map.of("main", ""))
                                                                .build();
       RepositoryDocument saved = repositoryRepository.save(repo);


        minio.ensureBuckets();
        minio.writeLayoutHead(saved.getOwner().getUsername(), saved.getRepositoryName());
        minio.writeLayoutBranchRef(saved.getOwner().getUsername(), saved.getRepositoryName(), "main", "");

        return RepositoryResponse
                .builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .branchHeads(saved.getBranchHeads())
                .repositoryName(saved.getRepositoryName())
                .cloneUrl(saved.getCloneUrl())
                .collaborators(saved.getCollaborators())
                .description(saved.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(saved.getOwner().getId())
                                .email(saved.getOwner().getEmail())
                                .emailVerified(saved.getOwner().getEmailVerified())
                                .username(saved.getOwner().getUsername())
                                .status(saved.getOwner().getStatus())
                                .build()
                )
                .build()
                ;
    }

    public Map<String, Object> listRefs(RepositoryDocument meta) {
        Map<String, String> refs = new LinkedHashMap<>();
        for (var e : meta.getBranchHeads().entrySet()) {
            refs.put("refs/heads/" + e.getKey(), e.getValue() == null ? "" : e.getValue().trim());
        }
        return Map.of("HEAD", meta.getSymbolicHead(), "refs", refs);
    }

    public byte[] readObjectRaw(RepositoryDocument meta, String hash) {
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        try {
            return minio.getObjectBytes(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim());
        } catch (MinioStorageService.StorageException e) {
            throw new NotFoundException("object not found");
        }
    }

    public void writeObject(RepositoryDocument meta, String hash, byte[] data) {
        if (data == null || data.length == 0) {
            throw new BadRequestException("empty object body");
        }
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        minio.ensureBuckets();
        minio.putObjectIfAbsent(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim(), data);
    }

    public void updateBranchRef(RepositoryDocument meta, String branch, String hash) throws IOException {
        branch = branch.trim();
        if (branch.isEmpty()) {
            throw new BadRequestException("owner, repo, branch and hash are required");
        }
        for (char c : branch.toCharArray()) {
            if ("\\/:*?\"<>|".indexOf(c) >= 0) {
                throw new BadRequestException("invalid branch name");
            }
        }
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        if (!minio.objectExists(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim())) {
            throw new BadRequestException("object does not exist on server");
        }
        meta.getBranchHeads().put(branch, hash.trim());
        repositoryRepository.save(meta);
        minio.writeLayoutBranchRef(meta.getOwner().getUsername(), meta.getRepositoryName(), branch, hash.trim());
        fileIndex.rebuildIndex(meta, branch, hash.trim());
    }

//    public String listBranchHash(RepositoryDocument meta, String branch) {
//        String h = meta.getBranchHeads().get(branch.trim());
//        if (h == null) {
//            return "";
//        }
//        return h.trim();
//    }
    public String listBranchHash(RepositoryDocument meta, String branch) {

        if (meta == null) {
            throw new NotFoundException("Repository not found");
        }

        if (branch == null || branch.trim().isEmpty()) {
            throw new BadRequestException("Branch is required");
        }

        String branchName = branch.trim();

        if (meta.getBranchHeads() == null || !meta.getBranchHeads().containsKey(branchName)) {
            throw new BadRequestException("Branch does not exist: " + branchName);
        }

        String hash = meta.getBranchHeads().get(branchName);

        if (hash == null || hash.trim().isEmpty()) {
            throw new BadRequestException("Branch has no commits yet: " + branchName);
        }

        return hash.trim();
    }

    @Transactional
    public void addCollaborator(String owner, String repo, ContributorRequest request) {
        RepositoryDocument meta = loadMeta(owner, repo);
        ContributorUser contributorUser = authService.getContributorUser(request.getId());
        if (contributorUser == null){
            throw new BadRequestException("There is No such User");
        }

        if (meta.getCollaborators() == null) {
            meta.setCollaborators(new java.util.ArrayList<>());
        }
        if (meta.getCollaborators().stream()
                .anyMatch(col ->
                        col.getId().
                                equals(contributorUser.getId()))

        ) {
            throw new BadRequestException("User Already Contribute to this repository");
        }
        contributorUser.setContributorStatus(ContributorStatus.ACCEPTED);
        meta.getCollaborators().add(contributorUser);
        repositoryRepository.save(meta);
    }

    public RepositoryDTO getRepositoryById(String id){
        RepositoryDocument repo = repositoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("The Repository doesn't exist"));
        return RepositoryDTO
                .builder()
                .owner(repo.getOwner().getUsername())
                .visibility(repo.getVisibility())
                .collaborators(repo.getCollaborators())
                .description(repo.getDescription())
                .repositoryName(repo.getRepositoryName())
                .cloneUrl(repo.getCloneUrl())
                .build();
    }

    public RepositoryDTO repositoryByOwnerAndRepoName(String ownerName, String repositoryName){

        RepositoryDocument repo = repositoryRepository.findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(ownerName, repositoryName)
                .orElseThrow(() -> new NotFoundException("with this detail, there is no such user"));
        return RepositoryDTO
                .builder()
                .owner(repo.getOwner().getUsername())
                .repositoryName(repo.getRepositoryName())
                .cloneUrl(repo.getCloneUrl())
                .visibility(repo.getVisibility())
                .build();
    }

    public RepositoryDTO removeBlockUserFromRepository(String ownerId, String gustUser, String repositoryName){
        ContributorUser owner = authService.getContributorUser(ownerId);
        if (owner == null){
            throw new NotFoundException("The Usr owner not found");
        }

        RepositoryDocument repo = repositoryRepository.findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(owner.getUsername(),repositoryName)
                .orElseThrow(() -> new NotFoundException("There is no such repo"));
        List<ContributorUser> currentContributor =  repo.getCollaborators().stream().filter((cont) -> !cont.getId().equals(gustUser)).toList();
        repo.setCollaborators(currentContributor);
        RepositoryDocument saved =  repositoryRepository.save(repo);
        removeInvitation(owner.getUsername(), gustUser,repositoryName);
        return RepositoryDTO
                .builder()
                .owner(saved.getOwner().getUsername())
                .cloneUrl(saved.getCloneUrl())
                .visibility(saved.getVisibility())
                .repositoryName(saved.getRepositoryName())
                .id(saved.getId())
                .collaborators(saved.getCollaborators())
                .description(saved.getDescription())
                .build();
    }
    public void removeInvitation(String owner, String guestUser, String repo){

        Invitation invitation =  invitationRepository.findByHostUser_UsernameIgnoreCaseAndRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(owner,guestUser,repo)
                .orElseThrow(() -> new NotFoundException("Not Found"));
        invitationRepository.delete(invitation);
    }

    public  List<RepositoryResponse> getOwnerRepos(String ownerId) {
       ContributorUser contributorUser =  authService.getContributorUser(ownerId);
        List<RepositoryDocument> repos = repositoryRepository.findAllByOwner_Username(contributorUser.getUsername());
        return repos.stream().map(rep ->  RepositoryResponse
                .builder()
                .id(rep.getId())
                .createdAt(rep.getCreatedAt())
                .updatedAt(rep.getUpdatedAt())
                .branchHeads(rep.getBranchHeads())
                .repositoryName(rep.getRepositoryName())
                .cloneUrl(rep.getCloneUrl())
                .collaborators(rep.getCollaborators())
                .description(rep.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(rep.getOwner().getId())
                                .email(rep.getOwner().getEmail())
                                .emailVerified(rep.getOwner().getEmailVerified())
                                .username(rep.getOwner().getUsername())
                                .status(rep.getOwner().getStatus())
                                .build()
                )
                .build()).collect(Collectors.toList());
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\RepositoryFileIndexService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import com.final_project.versioncontrolservice.repo.RepositoryFileIndexRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
@AllArgsConstructor
public class RepositoryFileIndexService {

    private final RepositoryFileIndexRepository fileIndexRepository;
    private final MinioStorageService minioStorageService;

    public void rebuildIndex(RepositoryDocument repo, String branch, String commitHash) throws IOException {
        fileIndexRepository.deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                branch
        );

        byte[] commitData = minioStorageService.getObjectBytes(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                commitHash
        );

        VicObjectFormat.ParsedObject commitObj =
                VicObjectFormat.parseCompressed(commitData);

        VicObjectFormat.CommitData commit =
                VicObjectFormat.parseCommitContent(commitObj.content());

        walkTree(repo, branch, commitHash, commit.tree(), "");
    }

    private void walkTree(
            RepositoryDocument repo,
            String branch,
            String commitHash,
            String treeHash,
            String currentPath
    ) throws IOException {
        byte[] treeData = minioStorageService.getObjectBytes(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                treeHash
        );

        VicObjectFormat.ParsedObject treeObj =
                VicObjectFormat.parseCompressed(treeData);

        String treeText = new String(treeObj.content(), StandardCharsets.UTF_8);

        for (String line : treeText.split("\n")) {
            if (line.isBlank()) continue;

            String[] parts = line.split("\t");
            if (parts.length < 4) continue;

            String mode = parts[0];
            String type = parts[1];
            String hash = parts[2];
            String name = parts[3];

            String path = currentPath.isEmpty() ? name : currentPath + "/" + name;

            if ("tree".equals(type)) {
                walkTree(repo, branch, commitHash, hash, path);
            }

            if ("blob".equals(type)) {
                byte[] blobData = minioStorageService.getObjectBytes(
                        repo.getOwner().getUsername(),
                        repo.getRepositoryName(),
                        hash
                );

                VicObjectFormat.ParsedObject blobObj =
                        VicObjectFormat.parseCompressed(blobData);

                RepositoryFileIndex index = RepositoryFileIndex.builder()
                        .repositoryId(repo.getId())
                        .ownerUsername(repo.getOwner().getUsername())
                        .repositoryName(repo.getRepositoryName())
                        .branch(branch)
                        .path(path)
                        .fileName(name)
                        .blobHash(hash)
                        .commitHash(commitHash)
                        .size((long) blobObj.content().length)
                        .language(detectLanguage(name))
                        .deleted(false)
                        .indexedAt(Instant.now())
                        .build();

                fileIndexRepository.save(index);
            }
        }
    }

    private String detectLanguage(String fileName) {
        if (fileName.endsWith(".java")) return "java";
        if (fileName.endsWith(".go")) return "go";
        if (fileName.endsWith(".js")) return "javascript";
        if (fileName.endsWith(".ts")) return "typescript";
        if (fileName.endsWith(".json")) return "json";
        if (fileName.endsWith(".md")) return "markdown";
        return "text";
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\RepoAccessRules.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.model.Collaborator;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import org.springframework.util.StringUtils;

public final class RepoAccessRules {

    private RepoAccessRules() {}

    public static boolean canRead(RepositoryDocument meta, String usernameOrEmpty) {
        if ("public".equalsIgnoreCase(StringUtils.trimWhitespace(meta.getVisibility().toString()))) {
            return true;
        }
        String u = norm(usernameOrEmpty);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getFirstName().equalsIgnoreCase(u)) {
            return true;
        }
        String role = collaboratorRole(meta, u);
        return "read".equals(role) || "write".equals(role) || "admin".equals(role);
    }

    public static boolean canWrite(RepositoryDocument meta, String username) {
        String u = norm(username);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        String role = collaboratorRole(meta, u);
        return "write".equals(role) || "admin".equals(role);
    }

    public static boolean canAdmin(RepositoryDocument meta, String username) {
        String u = norm(username);
        if (u.isEmpty()) {
            return false;
        }
        if (meta.getOwner() != null && meta.getOwner().getUsername().equalsIgnoreCase(u)) {
            return true;
        }
        return "admin".equals(collaboratorRole(meta, u));
    }

    private static String collaboratorRole(RepositoryDocument meta, String usernameLower) {
        if (meta.getCollaborators() == null) {
            return "";
        }
        for (ContributorUser c : meta.getCollaborators()) {
//            if (c.getUsername() != null && c.getUsername().trim().equalsIgnoreCase(usernameLower)) {
//                return c.getRole() == null ? "" : c.getRole().trim().toLowerCase();
//            }
        }
        return "";
    }

    private static String norm(String u) {
        return u == null ? "" : u.trim().toLowerCase();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\PullRequestMergeService.java`

```java
package com.final_project.versioncontrolservice.service;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;

@Service
@AllArgsConstructor
public class PullRequestMergeService {

    private final MinioStorageService minio;

    public MergeAnalysis analyze(
            String owner,
            String repo,
            String baseHash,
            String targetHash,
            String sourceHash
    ) {
        CommitInfo baseCommit = readCommit(owner, repo, baseHash);
        CommitInfo targetCommit = readCommit(owner, repo, targetHash);
        CommitInfo sourceCommit = readCommit(owner, repo, sourceHash);

        Map<String, TreeEntry> baseTree = readTreeRecursive(owner, repo, baseCommit.getTreeHash());
        Map<String, TreeEntry> targetTree = readTreeRecursive(owner, repo, targetCommit.getTreeHash());
        Map<String, TreeEntry> sourceTree = readTreeRecursive(owner, repo, sourceCommit.getTreeHash());

        Map<String, TreeEntry> merged = new TreeMap<>();
        List<ConflictFile> conflicts = new ArrayList<>();

        Set<String> allPaths = new TreeSet<>();
        allPaths.addAll(baseTree.keySet());
        allPaths.addAll(targetTree.keySet());
        allPaths.addAll(sourceTree.keySet());

        for (String path : allPaths) {
            TreeEntry base = baseTree.get(path);
            TreeEntry target = targetTree.get(path);
            TreeEntry source = sourceTree.get(path);

            String baseBlob = hashOf(base);
            String targetBlob = hashOf(target);
            String sourceBlob = hashOf(source);

            // Same result on both branches
            if (Objects.equals(targetBlob, sourceBlob)) {
                if (source != null) {
                    merged.put(path, source);
                }
                continue;
            }

            // Target did not change, source changed
            if (Objects.equals(targetBlob, baseBlob)) {
                if (source != null) {
                    merged.put(path, source);
                }
                continue;
            }

            // Source did not change, target changed
            if (Objects.equals(sourceBlob, baseBlob)) {
                if (target != null) {
                    merged.put(path, target);
                }
                continue;
            }

            // Both changed differently
            conflicts.add(ConflictFile.builder()
                    .path(path)
                    .baseHash(baseBlob)
                    .targetHash(targetBlob)
                    .sourceHash(sourceBlob)
                    .baseContent(readBlobAsStringOrEmpty(owner, repo, baseBlob))
                    .targetContent(readBlobAsStringOrEmpty(owner, repo, targetBlob))
                    .sourceContent(readBlobAsStringOrEmpty(owner, repo, sourceBlob))
                    .build());
        }

        if (!conflicts.isEmpty()) {
            return MergeAnalysis.builder()
                    .hasConflicts(true)
                    .conflicts(conflicts)
                    .mergedEntries(merged)
                    .build();
        }

        String mergedTreeHash = writeTree(owner, repo, merged);

        return MergeAnalysis.builder()
                .hasConflicts(false)
                .conflicts(List.of())
                .mergedEntries(merged)
                .mergedTreeHash(mergedTreeHash)
                .build();
    }

    public String createMergeCommit(
            String owner,
            String repo,
            String mergedTreeHash,
            String targetParentHash,
            String sourceParentHash,
            String message,
            String authorUsername
    ) {
        String author = authorUsername == null || authorUsername.isBlank()
                ? "system"
                : authorUsername.trim();

        long timestamp = Instant.now().getEpochSecond();

        StringBuilder content = new StringBuilder();
        content.append("tree ").append(mergedTreeHash).append("\n");
        content.append("parent ").append(targetParentHash).append("\n");
        content.append("parent ").append(sourceParentHash).append("\n");
        content.append("author ").append(author).append(" <").append(author).append("@vic.local> ")
                .append(timestamp).append(" +0000\n");
        content.append("committer ").append(author).append(" <").append(author).append("@vic.local> ")
                .append(timestamp).append(" +0000\n");
        content.append("\n");
        content.append(message == null || message.isBlank() ? "Merge pull request" : message.trim());
        content.append("\n");

        return writeObject(owner, repo, "commit", content.toString().getBytes(StandardCharsets.UTF_8));
    }

    public String writeMergedTreeFromResolvedFiles(
            String owner,
            String repo,
            Map<String, TreeEntry> cleanMergedEntries,
            Map<String, String> resolvedContentByPath
    ) {
        Map<String, TreeEntry> finalEntries = new TreeMap<>(cleanMergedEntries);

        for (Map.Entry<String, String> resolved : resolvedContentByPath.entrySet()) {
            String path = normalizePath(resolved.getKey());
            String content = resolved.getValue() == null ? "" : resolved.getValue();

            String blobHash = writeObject(
                    owner,
                    repo,
                    "blob",
                    content.getBytes(StandardCharsets.UTF_8)
            );

            finalEntries.put(path, TreeEntry.builder()
                    .path(path)
                    .name(leafName(path))
                    .mode("100644")
                    .type("blob")
                    .hash(blobHash)
                    .build());
        }

        return writeTree(owner, repo, finalEntries);
    }

    private CommitInfo readCommit(String owner, String repo, String commitHash) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"commit".equals(obj.type())) {
                throw new BadRequestException("Object is not a commit: " + commitHash);
            }

            VicObjectFormat.CommitData data = VicObjectFormat.parseCommitContent(obj.content());

            return CommitInfo.builder()
                    .hash(commitHash)
                    .treeHash(data.tree())
                    .parents(data.parents())
                    .build();

        } catch (Exception e) {
            throw new BadRequestException("Cannot read commit " + commitHash + ": " + e.getMessage());
        }
    }

    private Map<String, TreeEntry> readTreeRecursive(String owner, String repo, String treeHash) {
        Map<String, TreeEntry> result = new TreeMap<>();
        readTreeRecursive(owner, repo, treeHash, "", result);
        return result;
    }

    private void readTreeRecursive(
            String owner,
            String repo,
            String treeHash,
            String prefix,
            Map<String, TreeEntry> result
    ) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"tree".equals(obj.type())) {
                throw new BadRequestException("Object is not a tree: " + treeHash);
            }

            String content = new String(obj.content(), StandardCharsets.UTF_8);

            if (content.isBlank()) {
                return;
            }

            for (String line : content.split("\n")) {
                if (line == null || line.isBlank()) {
                    continue;
                }

                String[] parts = line.split("\t", 4);
                if (parts.length != 4) {
                    throw new BadRequestException("Invalid tree line: " + line);
                }

                String mode = parts[0];
                String type = parts[1];
                String hash = parts[2];
                String name = parts[3];

                String fullPath = prefix.isBlank() ? name : prefix + "/" + name;

                if ("tree".equals(type)) {
                    readTreeRecursive(owner, repo, hash, fullPath, result);
                } else if ("blob".equals(type)) {
                    result.put(fullPath, TreeEntry.builder()
                            .path(fullPath)
                            .name(name)
                            .mode(mode)
                            .type(type)
                            .hash(hash)
                            .build());
                }
            }

        } catch (Exception e) {
            throw new BadRequestException("Cannot read tree " + treeHash + ": " + e.getMessage());
        }
    }

    private String writeTree(String owner, String repo, Map<String, TreeEntry> flatEntries) {
        TreeNode root = new TreeNode();

        for (Map.Entry<String, TreeEntry> entry : flatEntries.entrySet()) {
            String path = normalizePath(entry.getKey());
            TreeEntry treeEntry = entry.getValue();

            if (treeEntry == null || treeEntry.getHash() == null || treeEntry.getHash().isBlank()) {
                continue;
            }

            root.insert(path.split("/"), treeEntry.getMode(), treeEntry.getHash());
        }

        return root.write(owner, repo);
    }

    private String writeObject(String owner, String repo, String type, byte[] content) {
        try {
            String header = type + " " + content.length + "\0";
            byte[] headerBytes = header.getBytes(StandardCharsets.UTF_8);

            byte[] full = new byte[headerBytes.length + content.length];
            System.arraycopy(headerBytes, 0, full, 0, headerBytes.length);
            System.arraycopy(content, 0, full, headerBytes.length, content.length);

            String hash = sha1Hex(full);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            try (DeflaterOutputStream dos = new DeflaterOutputStream(baos, new Deflater())) {
                dos.write(full);
            }

            minio.putObjectIfAbsent(owner, repo, hash, baos.toByteArray());

            return hash;

        } catch (Exception e) {
            throw new BadRequestException("Cannot write " + type + " object: " + e.getMessage());
        }
    }

    private String readBlobAsStringOrEmpty(String owner, String repo, String blobHash) {
        if (blobHash == null || blobHash.isBlank()) {
            return "";
        }

        try {
            byte[] raw = minio.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"blob".equals(obj.type())) {
                return "";
            }

            return new String(obj.content(), StandardCharsets.UTF_8);

        } catch (Exception e) {
            return "";
        }
    }

    private String hashOf(TreeEntry entry) {
        return entry == null ? null : entry.getHash();
    }

    private String normalizePath(String path) {
        return path == null ? "" : path.trim().replace("\\", "/");
    }

    private String leafName(String path) {
        String normalized = normalizePath(path);
        int idx = normalized.lastIndexOf('/');
        return idx < 0 ? normalized : normalized.substring(idx + 1);
    }

    private String sha1Hex(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hash = digest.digest(data);

        StringBuilder sb = new StringBuilder();

        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }

        return sb.toString();
    }

    @Data
    @Builder
    public static class MergeAnalysis {
        private boolean hasConflicts;
        private List<ConflictFile> conflicts;
        private Map<String, TreeEntry> mergedEntries;
        private String mergedTreeHash;
    }

    @Data
    @Builder
    public static class ConflictFile {
        private String path;

        private String baseHash;
        private String targetHash;
        private String sourceHash;

        private String baseContent;
        private String targetContent;
        private String sourceContent;
    }

    @Data
    @Builder
    public static class CommitInfo {
        private String hash;
        private String treeHash;
        private List<String> parents;
    }

    @Data
    @Builder
    public static class TreeEntry {
        private String path;
        private String name;
        private String mode;
        private String type;
        private String hash;
    }

    private class TreeNode {
        private String mode;
        private String blobHash;
        private final Map<String, TreeNode> children = new TreeMap<>();

        void insert(String[] parts, String mode, String hash) {
            if (parts.length == 0) {
                return;
            }

            if (parts.length == 1) {
                TreeNode leaf = new TreeNode();
                leaf.mode = mode == null || mode.isBlank() ? "100644" : mode;
                leaf.blobHash = hash;
                children.put(parts[0], leaf);
                return;
            }

            TreeNode child = children.computeIfAbsent(parts[0], key -> new TreeNode());
            child.insert(Arrays.copyOfRange(parts, 1, parts.length), mode, hash);
        }

        String write(String owner, String repo) {
            if (blobHash != null && !blobHash.isBlank()) {
                return blobHash;
            }

            List<String> lines = new ArrayList<>();

            for (Map.Entry<String, TreeNode> entry : children.entrySet()) {
                String name = entry.getKey();
                TreeNode child = entry.getValue();

                String mode;
                String type;
                String hash;

                if (child.blobHash != null && !child.blobHash.isBlank()) {
                    mode = child.mode == null || child.mode.isBlank() ? "100644" : child.mode;
                    type = "blob";
                    hash = child.blobHash;
                } else {
                    mode = "040000";
                    type = "tree";
                    hash = child.write(owner, repo);
                }

                lines.add(mode + "\t" + type + "\t" + hash + "\t" + name);
            }

            String content = String.join("\n", lines);

            return writeObject(owner, repo, "tree", content.getBytes(StandardCharsets.UTF_8));
        }
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\PullRequestApplicationService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.PullRequestConflictRepository;
import com.final_project.versioncontrolservice.repo.PullRequestRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PullRequestApplicationService {
    private final PullRequestMergeService pullRequestMergeService;
    private final PullRequestConflictRepository pullRequestConflictRepository;

    private final PullRequestRepository pullRequestRepository;
    private final CommitGraphService commitGraphService;
    private final RepositoryService repositoryService;
    private final AuthService authService;
    private final KafkaProducer kafkaProducer;
    public PullRequestResponse create(
            String owner,
            String repo,
            CreatePullRequest request
    ) {
        ContributorUser authorContributor =  authService.getContributorUser(request.getAuthor());
        if (authorContributor == null) {
            throw new NotFoundException("Contributor Not Found");
        }
        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("User Not Found");
        }

        RepositoryDocument currentDocument = repositoryService.loadMeta(owner, repo);
        if (currentDocument == null) {
            throw new NotFoundException("The Current Repository does not exist");
        }

        String headSource = repositoryService.listBranchHash(currentDocument, request.getSourceBranch());
        if (headSource.isEmpty()) {
            throw new BadRequestException("source branch \"" + request.getSourceBranch() + "\" does not exist");
        }

        String headTarget = repositoryService.listBranchHash(currentDocument, request.getTargetBranch());
        if (headTarget.isEmpty()) {
            throw new BadRequestException("target branch \"" + request.getTargetBranch()  + "\" does not exist");
        }

       PullRequest pullRequest = PullRequest
               .builder()
               .repoName(repo)
               .sourceBranch(request.getSourceBranch())
               .sourceHash(headSource)
               .targetBranch(request.getTargetBranch())
               .targetHash(headTarget)
               .status(PullRequestStatus.OPENED)
               .author(
                       PullRequestUser
                               .builder()
                               .email(authorContributor.getEmail())
                               .firstName(authorContributor.getFirstName())
                               .username(authorContributor.getUsername())
                               .id(authorContributor.getId())
                               .profile(authorContributor.getProfile())
                               .build()
               )

               .createdAt(Instant.now())
               .description(request.getDescription())
               .title(request.getTitle())
               .repoOwner(
                       PullRequestUser
                               .builder()
                               .email(repoOwner.getEmail())
                               .firstName(repoOwner.getFirstName())
                               .username(repoOwner.getUsername())
                               .id(repoOwner.getId())
                               .profile(repoOwner.getProfile())
                               .build()
               )
               .build();
        PullRequest saved = pullRequestRepository.save(pullRequest);
        publishPullRequestOpenedEvent(saved, currentDocument);
        return PullRequestResponse.from(saved);
    }

    public List<PullRequestResponse> list(String owner, String repo) {

        RepositoryDocument document = repositoryService.loadMeta(owner, repo);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }
        List<PullRequest> list =  pullRequestRepository
                .findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(document.getOwner().getUsername(), document.getRepositoryName());

        return list
                .stream()
                .map(PullRequestResponse::from).collect(Collectors.toList());
    }

    public PullRequestResponse find(String id, String owner, String repo) {
        RepositoryDocument document = repositoryService.loadMeta(owner, repo);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }

        PullRequest result =  pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(id, document.getOwner().getUsername(), document.getRepositoryName())
                .orElseThrow(() -> new NotFoundException("pull request not found"));
        return PullRequestResponse.from(result);
    }



    public MergeResponse merge(String pullId, String owner, String repoName) throws IOException {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }
        PullRequest pullRequest = pullRequestRepository.findById(pullId)
                .orElseThrow(() -> new NotFoundException("Pull Request not found"));

        if (!pullRequest.getStatus().equals(PullRequestStatus.OPENED)){
            throw new  BadRequestException("Pull Request Status Not Opened");
        }

        String sourceHash = repositoryService.listBranchHash(document, pullRequest.getSourceBranch());

        if (sourceHash.isEmpty()) {
            throw new BadRequestException("source branch does not exist");
        }

        String targetHash = repositoryService.listBranchHash(document, pullRequest.getTargetBranch());

        if (targetHash.isEmpty()) {
            throw new BadRequestException("target branch does not exist");
        }

        if (sourceHash.equals(targetHash)) {
            markMerged(pullRequest.getId());

            return MergeResponse.builder()
                    .mergedAt(Instant.now())
                    .pullRequestId(pullRequest.getId())
                    .status(PullRequestStatus.MERGED)
                    .targetBranch(pullRequest.getTargetBranch())
                    .sourceBranch(pullRequest.getSourceBranch())
                    .newHead(targetHash)
                    .message("Already up to date")
                    .build();
        }

        boolean canFf;

        try {
            canFf = commitGraphService.isAncestorInRepo(
                    document.getOwner().getUsername(),
                    document.getRepositoryName(),
                    targetHash,
                    sourceHash
            );
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }

        if (canFf) {
            RepositoryDocument mergedRepository = repositoryService.loadMeta(
                    document.getOwner().getUsername(),
                    document.getRepositoryName()
            );

            repositoryService.updateBranchRef(
                    mergedRepository,
                    pullRequest.getTargetBranch(),
                    sourceHash
            );

            markMerged(pullRequest.getId());

            return MergeResponse.builder()
                    .mergedAt(Instant.now())
                    .pullRequestId(pullRequest.getId())
                    .status(PullRequestStatus.MERGED)
                    .targetBranch(pullRequest.getTargetBranch())
                    .sourceBranch(pullRequest.getSourceBranch())
                    .newHead(sourceHash)
                    .message("Fast-forward merge")
                    .build();
        }

        //  NON FAST-FORWARD → REAL MERGE
        String baseHash = commitGraphService.findCommonAncestor(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                targetHash,
                sourceHash
        );

        PullRequestMergeService.MergeAnalysis analysis =
                pullRequestMergeService.analyze(
                        document.getOwner().getUsername(),
                        document.getRepositoryName(),
                        baseHash,
                        targetHash,
                        sourceHash
                );

        //  IF CONFLICT → STORE IN DB
        if (analysis.isHasConflicts()) {

            pullRequestConflictRepository.deleteByPullRequestId(pullRequest.getId());

            var conflict = com.final_project.versioncontrolservice.model.PullRequestConflict.builder()
                    .pullRequestId(pullRequest.getId())
                    .owner(document.getOwner().getUsername())
                    .repoName(document.getRepositoryName())
                    .sourceBranch(pullRequest.getSourceBranch())
                    .targetBranch(pullRequest.getTargetBranch())
                    .baseHash(baseHash)
                    .sourceHash(sourceHash)
                    .targetHash(targetHash)
                    .files(
                            analysis.getConflicts().stream()
                                    .map(c -> com.final_project.versioncontrolservice.model.PullRequestConflict.ConflictFile.builder()
                                            .path(c.getPath())
                                            .baseHash(c.getBaseHash())
                                            .sourceHash(c.getSourceHash())
                                            .targetHash(c.getTargetHash())
                                            .baseContent(c.getBaseContent())
                                            .sourceContent(c.getSourceContent())
                                            .targetContent(c.getTargetContent())
                                            .resolved(false)
                                            .build()
                                    )
                                    .toList()
                    )
                    .resolved(false)
                    .createdAt(Instant.now())
                    .build();

            pullRequestConflictRepository.save(conflict);

            pullRequest.setStatus(PullRequestStatus.CONFLICTING);
            PullRequest saved =  pullRequestRepository.save(pullRequest);

            publishPullRequestMergedEvent(saved, document);
            throw new BadRequestException("Merge conflict detected. Resolve conflicts first.");
        }

        //  NO CONFLICT → CREATE MERGE COMMIT
        String mergeCommitHash = pullRequestMergeService.createMergeCommit(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                analysis.getMergedTreeHash(),
                targetHash,
                sourceHash,
                "Merge branch '" + pullRequest.getSourceBranch() +
                        "' into '" + pullRequest.getTargetBranch() + "'",
                pullRequest.getAuthor().getUsername()
        );

        // UPDATE BRANCH
        RepositoryDocument mergedRepository = repositoryService.loadMeta(
                document.getOwner().getUsername(),
                document.getRepositoryName()
        );

        repositoryService.updateBranchRef(
                mergedRepository,
                pullRequest.getTargetBranch(),
                mergeCommitHash
        );

        markMerged(pullRequest.getId());

        return MergeResponse.builder()
                .mergedAt(Instant.now())
                .pullRequestId(pullRequest.getId())
                .status(PullRequestStatus.MERGED)
                .targetBranch(pullRequest.getTargetBranch())
                .sourceBranch(pullRequest.getSourceBranch())
                .newHead(mergeCommitHash)
                .message("Merged successfully")
                .build();
    }

    public MergeConflictResponse getConflicts(String pullId, String owner, String repoName) {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullId,
                        document.getOwner().getUsername(),
                        document.getRepositoryName()
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        PullRequestConflict conflict = pullRequestConflictRepository
                .findByPullRequestIdAndResolvedFalse(pullRequest.getId())
                .orElseThrow(() -> new NotFoundException("No active conflicts found for this pull request"));

        return MergeConflictResponse.builder()
                .pullRequestId(pullRequest.getId())
                .status(pullRequest.getStatus().name())
                .conflicts(
                        conflict.getFiles()
                                .stream()
                                .map(file -> {
                                    boolean isBinary =
                                            isBinaryContent(file.getBaseContent()) ||
                                                    isBinaryContent(file.getSourceContent()) ||
                                                    isBinaryContent(file.getTargetContent());

                                    return MergeConflictResponse.ConflictFileDTO.builder()
                                            .path(file.getPath())
                                            .binary(isBinary)
                                            .baseContent(isBinary ? null : file.getBaseContent())
                                            .sourceContent(isBinary ? null : file.getSourceContent())
                                            .targetContent(isBinary ? null : file.getTargetContent())
                                            .build();
                                })
                                .toList()
                )
                .build();
    }
    public MergeResponse resolveConflicts(
            String pullId,
            String owner,
            String repoName,
            ResolveConflictRequest request
    ) throws IOException {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullId,
                        document.getOwner().getUsername(),
                        document.getRepositoryName()
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        PullRequestConflict conflict = pullRequestConflictRepository
                .findByPullRequestIdAndResolvedFalse(pullRequest.getId())
                .orElseThrow(() -> new NotFoundException("No active conflicts found for this pull request"));

        Map<String, ResolveConflictRequest.FileResolution> resolutions =
                request.getFiles()
                        .stream()
                        .collect(Collectors.toMap(
                                ResolveConflictRequest.FileResolution::getPath,
                                Function.identity()
                        ));

        Map<String, String> resolvedContentByPath = new java.util.HashMap<>();

        for (PullRequestConflict.ConflictFile file : conflict.getFiles()) {
            ResolveConflictRequest.FileResolution resolution = resolutions.get(file.getPath());

            if (resolution == null) {
                throw new BadRequestException("Missing resolution for file: " + file.getPath());
            }

            String selectedContent;

            switch (resolution.getResolution()) {
                case SOURCE -> selectedContent = file.getSourceContent();

                case TARGET -> selectedContent = file.getTargetContent();

                case BOTH -> selectedContent =
                        file.getTargetContent() + System.lineSeparator() + file.getSourceContent();

                case CUSTOM -> {
                    if (resolution.getCustomContent() == null) {
                        throw new BadRequestException("Custom content is required for file: " + file.getPath());
                    }
                    selectedContent = resolution.getCustomContent();
                }

                default -> throw new BadRequestException(
                        "Invalid resolution for file " + file.getPath() +
                                ". Use SOURCE, TARGET, BOTH, or CUSTOM"
                );
            }

            file.setResolvedContent(selectedContent);
            file.setResolution(resolution.getResolution());
            file.setResolved(true);

            resolvedContentByPath.put(file.getPath(), selectedContent);
        }

        String mergedTreeHash = pullRequestMergeService.writeMergedTreeFromResolvedFiles(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                new java.util.TreeMap<>(),
                resolvedContentByPath
        );

        String mergeCommitHash = pullRequestMergeService.createMergeCommit(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                mergedTreeHash,
                conflict.getTargetHash(),
                conflict.getSourceHash(),
                "Merge branch '" + pullRequest.getSourceBranch() +
                        "' into '" + pullRequest.getTargetBranch() + "'",
                pullRequest.getAuthor().getUsername()
        );

        repositoryService.updateBranchRef(
                document,
                pullRequest.getTargetBranch(),
                mergeCommitHash
        );

        conflict.setResolved(true);
        conflict.setResolvedAt(Instant.now());
        pullRequestConflictRepository.save(conflict);

        pullRequest.setStatus(PullRequestStatus.MERGED);
        pullRequest.setMergedAt(Instant.now());
        pullRequestRepository.save(pullRequest);

        return MergeResponse.builder()
                .mergedAt(pullRequest.getMergedAt())
                .pullRequestId(pullRequest.getId())
                .status(PullRequestStatus.MERGED)
                .targetBranch(pullRequest.getTargetBranch())
                .sourceBranch(pullRequest.getSourceBranch())
                .newHead(mergeCommitHash)
                .message("Conflicts resolved and pull request merged")
                .build();
    }
    private void markMerged(String  id) {
        PullRequest pr = pullRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("pull request not found"));
        pr.setStatus(PullRequestStatus.MERGED);
        pr.setMergedAt(Instant.now());
        pullRequestRepository.save(pr);
    }

    private boolean isBinaryContent(String content) {
        if (content == null || content.isEmpty()) return false;

        return content.contains("\u0000") || !content.chars().allMatch(c -> c >= 32 || c == '\n' || c == '\r' || c == '\t');
    }


    private void publishPullRequestOpenedEvent(
            PullRequest pullRequest,
            RepositoryDocument repository
    ) {
        RepositoryOperationEvent event = RepositoryOperationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.PULL_REQUEST_OPENED)

                .repositoryId(repository.getId())
                .repositoryName(repository.getRepositoryName())
                .repositoryUrl("/api/v1/repos/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName()+"/"+pullRequest.getId())

                .actorUserId(pullRequest.getAuthor().getId())
                .actorName(pullRequest.getAuthor().getUsername())
                .actorEmail(pullRequest.getAuthor().getEmail())

                .ownerUserId(pullRequest.getRepoOwner().getId())
                .ownerName(pullRequest.getRepoOwner().getUsername())
                .ownerEmail(pullRequest.getRepoOwner().getEmail())

                .sourceBranch(pullRequest.getSourceBranch())
                .targetBranch(pullRequest.getTargetBranch())
                .pullRequestId(pullRequest.getId())
                .pullRequestTitle(pullRequest.getTitle())
                .pullRequestUrl("/api/v1/repos/" + repository.getOwner().getUsername()
                        + "/" + repository.getRepositoryName()
                        + "/pulls/" + pullRequest.getId())
                .recipients(
                        repository
                                .getCollaborators()
                                .stream()
                                .map((repo -> RepositoryMemberRecipient.builder()
                                            .userId(repo.getId())
                                            .name(repo.getUsername())
                                            .email(repo.getEmail())
                                            .role(repo.getRole()).build()
                                )).toList()
                )
                .occurredAt(LocalDateTime.now())
                .metadata(Map.of(
                        "actionUrl", "/api/v1/repos" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName()+"/"+pullRequest.getId(),
                        "displayType", "PULL_REQUEST_OPENED",
                        "description", pullRequest.getDescription() == null ? "" : pullRequest.getDescription(),
                        "message", pullRequest.getAuthor().getUsername()
                                + " opened a pull request: "
                                + pullRequest.getTitle()
                ))
                .build();

        kafkaProducer.produce(event);
    }

    private void publishPullRequestMergedEvent(
            PullRequest pullRequest,
            RepositoryDocument repository
    ) {
        RepositoryOperationEvent event = RepositoryOperationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.PULL_REQUEST_MERGED)

                .repositoryId(repository.getId())
                .repositoryName(repository.getRepositoryName())
                .repositoryUrl("/api/v1/repos/"+repository.getOwner().getUsername()+"/"+repository.getRepositoryName()+"/contents/?ref=main+")
                .actorUserId(pullRequest.getAuthor().getId())
                .actorName(pullRequest.getAuthor().getUsername())
                .actorEmail(pullRequest.getAuthor().getEmail())

                .ownerUserId(pullRequest.getRepoOwner().getId())
                .ownerName(pullRequest.getRepoOwner().getUsername())
                .ownerEmail(pullRequest.getRepoOwner().getEmail())

                .sourceBranch(pullRequest.getSourceBranch())
                .targetBranch(pullRequest.getTargetBranch())

                .pullRequestId(pullRequest.getId())
                .pullRequestTitle(pullRequest.getTitle())
                .pullRequestUrl("/api/v1/repos/"+repository.getOwner().getUsername()+"/"+repository.getRepositoryName()+"/pulls/"+pullRequest.getId())
                .recipients(
                        repository
                                .getCollaborators()
                                .stream()
                                .map((repo -> RepositoryMemberRecipient.builder()
                                            .userId(repo.getId())
                                            .name(repo.getUsername())
                                            .email(repo.getEmail())
                                            .role(repo.getRole()).build()
                                )).toList()
                )
                .occurredAt(LocalDateTime.now())
                .metadata(Map.of(
                        "actionUrl", "/api/v1/repos/"+repository.getOwner().getUsername()+"/"+repository.getRepositoryName()+"/pulls/"+pullRequest.getId(),
                        "displayType", "PULL_REQUEST_MERGED",
                        "message", pullRequest.getAuthor().getUsername()
                                + " merged pull request: "
                                + pullRequest.getTitle()
                ))
                .build();

        kafkaProducer.produce(event);
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\ObjectHash.java`

```java
package com.final_project.versioncontrolservice.service;

public final class ObjectHash {
    private ObjectHash() {}

    public static boolean isValidSha1Hex(String hash) {
        if (hash == null || hash.length() != 40) {
            return false;
        }
        for (int i = 0; i < 40; i++) {
            char c = hash.charAt(i);
            if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) {
                return false;
            }
        }
        return true;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\MinioStorageService.java`

```java
package com.final_project.versioncontrolservice.service;

import io.minio.*;
import io.minio.errors.ErrorResponseException;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
public class MinioStorageService {

    private final MinioClient minioClient;
    private final String objectsBucket;
    private final String layoutBucket;

    public MinioStorageService(
            MinioClient minioClient,
            @Value("${storage.minio.bucket-objects}") String objectsBucket,
            @Value("${storage.minio.bucket-layout}") String layoutBucket
    ) {
        this.minioClient = minioClient;
        this.objectsBucket = objectsBucket;
        this.layoutBucket = layoutBucket;
    }

    public void ensureBuckets() {
        ensureBucket(objectsBucket);
        ensureBucket(layoutBucket);
    }

    public String objectsBucket() {
        return objectsBucket;
    }

    public String layoutBucket() {
        return layoutBucket;
    }

    public String objectKey(String owner, String repo, String hash) {
        return owner + "/" + repo + "/objects/" + hash.substring(0, 2) + "/" + hash.substring(2);
    }

    private static String layoutKey(String owner, String repo, String relativePath) {
        return owner + "/" + repo + "/.vic/" + relativePath;
    }

    public void writeLayoutHead(String owner, String repo) {
        byte[] data = "ref: refs/heads/main\n".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        put(layoutBucket, layoutKey(owner, repo, "HEAD"), data, "text/plain; charset=utf-8");
    }

    public void writeLayoutBranchRef(String owner, String repo, String branch, String hash) {
        String content = (hash == null || hash.isEmpty()) ? "" : hash + "\n";
        put(layoutBucket, layoutKey(owner, repo, "refs/heads/" + branch),
                content.getBytes(java.nio.charset.StandardCharsets.UTF_8), "text/plain; charset=utf-8");
    }

    public boolean objectExists(String owner, String repo, String hash) {
        return exists(objectsBucket, objectKey(owner, repo, hash));
    }

    public byte[] getObjectBytes(String owner, String repo, String hash) {
        return get(objectsBucket, objectKey(owner, repo, hash));
    }

    public void putObjectIfAbsent(String owner, String repo, String hash, byte[] data) {
        String key = objectKey(owner, repo, hash);
        if (exists(objectsBucket, key)) {
            return;
        }
        put(objectsBucket, key, data, "application/octet-stream");
    }

    private void put(String bucket, String key, byte[] data, String contentType) {
        try {
            ensureBucket(bucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .stream(new ByteArrayInputStream(data), data.length, -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception e) {
            throw new StorageException("put failed: " + key, e);
        }
    }

    private byte[] get(String bucket, String key) {
        try (InputStream in = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(key).build())) {
            return in.readAllBytes();
        } catch (Exception e) {
            throw new StorageException("get failed: " + key, e);
        }
    }

    private boolean exists(String bucket, String key) {
        try {
            minioClient.statObject(StatObjectArgs.builder().bucket(bucket).object(key).build());
            return true;
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            throw new StorageException("stat failed: " + key, e);
        } catch (Exception e) {
            throw new StorageException("stat failed: " + key, e);
        }
    }

    private void ensureBucket(String bucket) {
        try {
            boolean ok = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!ok) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new StorageException("bucket: " + bucket, e);
        }
    }

    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\MilestoneService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.MilestoneRepository;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MilestoneService {

    private final AuthService authService;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final RepositoryService vicRepositoryService;
    private final KafkaProducer kafkaProducer;
    /**
     * Create a new milestone
     */
    public MilestoneResponse createMilestone(String owner, String repo,
                                             MilestoneRequest request, String username) {
        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser == null) {
            throw new NotFoundException("There is not such uers");
        }
        UserDTO creatorUser = authService.getUserByUsername(username);
        if  (creatorUser == null) {
            throw new NotFoundException("User not found");
        }
        // Validate permissions

        RepositoryDocument meta = vicRepositoryService.loadMeta(ownerUser.getUsername(), repo);


        // Generate milestone number
        int number = getNextMilestoneNumber(owner, repo);

        Milestone milestone = Milestone.builder()
                .repoOwner(MilestoneTaskUser
                        .builder()
                        .userId(ownerUser.getId())
                        .email(ownerUser.getEmail())
                        .profile(ownerUser.getProfile())
                        .firstName(ownerUser.getFirstName())
                        .userName(ownerUser.getUsername())
                        .build())
                .repoName(repo)
                .number(number)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(username)
                .status("open")


                // Academic fields
                .maxScore(request.getMaxScore())
                .passingScore(request.getPassingScore())
                .rubric(request.getRubric())
                .requiredTasks(request.getRequiredTasks())
                .completionPercentage(0.0)

                // Optional: initialize stats explicitly (good practice)
                .totalTasks(0)
                .openTasks(0)
                .completedTasks(0)
                .inProgressTasks(0)

                .build();
       Milestone saved =  milestoneRepository.save(milestone);

       return MilestoneResponse.fromDocument(saved);
    }

    /**
     * Update milestone progress based on task completion
     */
    public void updateMilestoneProgress(String owner, String repo, String  milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("milestone not found"));

        // Count tasks by status
        long totalTasks = taskRepository.countByMilestone(owner, repo, milestoneId);
        long completedTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.COMPLETED);
        long inProgressTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.PROGRESS);
        long openTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.OPEN);

        milestone.setTotalTasks((int) totalTasks);
        milestone.setCompletedTasks((int) completedTasks);
        milestone.setInProgressTasks((int) inProgressTasks);
        milestone.setOpenTasks((int) openTasks);

        // Calculate completion percentage
        if (totalTasks > 0) {
            double percentage = ((double) completedTasks / totalTasks) * 100.0;
            milestone.setCompletionPercentage(Math.round(percentage * 100.0) / 100.0);
        } else {
            milestone.setCompletionPercentage(0.0);
        }

        // Auto-close if all required tasks completed
        if (milestone.getRequiredTasks() != null && completedTasks >= milestone.getRequiredTasks()) {
            milestone.setStatus("closed");
            milestone.setClosedAt(Instant.now());
        }

        milestone.setUpdatedAt(Instant.now());
        milestoneRepository.save(milestone);
    }

    /**
     * Get milestones with detailed progress
     */
    public List<MilestoneResponse> getMilestones(String owner, String repo) {
        List<Milestone> milestones = milestoneRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo);

        return milestones.stream()
                .map(m -> {
                    MilestoneResponse response = MilestoneResponse.fromDocument(m);

                    // Get tasks for this milestone
                    List<Task> tasks = taskRepository
                            .findByRepoOwner_UserNameAndRepoNameAndMilestoneId(owner, repo, m.getId());
                    response.setTasks(tasks.stream()
                            .map(TaskResponse::fromDocument)
                            .collect(Collectors.toList()));

                    return response;
                })
                .collect(Collectors.toList());
    }

    public MilestoneResponse updateMilestone(
            String owner,
            String repo,
            int number,
            MilestoneRequest request
    ) {
        Milestone milestone = milestoneRepository
                .findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("milestone #" + number + " not found"));

        if (request.getTitle() != null) {
            milestone.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            milestone.setDescription(request.getDescription());
        }

        if (request.getDueDate() != null) {
            milestone.setDueDate(request.getDueDate());
        }

        if (request.getMaxScore() != null) {
            milestone.setMaxScore(request.getMaxScore());
        }

        if (request.getPassingScore() != null) {
            milestone.setPassingScore(request.getPassingScore());
        }

        if (request.getRubric() != null) {
            milestone.setRubric(request.getRubric());
        }

        if (request.getRequiredTasks() != null) {
            milestone.setRequiredTasks(request.getRequiredTasks());
        }

        milestone.setUpdatedAt(Instant.now());

        Milestone saved = milestoneRepository.save(milestone);
        return MilestoneResponse.fromDocument(saved);
    }
    /**
     * Get milestone by number
     */
    public Milestone getMilestone(String owner, String repo, int number) {
        return  milestoneRepository.findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("milestone #" + number + " not found"));

    }
    /**
     * Close a milestone
     */
    public MilestoneResponse closeMilestone(String owner, String repo, int number, String username) {
        Milestone milestone = getMilestone(owner, repo, number);
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (!RepoAccessRules.canAdmin(meta, username)) {
            throw new ForbiddenException("only repository admins can close milestones");
        }

        milestone.setStatus("closed");
        milestone.setClosedAt(Instant.now());
        milestone.setUpdatedAt(Instant.now());

        Milestone saved =  milestoneRepository.save(milestone);
        return MilestoneResponse.fromDocument(saved);
    }


    /**
     * Reopen a milestone
     */
    public MilestoneResponse reopenMilestone(String owner, String repo, int number, String username) {
        Milestone milestone = getMilestone(owner, repo, number);

        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (!RepoAccessRules.canAdmin(meta, username)) {
            throw new ForbiddenException("only repository admins can reopen milestones");
        }

        milestone.setStatus("open");
        milestone.setClosedAt(null);
        milestone.setUpdatedAt(Instant.now());

        Milestone result =  milestoneRepository.save(milestone);
        return MilestoneResponse.fromDocument(result);
    }

    private int getNextMilestoneNumber(String owner, String repo) {
        return milestoneRepository.findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .map(m -> m.getNumber() + 1)
                .orElse(1);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MilestoneRequest {
        private String title;
        private String description;
        private Instant dueDate;
        private Integer maxScore;
        private Integer passingScore;
        private String rubric;
        private Integer requiredTasks;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MilestoneResponse {
        private String id;
        private int number;
        private String title;
        private String description;
        private Instant dueDate;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant closedAt;
        private String createdBy;
        private String status;
        private Integer maxScore;
        private Integer passingScore;
        private String rubric;
        private Integer requiredTasks;
        private Double completionPercentage;
        private Integer totalTasks;
        private Integer openTasks;
        private Integer completedTasks;
        private Integer inProgressTasks;
        private List<TaskResponse> tasks;

        public static MilestoneResponse fromDocument(Milestone doc) {
            MilestoneResponse response = new MilestoneResponse();
            response.setId(doc.getId());
            response.setNumber(doc.getNumber());
            response.setTitle(doc.getTitle());
            response.setDescription(doc.getDescription());
            response.setDueDate(doc.getDueDate());
            response.setCreatedAt(doc.getCreatedAt());
            response.setUpdatedAt(doc.getUpdatedAt());
            response.setClosedAt(doc.getClosedAt());
            response.setCreatedBy(doc.getCreatedBy());
            response.setStatus(doc.getStatus());
            response.setMaxScore(doc.getMaxScore());
            response.setPassingScore(doc.getPassingScore());
            response.setRubric(doc.getRubric());
            response.setRequiredTasks(doc.getRequiredTasks());
            response.setCompletionPercentage(doc.getCompletionPercentage());
            response.setTotalTasks(doc.getTotalTasks());
            response.setOpenTasks(doc.getOpenTasks());
            response.setCompletedTasks(doc.getCompletedTasks());
            response.setInProgressTasks(doc.getInProgressTasks());
            return response;
        }

    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TaskResponse {
        private String id;
        private int number;
        private String title;
        private String description;
        private MilestoneTaskUser assignedTo;
        private String status;
        private String priority;
        private List<String> labels;
        private Instant dueDate;
        private Integer maxScore;
        private Integer earnedScore;
        private Integer milestoneNumber;
        private Instant completedAt;
        private String reviewedBy;
        private String reviewComments;
        private String submissionUrl;
        private String submissionBranch;
        private List<Task.RequirementCheck> requirementsChecklist;
        private Integer commentsCount;

        public static TaskResponse fromDocument(Task doc) {
            TaskResponse response = new TaskResponse();
            response.setId(doc.getId());
            response.setNumber(doc.getNumber());
            response.setTitle(doc.getTitle());
            response.setDescription(doc.getDescription());
            response.setAssignedTo(doc.getAssignedTo());
            response.setStatus(doc.getStatus().getStatus());
            response.setPriority(doc.getPriority().value());
            response.setLabels(doc.getLabels().stream().map(String::valueOf).collect(Collectors.toList()));
            response.setDueDate(doc.getDueDate());
            response.setMaxScore(doc.getMaxScore());
            response.setEarnedScore(doc.getEarnedScore());
            response.setMilestoneNumber(doc.getMilestoneNumber());
            response.setCompletedAt(doc.getCompletedAt());
            response.setReviewedBy(doc.getReviewedBy());
            response.setReviewComments(doc.getReviewComments());
            response.setSubmissionUrl(doc.getSubmissionUrl());
            response.setSubmissionBranch(doc.getSubmissionBranch());
            response.setRequirementsChecklist(doc.getRequirementsChecklist());
            response.setCommentsCount(doc.getCommentsCount());
            return response;
        }


    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\InvitationApplicationService.java`

```java
package com.final_project.versioncontrolservice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.repo.InvitationRepository;

import lombok.AllArgsConstructor;

@Slf4j
@Service
@AllArgsConstructor
public class InvitationApplicationService {
    private final InvitationRepository invitationRepository;
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final KafkaProducer kafkaProducer;
    public InvitationResponse create(InvitationRequest request) {

        ContributorUser guest = authService.getContributorUser(request.getGuest());
        if (guest == null){
            throw new NotFoundException("The Guest User Not Found");
        }
        ContributorUser host = authService.getContributorUser(request.getHost());
        if (host == null){
            throw new NotFoundException("The Host user Not Found");
        }

        RepositoryDTO repo = repositoryService.repositoryByOwnerAndRepoName(host.getUsername(), request.getRepository());
        long pending = invitationRepository
                .countByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCaseAndGuestUser_IdAndStatus(
                repo.getOwner(), repo.getRepositoryName(), guest.getId(), InvitationStatus.PENDING);

        if (pending > 0 ) {

            throw new BadRequestException("pending invitation already exists");
        }

        Invitation invitation = Invitation
                .builder()
                .repository(
                        RepositoryMetadata
                                .builder()
                                .description(repo.getDescription())
                                .type(repo.getVisibility())
                                .userName(repo.getOwner())
                                .repositoryName(repo.getRepositoryName())
                                .build()
                )
                .status(InvitationStatus.PENDING)
                .guestUser(UserDTO.builder()
                        .email(guest.getEmail())
                        .status(guest.getStatus())
                        .username(guest.getUsername())
                        .id(guest.getId())
                        .profile(guest.getProfile())
                        .firstName(guest.getFirstName())
                        .lastName(guest.getLastName())
                        .roles(guest.getRoles())
                        .build())
                .hostUser(UserDTO
                        .builder()
                        .username(host.getUsername())
                        .id(host.getId())
                        .email(host.getEmail())
                        .status(host.getStatus())
                        .lastName(host.getLastName())
                        .firstName(host.getFirstName())
                        .roles(host.getRoles())
                        .profile(host.getProfile())
                        .build())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
       Invitation saved =  invitationRepository.save(invitation);
       kafkaProducer.produce(RepositoryOperationEvent
               .builder()
                       .eventId(UUID.randomUUID().toString())
                       .eventType(RepositoryEventType.REPOSITORY_INVITATION_SENT)
                       .actorEmail(host.getEmail())
                       .actorName(host.getUsername())
                       .actorUserId(host.getId())

                       .invitedUserEmail(guest.getEmail())
                       .invitedUserId(guest.getId())
                       .metadata(Map.of(
                               "operationBy", host.getUsername(),
                               "message", host.getUsername() + " invited to join " + invitation.getRepository().getRepositoryName()
                       ))
                       .invitedUserName(host.getUsername())
                       .ownerUserId(repo.getOwner())
                       .repositoryId(repo.getId())
                       .occurredAt(LocalDateTime.now())
                       .repositoryName(repo.getRepositoryName())
               .build());
        return InvitationResponse.from(saved);
    }



    public List<InvitationResponse> listPendingForUser(String userId) {
        ContributorUser user = authService.getContributorUser(userId);
        List<Invitation> pendingInvitation =  invitationRepository.findByGuestUser_IdAndStatus(user.getId(), InvitationStatus.PENDING);
        if (pendingInvitation.isEmpty()){
            return List.of();
        }
        return pendingInvitation
                .stream()
                .map(InvitationResponse::from).toList();
    }

    public InvitationResponse findById(String id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("The Invitation With this not found"));
        return InvitationResponse.from(invitation);
    }


    public InvitationResponse accept(String invitationId, String userId) {

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found"));

        log.info(invitation.getStatus().name());
        if (!invitation.getGuestUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot accept this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending");
        }

        if (invitation.getExpiresAt() != null &&
                invitation.getExpiresAt().isBefore(LocalDateTime.now())) {

            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);

            throw new BadRequestException("Invitation has expired");
        }

        repositoryService.addCollaborator(
                invitation.getRepository().getUserName(),
                invitation.getRepository().getRepositoryName(),
                ContributorRequest
                        .builder()
                        .email(invitation.getGuestUser().getEmail())
                        .username(invitation.getGuestUser().getUsername())
                        .id(invitation.getGuestUser().getId())
                        .build()
        );
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
        kafkaProducer.produce(RepositoryOperationEvent
                .builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(RepositoryEventType.REPOSITORY_INVITATION_ACCEPTED)
                        .actorEmail(invitation.getGuestUser().getEmail())
                        .actorName(invitation.getGuestUser().getUsername())
                        .actorUserId(invitation.getGuestUser().getId())

                        .metadata(Map.of(
                                "operationBy", invitation.getHostUser().getUsername(),
                                "message", invitation.getGuestUser().getUsername() + " accepted the invitation to join " + invitation.getRepository().getRepositoryName()
                        ))
                        .ownerUserId(invitation.getHostUser().getId())
                        .ownerEmail(invitation.getHostUser().getEmail())
                        .ownerUserId(invitation.getHostUser().getUsername())

                .build());
        return InvitationResponse.from(invitation);
    }

    public InvitationResponse reject(String invitationId, String userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found"));

        if (!invitation.getGuestUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot reject this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending");
        }

        kafkaProducer.produce(RepositoryOperationEvent
                .builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.REPOSITORY_INVITATION_DECLINED)
                .actorEmail(invitation.getGuestUser().getEmail())
                .actorName(invitation.getGuestUser().getUsername())
                .actorUserId(invitation.getGuestUser().getId())

                .metadata(Map.of(
                        "operationby", invitation.getHostUser().getUsername(),
                        "message", invitation.getGuestUser().getUsername() + " rejected the invitation to join " + invitation.getRepository().getRepositoryName()
                ))
                .ownerUserId(invitation.getHostUser().getId())
                .ownerEmail(invitation.getHostUser().getEmail())
                .ownerUserId(invitation.getHostUser().getUsername())

                .build());
        invitation.setStatus(InvitationStatus.REJECTED);
        Invitation saved =  invitationRepository.save(invitation);
        return InvitationResponse.from(saved);
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\FileViewService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.controller.FileViewController;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class FileViewService {
    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;
    private final CommitGraphService commitGraphService;

//    public FileViewController.FileContentResponse getFileContent(){}
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\ContributionService.java`

```java
package com.final_project.versioncontrolservice.service;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ContributionService {
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final PullRequestRepository prRepository;
    public ContributionStats getContributionStats(String owner, String repository, String  user) {

        ContributorUser contributorUser =  authService.getContributorUser(user);
        if (contributorUser==null){
            throw new NotFoundException("User not found");
        }

        UserDTO currentOwner = authService.getUserByUsername(owner);
        if (currentOwner==null){
            throw new  NotFoundException("User not found");
        }

        RepositoryDocument repo = repositoryService.loadMeta(currentOwner.getUsername(), repository);
        if (repo==null){
            throw new   NotFoundException("Repository not found");
        }

        List<PullRequest> mergedPRs = prRepository.findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(owner, repo.getRepositoryName())
                .stream()
                .filter(req -> req.getStatus().equals(PullRequestStatus.MERGED))
                .toList();

        Map<String, ContributorInfo> contributors = new HashMap<>();

        AtomicInteger totalCommits = new AtomicInteger();
        AtomicInteger totalAdditions = new AtomicInteger();
        AtomicInteger totalDeletions = new AtomicInteger();

        for (PullRequest pullRequest : mergedPRs) {
            String author =  pullRequest.getAuthor().getUsername();
            ContributorInfo info = contributors.getOrDefault(author, new ContributorInfo(author));
            info.addPR();
            info.addCommit();

            info.addAdditions(10); // Placeholder
            info.addDeletions(5);  // Placeholder
            totalCommits.getAndIncrement();
            totalAdditions.addAndGet(10);
            totalDeletions.addAndGet(5);
            contributors.put(author, info);

        }
        // Calculate percentages
        for (ContributorInfo info : contributors.values()) {
            info.calculatePercentages(totalAdditions.get(), totalDeletions.get());
        }


        List<ContributorInfo> sortedContributors = contributors
                .values()
                .stream()
                .sorted((a, b) -> Integer.compare(b.getTotalPRs(), a.getTotalPRs()))
                .collect(Collectors.toList());

        return new ContributionStats(
                sortedContributors,
                totalCommits.get(),
                totalAdditions.get(),
                totalDeletions.get(),
                mergedPRs.size()
        );
    }

    /**
     * Get contribution graph data (like GitHub's contribution heatmap)
     */
    public ContributionGraph getContributionGraph(String owner, String repo, String username) {

        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser==null){
            throw new  NotFoundException("User not found");
        }
        UserDTO repoUser = authService.getUserByUsername(username);
        if (repoUser==null){
            throw new NotFoundException("User not found");
        }

        RepositoryDocument repositoryDocument = repositoryService.loadMeta(ownerUser.getUsername(), repo);
        if (repositoryDocument==null){
            throw new  NotFoundException("Repository not found");
        }


        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(1);

        List<PullRequest> userPRs = prRepository
                .findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(owner, repo)
                .stream()
                .filter(pr -> pr.getAuthor().getUsername().equals(repoUser.getUsername()))
                .filter(pr -> pr.getCreatedAt() != null)
                .toList();

        Map<LocalDate, Integer> dailyContributions = new HashMap<>();
        for (PullRequest pr : userPRs) {

            LocalDate date = pr.getCreatedAt()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            dailyContributions.merge(date, 1, Integer::sum);

        }

        List<ContributionDay> days = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            int count = dailyContributions.getOrDefault(current, 0);
            days.add(new ContributionDay(current.toString(), count));
            current = current.plusDays(1);
        }
        return new ContributionGraph(repoUser.getUsername(), days);
    }

    /**
     * Get user activity feed
     */

    public List<ActivityEvent> getUserActivity(String username, int limit) {
        UserDTO currentUser = authService.getUserByUsername(username);
        if (currentUser==null){
            throw new NotFoundException("User not found");
        }

        List<ActivityEvent> events = new ArrayList<>();
        // Get user's PRs
        List<PullRequest> userPRs = prRepository.findAll()
                .stream()
                .filter(pr -> pr.getAuthor().getUsername().equals(currentUser.getUsername()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .toList();
        for (PullRequest pr : userPRs) {
            ActivityEvent event = new ActivityEvent(
                    pr.getId(),
                    EventType.PULL_REQUEST,
                    pr.getStatus().toString(),
                    pr.getTitle(),
                    pr.getRepoOwner() + "/" + pr.getRepoName(),
                    pr.getCreatedAt()
            );
            events.add(event);
        }

        return events;
    }


    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ContributionStats {
        private List<ContributorInfo> contributors;
        private int totalCommits;
        private int totalAdditions;
        private int totalDeletions;
        private int totalPRs;

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ContributorInfo {
        private String username;
        private int totalPRs;
        private int totalCommits;
        private int additions;
        private int deletions;
        private double additionPercentage;
        private double deletionPercentage;

        public void calculatePercentages(int totalAdditions, int totalDeletions) {
            this.additionPercentage = totalAdditions > 0 ?
                    (double) additions / totalAdditions * 100 : 0;
            this.deletionPercentage = totalDeletions > 0 ?
                    (double) deletions / totalDeletions * 100 : 0;
        }
        public ContributorInfo(String username){
            this.username = username;
        }
        public void addPR() { this.totalPRs++; }
        public void addCommit() { this.totalCommits++; }
        public void addAdditions(int count) { this.additions += count; }
        public void addDeletions(int count) { this.deletions += count; }

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ContributionGraph {
        private String username;
        private List<ContributionDay> contributions;
    }

    @Builder
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ContributionDay {
        private String date;
        private int count;
    }


    @AllArgsConstructor
    @Data
    @NoArgsConstructor
    @Builder
    public static class ActivityEvent {
        private String id;
        private EventType type;
        private String  action;
        private String title;
        private String repo;
        private Instant timestamp;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\CommitGraphService.java`

```java
package com.final_project.versioncontrolservice.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Set;

@Service
@AllArgsConstructor
public class CommitGraphService {
    private final MinioStorageService minio;

    public boolean isAncestorInRepo(String owner, String repo, String ancestor, String descendant) {
        if (ancestor == null || descendant == null || ancestor.isEmpty() || descendant.isEmpty()) {
            return false;
        }
        if (ancestor.equals(descendant)) {
            return true;
        }

        Set<String> seen = new HashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(descendant);

        while (!queue.isEmpty()) {
            String cur = queue.removeFirst();
            if (cur.isEmpty() || seen.contains(cur)) {
                continue;
            }
            seen.add(cur);
            if (cur.equals(ancestor)) {
                return true;
            }

            VicObjectFormat.ParsedObject obj;
            try {
                byte[] raw = minio.getObjectBytes(owner, repo, cur);
                obj = VicObjectFormat.parseCompressed(raw);
            } catch (Exception e) {
                throw new IllegalStateException("read commit " + cur + ": " + e.getMessage(), e);
            }
            if (!"commit".equals(obj.type())) {
                throw new IllegalStateException("object " + cur + " is not a commit");
            }
            VicObjectFormat.CommitData data = VicObjectFormat.parseCommitContent(obj.content());
            for (String p : data.parents()) {
                queue.addLast(p);
            }
        }
        return false;
    }

    public String findCommonAncestor(String owner, String repo, String first, String second) {
        Set<String> firstAncestors = collectAncestors(owner, repo, first);

        ArrayDeque<String> queue = new ArrayDeque<>();
        Set<String> seen = new HashSet<>();
        queue.add(second);

        while (!queue.isEmpty()) {
            String current = queue.removeFirst();

            if (current == null || current.isBlank() || seen.contains(current)) {
                continue;
            }

            seen.add(current);

            if (firstAncestors.contains(current)) {
                return current;
            }

            VicObjectFormat.CommitData data = readCommit(owner, repo, current);
            queue.addAll(data.parents());
        }

        throw new IllegalStateException("No common ancestor found");
    }

    private Set<String> collectAncestors(String owner, String repo, String start) {
        Set<String> result = new HashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(start);

        while (!queue.isEmpty()) {
            String current = queue.removeFirst();

            if (current == null || current.isBlank() || result.contains(current)) {
                continue;
            }

            result.add(current);

            VicObjectFormat.CommitData data = readCommit(owner, repo, current);
            queue.addAll(data.parents());
        }

        return result;
    }

    private VicObjectFormat.CommitData readCommit(String owner, String repo, String hash) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, hash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"commit".equals(obj.type())) {
                throw new IllegalStateException("object is not commit: " + hash);
            }

            return VicObjectFormat.parseCommitContent(obj.content());
        } catch (Exception e) {
            throw new IllegalStateException("read commit failed: " + hash, e);
        }
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\service\AuthService.java`

```java
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.*;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private final WebClient authServiceClient;

    public AuthService(WebClient authServiceClient) {
        this.authServiceClient = authServiceClient;
    }
    public AuthResponse signup(SignupRequest request) {
        return authServiceClient.post()
                .uri("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                ).bodyToMono(AuthResponse.class)
                .block();
    }
    public AuthResponse login(LoginRequest request) {
        return authServiceClient
                .post()
                .uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                ).bodyToMono(AuthResponse.class)
                .block();

    }

    public ContributorUser getContributorUser(String userId) {
        return authServiceClient
                .get()
                .uri("/api/v1/users/contributor/{id}", userId)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(ContributorUser.class)
                .block();
    }

    public AuthResponse refresh(RefreshTokenRequest refresh) {
        return authServiceClient
                .post()
                .uri("/api/v1/auth/refresh-token")
                .bodyValue(refresh)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(AuthResponse.class)
                .block();
    }

    public UserDTO getUserByUsername(String username) {
        return authServiceClient
                .get()
                .uri("/api/v1/users//by-username/{username}", username)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(UserDTO.class)
                .block();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\TaskRepository.java`

```java
package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.model.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String repoOwner,
            String repoName
    );

    Optional<Task> findByRepoOwner_UserNameAndRepoNameAndNumberOrderByNumber(
            String repoOwner,
            String repoName,
            Integer number
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndMilestoneId(
            String repoOwner,
            String repoName,
            String milestoneId
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndAssignedTo_UserName(
            String repoOwner,
            String repoName,
            String assignedTo
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndStatus(
            String repoOwner,
            String repoName,
            TaskStatus status
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndAssignedTo_UserNameAndStatus(
            String repoOwner,
            String repoName,
            String assignedTo,
            TaskStatus status
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'milestone_id': ?2}", count = true)
    long countByMilestone(
            String repoOwner,
            String repoName,
            String milestoneId
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'milestone_id': ?2, 'status': ?3}", count = true)
    long countByMilestoneAndStatus(
            String repoOwner,
            String repoName,
            String milestoneId,
            TaskStatus status
    );

    Optional<Task> findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String repoOwner,
            String repoName
    );

    @Query("{'repo_owner.username': ?0, 'repo_name': ?1, '$text': {'$search': ?2}}")
    List<Task> searchTasks(
            String repoOwner,
            String repoName,
            String searchTerm
    );
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\TaskCommentRepository.java`

```java
package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.TaskComment;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends MongoRepository<TaskComment, String > {
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(String  taskId);
    long countByTaskId(String  taskId);

    
}

```

## `src/main\java\com\final_project\versioncontrolservice\repo\SubmissionRepository.java`

```java
package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.Submission;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, ObjectId> {

    List<Submission> findByTaskIdOrderBySubmittedAtDesc(ObjectId taskId);

    Optional<Submission> findTopByTaskIdAndSubmittedByOrderBySubmittedAtDesc(
            ObjectId taskId, String submittedBy);

    List<Submission> findBySubmittedByOrderBySubmittedAtDesc(String submittedBy);

    long countByTaskIdAndStatus(ObjectId taskId, String status);
}

```

## `src/main\java\com\final_project\versioncontrolservice\repo\RepositoryRepository.java`

```java
package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RepositoryRepository extends MongoRepository<RepositoryDocument, String> {

    Optional<RepositoryDocument> findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    boolean existsByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    // Search repositories by name
    List<RepositoryDocument> findByRepositoryNameContainingIgnoreCase(String keyword);

    // Search repositories owned by user
    List<RepositoryDocument> findByOwner_UsernameIgnoreCaseAndRepositoryNameContainingIgnoreCase(
            String username,
            String keyword
    );

    // Find repositories where user is collaborator
    List<RepositoryDocument> findByCollaborators_UsernameIgnoreCase(String username);

    // Find repositories where collaborator has specific role if your ContributorUser has role
    List<RepositoryDocument> findByCollaborators_UsernameIgnoreCaseAndCollaborators_Role(
            String username,
            String role
    );

    List<RepositoryDocument> findAllByOwner_Username(String username);
    // Delete repo by owner + name
    void deleteByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(
            String username,
            String repositoryName
    );

    // Count user's repositories
    long countByOwner_UsernameIgnoreCase(String username);

    // Count public/private repos
    long countByOwner_UsernameIgnoreCaseAndVisibility(
            String username,
            RepositoryVisibility visibility
    );
    @Query("{ '$or': [ " +
            "{ 'repositoryName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'owner.username': { $regex: ?0, $options: 'i' } }, " +
            "{ 'owner.email': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<RepositoryDocument> searchRepositories(String keyword);
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\RepositoryFileIndexRepository.java`

```java
package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RepositoryFileIndexRepository
        extends MongoRepository<RepositoryFileIndex, String> {

    List<RepositoryFileIndex>
    findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndDeletedFalse(
            String ownerUsername,
            String repositoryName,
            String branch
    );

    Optional<RepositoryFileIndex>
    findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndPathAndDeletedFalse(
            String ownerUsername,
            String repositoryName,
            String branch,
            String path
    );

    void deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
            String ownerUsername,
            String repositoryName,
            String branch
    );
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\PullRequestRepository.java`

```java
package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.dto.PullRequestUser;
import com.final_project.versioncontrolservice.model.PullRequest;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PullRequestRepository extends MongoRepository<PullRequest, String> {

    List<PullRequest> findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
            String repoOwnerUsername,
            String repoName
    );

    Optional<PullRequest> findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
            String id,
            String repoOwnerUsername,
            String repoName
    );
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\PullRequestConflictRepository.java`

```java
package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.PullRequestConflict;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PullRequestConflictRepository extends MongoRepository<PullRequestConflict, String> {

    Optional<PullRequestConflict> findByPullRequestIdAndResolvedFalse(String pullRequestId);

    void deleteByPullRequestId(String pullRequestId);
}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\MilestoneRepository.java`

```java
package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.Milestone;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends MongoRepository<Milestone, String> {
    List<Milestone> findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String username,
            String repoName
    );

    Optional<Milestone> findByRepoOwner_UserNameAndRepoNameAndNumber(
            String username,
            String repoName,
            Integer number
    );

    List<Milestone> findByRepoOwner_UserNameAndRepoNameAndStatus(
            String username,
            String repoName,
            String status
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1}", count = true)
    long countByRepo(String username, String repoName);

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'status': 'open'}", count = true)
    long countOpenByRepo(String username, String repoName);

    Optional<Milestone> findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String username,
            String repoName
    );

}
```

## `src/main\java\com\final_project\versioncontrolservice\repo\InvitationRepository.java`

```java
package com.final_project.versioncontrolservice.repo;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.InvitationStatus;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends MongoRepository<Invitation, String> {

    long countByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCaseAndGuestUser_IdAndStatus(
            String ownerUsername,
            String repositoryName,
            String guestUserId,
            InvitationStatus status
    );


    Optional<Invitation> findByHostUser_UsernameIgnoreCaseAndRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(
            String hostUsername,
            String ownerUsername,
            String repositoryName
    );
    List<Invitation> findByGuestUser_IdAndStatus(
            String guestUserId,
            InvitationStatus status
    );

    List<Invitation> findByRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(
            String ownerUsername,
            String repositoryName
    );

    List<Invitation> findByHostUser_IdAndStatus(
            String hostUserId,
            InvitationStatus status
    );
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\TaskStatus.java`

```java
package com.final_project.versioncontrolservice.model;

public enum TaskStatus {
    OPEN("open"),
    CANCELLED("cancelled"),
    COMPLETED("completed"),
    PROGRESS("progress"),
    REVIEW("review");
    private String status;
    TaskStatus(String status){
        this.status=status;
    }

    public String getStatus(){
        return this.status;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\TaskPriority.java`

```java
package com.final_project.versioncontrolservice.model;

public enum TaskPriority {
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high"),
    CRITICAL("critical");
    private String value;
    TaskPriority(String value) {
        this.value = value;
    }
    public String value() {
        return this.value;
    }

}
```

## `src/main\java\com\final_project\versioncontrolservice\model\TaskComment.java`

```java
package com.final_project.versioncontrolservice.model;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Document(collection = "task_comments")
public class TaskComment {

    @Id
    private String  id;

    @Field("task_id")
    @Indexed
    private String  taskId;

    @Field("repo_owner")
    private String repoOwner;

    @Field("repo_name")
    private String repoName;

    private String author;

    private String body;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("is_review")
    private boolean isReview;  // Whether this is a review/grading comment

    @Field("review_score")
    private Integer reviewScore;  // Score given in review
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Task.java`

```java
package com.final_project.versioncontrolservice.model;


import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "tasks")
@CompoundIndexes({
        @CompoundIndex(name = "repo_task", def = "{'repo_owner': 1, 'repo_name': 1, 'number': 1}", unique = true)
})
@Builder
@AllArgsConstructor
public class Task {
    @Id
    private String  id;
    @Field("repo_owner")
    @Indexed
    private MilestoneTaskUser repoOwner;


    @Field("repo_name")
    @Indexed
    private String repoName;

    @Indexed
    private Integer number;  // Auto-increment within repository
    private String title;
    private String description;


    @Field("milestone_id")
    @Indexed
    private String  milestoneId;

    @Field("milestone_number")
    private Integer milestoneNumber;

    @Field("assigned_to")
    @Indexed
    private MilestoneTaskUser assignedTo;  // Username of assignee

    @Field("assigned_at")
    private Instant assignedAt;

    @Field("created_by")
    private String createdBy;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("completed_at")
    private Instant completedAt;

    private TaskStatus status;  // "open", "in_progress", "in_review", "completed", "cancelled"
    private TaskPriority priority;  // "low", "medium", "high", "critical"
    private List<Label> labels = new ArrayList<>();

    @Field("due_date")
    private Instant dueDate;
    @Field("estimated_hours")
    private Integer estimatedHours;


    @Field("actual_hours")
    private Integer actualHours;


    // Academic-specific fields
    @Field("max_score")
    private Integer maxScore;  // Points for this specific task

    @Field("earned_score")
    private Integer earnedScore;  // Points earned by student

    @Field("reviewed_by")
    private String reviewedBy;  // Who reviewed/graded this

    @Field("reviewed_at")
    private Instant reviewedAt;

    @Field("review_comments")
    private String reviewComments;

    @Field("submission_url")
    private String submissionUrl;  // Link to submitted work

    @Field("submission_branch")
    private String submissionBranch;  // Branch containing submission

    @Field("submission_commit")
    private String submissionCommit;  // Commit hash of submission

    @Field("requirements_checklist")
    private List<RequirementCheck> requirementsChecklist = new ArrayList<>();

    @Field("attachments")
    private List<Attachment> attachments = new ArrayList<>();

    @Field("comments_count")
    private Integer commentsCount = 0;

    // Linked PR
    @Field("linked_pr_id")
    private String linkedPrId;

    @Data
    public static class RequirementCheck {
        private String requirement;
        private boolean completed;
        private String comment;
    }

    @Data
    public static class Attachment {
        private String name;
        private String url;
        private String type;
        private long size;
        private Instant uploadedAt;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Submission.java`

```java
package com.final_project.versioncontrolservice.model;


import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@Document(collection = "submissions")
public class Submission {

    @Id
    private ObjectId id;
    @Field("task_id")
    @Indexed
    private String  taskId;

    @Field("submitted_by")
    @Indexed
    private MilestoneTaskUser submittedBy;

    @Field("submitted_at")
    private Instant submittedAt;

    private String description;
    @Field("branch_name")
    private String branchName;

    @Field("commit_hash")
    private String commitHash;

    @Field("pull_request_url")
    private String pullRequestUrl;

    private List<String> files = new ArrayList<>();
    private String status;  // "submitted", "reviewed", "revision_requested", "accepted"

    @Field("reviewed_by")
    private String reviewedBy;

    @Field("reviewed_at")
    private Instant reviewedAt;

    private Integer score;

    private String feedback;

    @Field("revision_count")
    private Integer revisionCount = 0;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryVisibility.java`

```java
package com.final_project.versioncontrolservice.model;

public enum RepositoryVisibility {
    PUBLIC("public"),PRIVATE("private");
    private String visibility;
    RepositoryVisibility(String visibility){
        this.visibility = visibility;
    }

    public String getVisibility(){
        return visibility;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryStatus.java`

```java
package com.final_project.versioncontrolservice.model;

public enum RepositoryStatus {
    ACTIVE("active"),
    ARCHIVED("archived"),
    DELETED("deleted");

    private String status;
    RepositoryStatus(String status){
     this.status=status;
    }

    public String getStatus(){
        return this.status;
    }

}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryMemberRecipient.java`

```java
package com.final_project.versioncontrolservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryMemberRecipient {

    private String userId;
    private String name;
    private String email;
    private String role;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryFileIndex.java`

```java
package com.final_project.versioncontrolservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "repo_file_index")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryFileIndex {

    @Id
    private String id;

    private String repositoryId;
    private String ownerUsername;
    private String repositoryName;

    private String branch;       // main
    private String path;         // src/main/App.java
    private String fileName;     // App.java

    private String blobHash;     // content object hash
    private String commitHash;   // branch head commit

    private Long size;
    private String language;
    private boolean deleted;
    private Instant indexedAt;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryEventType.java`

```java
package com.final_project.versioncontrolservice.model;


public enum RepositoryEventType {
    REPOSITORY_PUSHED,
    REPOSITORY_PULLED,
    REPOSITORY_FETCHED,
    REPOSITORY_CLONED,

    REPOSITORY_INVITATION_SENT,
    REPOSITORY_INVITATION_ACCEPTED,
    REPOSITORY_INVITATION_DECLINED,

    REPOSITORY_CREATED,
    REPOSITORY_DELETED,
    REPOSITORY_RENAMED,
    REPOSITORY_VISIBILITY_CHANGED,

    BRANCH_CREATED,
    BRANCH_DELETED,
    BRANCH_MERGED,

    COMMIT_CREATED,
    PULL_REQUEST_OPENED,
    PULL_REQUEST_MERGED,
    PULL_REQUEST_CLOSED,

    MILESTONE_CREATED,
    TASK_ASSIGNED,

}
```

## `src/main\java\com\final_project\versioncontrolservice\model\RepositoryDocument.java`

```java
package com.final_project.versioncontrolservice.model;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "repository")
@Builder
public class RepositoryDocument {

    @Id
    private String id;

    private UserDTO owner;
    private String repositoryName;
    private String description;

    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private Map<String, String> branchHeads = new HashMap<>();
    private String cloneUrl;

    @CreatedDate
    private  LocalDateTime createdAt;

    @LastModifiedDate

    private LocalDateTime updatedAt;


    private String symbolicHead = "refs/heads/main";
    public static String compositeId(String owner, String name) {
        return owner.toLowerCase() + "/" + name.toLowerCase();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\PullRequestStatus.java`

```java
package com.final_project.versioncontrolservice.model;

public enum PullRequestStatus {
    OPENED("opened"),
    CLOSED("closed"),
    MERGED("merge"),
    DRAFT("draft"),
    READY_FOR_REVIEW("ready_for_review"),
    CONFLICTING("conflicting"),
    CONFLICTED("conflicted");

    private String status;
    PullRequestStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

}
```

## `src/main\java\com\final_project\versioncontrolservice\model\PullRequestConflict.java`

```java
package com.final_project.versioncontrolservice.model;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pull_request_conflicts")
public class PullRequestConflict {
    @Id
    private String id;
    private String pullRequestId;
    private String owner;
    private String repoName;

    private String sourceBranch;
    private String targetBranch;

    private String baseHash;
    private String sourceHash;
    private String targetHash;

    private String baseTreeHash;
    private String sourceTreeHash;
    private String targetTreeHash;

    private List<ConflictFile> files;

    private boolean resolved;

    private Instant createdAt;
    private Instant resolvedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictFile {
        private String path;

        private String baseHash;
        private String sourceHash;
        private String targetHash;

        private String baseContent;
        private String sourceContent;
        private String targetContent;

        private String resolvedContent;
        private ConflictResolution resolution;
        private boolean resolved;
    }

    public enum ConflictResolution {
        SOURCE,
        TARGET,
        BOTH,
        CUSTOM
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\PullRequest.java`

```java
package com.final_project.versioncontrolservice.model;

import com.final_project.versioncontrolservice.dto.PullRequestUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
@Document(collection = "pull_request")
public class PullRequest {
    @Id
    private String id;
    @Field("repo_owner")
    private PullRequestUser repoOwner;
    @Field("repo_name")
    private String repoName;

    private PullRequestUser author;

    @Field("source_branch")
    private String sourceBranch;
    @Field("source_hash")
    private String sourceHash;
    @Field("target_branch")
    private String targetBranch;
    @Field("target_hash")
    private String targetHash;
    private String title;
    private String description;
    private PullRequestStatus status;
    @CreatedDate
    private Instant createdAt;
    @Field("merged_at")
    private Instant mergedAt;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Milestone.java`

```java
package com.final_project.versioncontrolservice.model;
import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "milestones")
@CompoundIndexes({
        @CompoundIndex(name = "repo_milestone", def = "{'repo_owner': 1, 'repo_name': 1, 'number': 1}", unique = true)
})
@Builder
@AllArgsConstructor
public class Milestone {

    @Id
    private String  id;

    @Field("repo_owner")
    @Indexed
    private MilestoneTaskUser repoOwner;
    @Field("repo_name")
    @Indexed
    private String repoName;

    @Indexed
    private Integer number;  // Auto-increment within repository

    private String title;
    private String description;
    @Field("due_date")
    private Instant dueDate;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("closed_at")
    private Instant closedAt;

    @Field("created_by")
    private String createdBy;

    private String status;  // "open", "closed"

    // Academic-specific fields
    @Field("max_score")
    private Integer maxScore;  // Maximum points for this milestone

    @Field("passing_score")
    private Integer passingScore;  // Minimum score to pass

    private String rubric;  // Grading criteria/rubric

    @Field("required_tasks")
    private Integer requiredTasks;  // Number of tasks that must be completed

    @Field("completion_percentage")
    private Double completionPercentage;  // 0.0 to 100.0
    // Statistics
    @Field("total_tasks")
    private Integer totalTasks = 0;

    @Field("open_tasks")
    private Integer openTasks = 0;

    @Field("completed_tasks")
    private Integer completedTasks = 0;

    @Field("in_progress_tasks")
    private Integer inProgressTasks = 0;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Label.java`

```java
package com.final_project.versioncontrolservice.model;

public enum Label {
    BUG,
    DOCUMENTATION,
    DUPLICATE,
    INVALID,
    QUESTION

}
```

## `src/main\java\com\final_project\versioncontrolservice\model\InvitationStatus.java`

```java
package com.final_project.versioncontrolservice.model;

public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    EXPIRED
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Invitation.java`

```java
package com.final_project.versioncontrolservice.model;

import com.final_project.versioncontrolservice.dto.RepositoryMetadata;
import com.final_project.versioncontrolservice.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "repo_invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {
    @Id
    private String id;
    private RepositoryMetadata repository;
    private UserDTO guestUser;
    private UserDTO hostUser;
    private String role;
    private InvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\EventType.java`

```java
package com.final_project.versioncontrolservice.model;

public enum EventType {
    MERGE,
    PULL_REQUEST,
    PUSH,


}
```

## `src/main\java\com\final_project\versioncontrolservice\model\ContributorStatus.java`

```java
package com.final_project.versioncontrolservice.model;

public enum ContributorStatus {
    ACCEPTED,
    PENDING,
    CANCELLED
}
```

## `src/main\java\com\final_project\versioncontrolservice\model\Collaborator.java`

```java
package com.final_project.versioncontrolservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Collaborator {
    private String username;
    private String role;
}
```

## `src/main\java\com\final_project\versioncontrolservice\kafka\KafkaProducer.java`

```java
package com.final_project.versioncontrolservice.kafka;

import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@AllArgsConstructor
public class KafkaProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AppProperties appProperties;

    public void produce(RepositoryOperationEvent repositoryOperationEvent) {
        kafkaTemplate.send(appProperties.getKafka().getTopics().getRepositoryOperation(), repositoryOperationEvent.getEventId(), repositoryOperationEvent)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Field to publish Blog interaction event. eventType {} eventId {} ", repositoryOperationEvent.getEventType(), repositoryOperationEvent.getEventId());
                    }
                    else{
                        log.info("PUBLISH Blog INteraction EVENT. topic {} partition {} offset {} and eventId {} ",
                                res.getProducerRecord().topic(),
                                res.getProducerRecord().partition(),
                                res.getRecordMetadata().hasOffset(),
                                repositoryOperationEvent.getEventId()
                        );
                    }

                });

    }

}
```

## `src/main\java\com\final_project\versioncontrolservice\exception\UnauthorizedException.java`

```java
package com.final_project.versioncontrolservice.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String m) {
        super(m);
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\exception\NotFoundException.java`

```java
package com.final_project.versioncontrolservice.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
}
```

## `src/main\java\com\final_project\versioncontrolservice\exception\InvalidCredentialsException.java`

```java
package com.final_project.versioncontrolservice.exception;

public  class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\exception\ForbiddenException.java`

```java
package com.final_project.versioncontrolservice.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) { super(message); }
}
```

## `src/main\java\com\final_project\versioncontrolservice\exception\BadRequestException.java`

```java
package com.final_project.versioncontrolservice.exception;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) { super(message); }
}
```

## `src/main\java\com\final_project\versioncontrolservice\event\RepositoryOperationEvent.java`

```java
package com.final_project.versioncontrolservice.event;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.final_project.versioncontrolservice.model.RepositoryEventType;
import com.final_project.versioncontrolservice.model.RepositoryMemberRecipient;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RepositoryOperationEvent {

    private String eventId;
    private RepositoryEventType eventType;

    private String repositoryId;
    private String repositoryName;
    private String repositoryUrl;

    private String actorUserId;
    private String actorName;
    private String actorEmail;

    private String ownerUserId;
    private String ownerName;
    private String ownerEmail;

    private String branchName;
    private String sourceBranch;
    private String targetBranch;

    private String commitId;
    private String commitMessage;
    private Integer commitCount;

    private String pullRequestId;
    private String pullRequestTitle;
    private String pullRequestUrl;

    private String invitedUserId;
    private String invitedUserName;
    private String invitedUserEmail;

    private List<RepositoryMemberRecipient> recipients;

    private LocalDateTime occurredAt;

    private Map<String, Object> metadata;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\UserDTO.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Data Transfer Objects for User API endpoints.
 */

/**
 * UserDTO - Response DTO for user information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    @JsonProperty("id")
    private String id;

    @JsonProperty("user_name")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("phone_number")
    private String phoneNumber;
    @JsonProperty("status")
    private String status;
    @JsonProperty("email_verified")
    private Boolean emailVerified;
    @JsonProperty("roles")
    private Set<String> roles;
    private String profile;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\SubmissionResponse.java`

```java
package com.final_project.versioncontrolservice.dto;
import java.time.Instant;
import java.util.List;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.Submission;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SubmissionResponse(

        @JsonProperty("id")
        String id,

        @JsonProperty("task_id")
        String taskId,

        @JsonProperty("submitted_by")
        MilestoneTaskUser submittedBy,

        @JsonProperty("submitted_at")
        Instant submittedAt,

        String description,

        @JsonProperty("branch_name")
        String branchName,

        @JsonProperty("commit_hash")
        String commitHash,

        @JsonProperty("pull_request_url")
        String pullRequestUrl,

        List<String> files,

        String status,

        @JsonProperty("reviewed_by")
        String reviewedBy,

        @JsonProperty("reviewed_at")
        Instant reviewedAt,

        Integer score,

        String feedback,

        @JsonProperty("revision_count")
        Integer revisionCount

) {
    public static SubmissionResponse from(Submission s) {
        return new SubmissionResponse(
                s.getId() != null ? s.getId().toHexString() : null,
                s.getTaskId(),
                s.getSubmittedBy(),
                s.getSubmittedAt(),
                s.getDescription(),
                s.getBranchName(),
                s.getCommitHash(),
                s.getPullRequestUrl(),
                s.getFiles(),
                s.getStatus(),
                s.getReviewedBy(),
                s.getReviewedAt(),
                s.getScore(),
                s.getFeedback(),
                s.getRevisionCount()
        );
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\SignupRequest.java`

```java
package com.final_project.versioncontrolservice.dto;



import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SignupRequest - Request DTO for user registration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "Username can only contain alphanumeric characters, dots, and underscores")
    @JsonProperty("username")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @JsonProperty("email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "Password must contain uppercase, lowercase, number, and special character"
    )
    @JsonProperty("password")
    private String password;

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must not exceed 50 characters")
    @JsonProperty("first_name")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50, message = "Last name must not exceed 50 characters")
    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("terms_agreed")
    private Boolean termsAgreed = false;

    @JsonProperty("privacy_agreed")
    private Boolean privacyAgreed = false;
}



```

## `src/main\java\com\final_project\versioncontrolservice\dto\ResolveConflictRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.PullRequestConflict;
import lombok.Data;

import java.util.List;

@Data
public class ResolveConflictRequest {
    private List<FileResolution> files;

    @Data
    public static class FileResolution {
        private String path;
        // SOURCE, TARGET, BOTH, CUSTOM
        private PullRequestConflict.ConflictResolution resolution;

        // required only when resolution = CUSTOM
        private String customContent;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\RepositoryResponse.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RepositoryResponse {
    private String id;
    private UserDTO owner;
    private String repositoryName;
    private String description;

    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private Map<String, String> branchHeads = new HashMap<>();
    private String cloneUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\RepositoryMetadata.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepositoryMetadata {
    private String repositoryName;
    private String repositoryId;
    private String userName;
    private RepositoryVisibility type;
    private String description;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\RepositoryDTO.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepositoryDTO {
    private String id;
    private String  owner;
    private String repositoryName;
    private String description;
    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
    private List<ContributorUser> collaborators = new ArrayList<>();
    private String cloneUrl;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\RefreshTokenRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    @JsonProperty("refresh_token")
    private String refreshToken;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\PullRequestUser.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PullRequestUser {
    @JsonProperty("id")
    private String id;
    @JsonProperty("user_name")
    private String username;
    @JsonProperty("email")
    private String email;
    @JsonProperty("first_name")
    private String firstName;
    @JsonProperty("profile")
    private String profile;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\PullRequestResponse.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.PullRequest;
import com.final_project.versioncontrolservice.model.PullRequestStatus;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PullRequestResponse(
        @JsonProperty("id") String id,
        @JsonProperty("repo_owner") PullRequestUser repoOwner,
        @JsonProperty("repo_name") String repoName,
        PullRequestUser author,
        @JsonProperty("source_branch")  String sourceBranch,
        @JsonProperty("source_hash") String sourceHash,
        @JsonProperty("target_branch") String targetBranch,
        @JsonProperty("target_hash") String targetHash,
        String title,
        String description,
        PullRequestStatus status,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("merged_at") Instant mergedAt
) {
    public static PullRequestResponse from(PullRequest d) {
        return new PullRequestResponse(
                d.getId(),
                d.getRepoOwner(),
                d.getRepoName(),
                d.getAuthor(),
                d.getSourceHash(),
                d.getSourceBranch(),
                d.getTargetBranch(),
                d.getTargetHash(),
                d.getTitle(),
                d.getDescription(),
                d.getStatus(),
                d.getCreatedAt(),
                d.getMergedAt()
        );
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\MilestoneTaskUser.java`

```java
package com.final_project.versioncontrolservice.dto;

import kotlin.BuilderInference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneTaskUser {
    private String userId;
    private String userName;
    private String firstName;
    private String email;
    private String profile;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\MergeResponse.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.PullRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MergeResponse {
    private String pullRequestId;
    private PullRequestStatus status;
    private String sourceBranch;
    private String targetBranch;
    private String newHead;     // updated commit hash
    private Instant mergedAt;
    private String message;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\MergeConflictResponse.java`

```java
package com.final_project.versioncontrolservice.dto;
import lombok.Builder;
import lombok.Data;
import java.util.List;
@Data
@Builder
public class MergeConflictResponse {
    private String pullRequestId;
    private String status;
    private List<ConflictFileDTO> conflicts;

    @Data
    @Builder
    public static class ConflictFileDTO {
        private String path;
        private String baseContent;
        private String sourceContent;
        private String targetContent;
        private boolean binary;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\LoginRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Email or username is required")
    @JsonProperty("username_or_email")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    @JsonProperty("password")
    private String password;

    @JsonProperty("remember_me")
    private Boolean rememberMe = false;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\InvitationResponse.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
@Builder
public record InvitationResponse(
        @JsonProperty("id") String id,
        @JsonProperty("repo_owner") String repoOwner,
        @JsonProperty("repo_name") String repoName,
        @JsonProperty("invited_user") String invitedUser,
        String role,
        InvitationStatus status,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    public static InvitationResponse from(Invitation d) {
        return new InvitationResponse(
                d.getId(),
                d.getHostUser().getUsername(),
                d.getRepository().getRepositoryName(),
                d.getGuestUser().getUsername(),
                d.getRole(),
                d.getStatus(),
                d.getCreatedAt()
        );
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\InvitationRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvitationRequest {
        private String repository;
        private String  guest;
        private String host;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\CreateRepositoryRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.RepositoryVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateRepositoryRequest {
    @JsonProperty("user_name")
    private String  userName;
    @JsonProperty("repository_name")
    private String repositoryName;
    @JsonProperty("description")
    private String description;
    @JsonProperty("repository_visibility")
    private RepositoryVisibility visibility = RepositoryVisibility.PUBLIC;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\CreatePullRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CreatePullRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    @NotBlank
    private String sourceBranch;
    @NotBlank
    private String targetBranch;

    private String author;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\ContributorUser.java`

```java
package com.final_project.versioncontrolservice.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.model.ContributorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContributorUser {
    @JsonProperty("id")
    private String id;
    @JsonProperty("user_name")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("status")
    private String status;

    @JsonProperty("roles")
    private Set<String> roles;
    @JsonProperty("profile")
    private String profile;

    private String Role;
    private ContributorStatus ContributorStatus;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\ContributorRequest.java`

```java
package com.final_project.versioncontrolservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContributorRequest {
    @JsonProperty("id")
    private String id;
    @JsonProperty("user_name")
    private String username;
    @JsonProperty("email")
    private String email;
}
```

## `src/main\java\com\final_project\versioncontrolservice\dto\AuthResponse.java`

```java
package com.final_project.versioncontrolservice.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("token_type")
    private String tokenType = "Bearer";

    @JsonProperty("expires_in")
    private Long expiresIn;

    @JsonProperty("user")
    private UserDTO user;

    @JsonProperty("message")
    private String message;
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\WebGitController.java`

```java
package com.final_project.versioncontrolservice.controller;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.service.*;
import com.final_project.versioncontrolservice.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/repos/{owner}/{repo}")
public class WebGitController {

    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;

    public WebGitController(
            AuthService authService,
            RepositoryService vicRepositoryService,
            MinioStorageService minioStorageService
    ) {
        this.authService = authService;
        this.vicRepositoryService = vicRepositoryService;
        this.minioStorageService = minioStorageService;
    }

    /**
     * Create or update a file via web interface
     * PUT /repos/{owner}/{repo}/contents/{path}
     */
    @PutMapping(value = "/contents/**", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WebCommitResponse> createOrUpdateFile(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody CreateFileRequest body,
            HttpServletRequest request
    ) {
        ContributorUser user = authService.getContributorUser(authorization);
        var meta = vicRepositoryService.loadMeta(owner, repo);

        if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
            throw new ForbiddenException("forbidden");
        }

        // Extract file path
        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        try {
            // Get current commit
            String branch = body.getBranch() != null ? body.getBranch() : "main";
            String currentHash = meta.getBranchHeads().getOrDefault(branch, "");

            // Create blob for new file content
            byte[] content = body.getContent().getBytes(StandardCharsets.UTF_8);
            String blobHash = storeObject(owner, repo, "blob", content);

            // Build new tree
            String newTreeHash;
            if (currentHash.isEmpty()) {
                // First commit
                newTreeHash = createTreeFromSingleFile(owner, repo, filePath, blobHash);
            } else {
                // Get existing tree and update
                byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
                VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
                VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

                newTreeHash = updateTreeWithFile(owner, repo, commitInfo.tree(), filePath, blobHash);
            }

            // Create commit
            List<String> parents = new ArrayList<>();
            if (!currentHash.isEmpty()) {
                parents.add(currentHash);
            }

            String commitHash = createCommit(owner, repo, newTreeHash, parents,
                    body.getMessage(), user.getUsername());

            // Update branch
            meta.getBranchHeads().put(branch, commitHash);
            vicRepositoryService.updateBranchRef(meta, branch, commitHash);

            WebCommitResponse response = new WebCommitResponse(
                    commitHash,
                    commitHash.substring(0, 8),
                    filePath,
                    "created/updated"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("web commit failed: " + e.getMessage());
        }
    }

    /**
     * Delete a file via web interface
     * DELETE /repos/{owner}/{repo}/contents/{path}
     */
    @DeleteMapping(value = "/contents/**", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WebCommitResponse> deleteFile(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody DeleteFileRequest body,
            HttpServletRequest request
    ) {
        ContributorUser user = authService.getContributorUser(authorization);
        var meta = vicRepositoryService.loadMeta(owner, repo);

        if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
            throw new ForbiddenException("forbidden");
        }

        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        try {
            String branch = body.getBranch() != null ? body.getBranch() : "main";
            String currentHash = meta.getBranchHeads().getOrDefault(branch, "");

            if (currentHash.isEmpty()) {
                throw new BadRequestException("no commits yet");
            }

            // Get existing tree and remove file
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String newTreeHash = removeFileFromTree(owner, repo, commitInfo.tree(), filePath);

            // Create commit
            List<String> parents = new ArrayList<>();
            parents.add(currentHash);

            String commitHash = createCommit(owner, repo, newTreeHash, parents,
                    body.getMessage(), user.getUsername());

            meta.getBranchHeads().put(branch, commitHash);
            vicRepositoryService.updateBranchRef(meta, branch, commitHash);

            WebCommitResponse response = new WebCommitResponse(
                    commitHash,
                    commitHash.substring(0, 8),
                    filePath,
                    "deleted"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("web delete failed: " + e.getMessage());
        }
    }

    // ─── Helper Methods ───────────────────────────────────────────────────

    private String storeObject(String owner, String repo, String type, byte[] content) throws Exception {
        // Calculate SHA-1
        String header = type + " " + content.length + "\0";
        byte[] full = new byte[header.length() + content.length];
        System.arraycopy(header.getBytes(StandardCharsets.UTF_8), 0, full, 0, header.length());
        System.arraycopy(content, 0, full, header.length(), content.length);

        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] hashBytes = sha1.digest(full);
        String hash = bytesToHex(hashBytes);

        // Compress with zlib
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        DeflaterOutputStream dos = new DeflaterOutputStream(baos, new Deflater());
        dos.write(full);
        dos.close();
        byte[] compressed = baos.toByteArray();

        // Store in MinIO
        minioStorageService.putObjectIfAbsent(owner, repo, hash, compressed);

        return hash;
    }

    private String createTreeFromSingleFile(String owner, String repo, String path, String blobHash) throws Exception {
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
        String dirPath = path.contains("/") ? path.substring(0, path.lastIndexOf("/")) : "";

        String treeContent = "100644\tblob\t" + blobHash + "\t" + fileName;
        String treeHash = storeObject(owner, repo, "tree", treeContent.getBytes(StandardCharsets.UTF_8));

        // If file is in subdirectory, create parent trees
        if (!dirPath.isEmpty()) {
            String[] dirs = dirPath.split("/");
            String currentHash = treeHash;

            for (int i = dirs.length - 1; i >= 0; i--) {
                String parentContent = "040000\ttree\t" + currentHash + "\t" + dirs[i];
                currentHash = storeObject(owner, repo, "tree", parentContent.getBytes(StandardCharsets.UTF_8));
            }
            return currentHash;
        }

        return treeHash;
    }

    private String updateTreeWithFile(String owner, String repo, String treeHash, String path, String blobHash) throws Exception {
        // This is a simplified version - a complete implementation would handle nested trees properly
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

        byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
        VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
        String existingContent = new String(treeObj.content(), StandardCharsets.UTF_8);

        StringBuilder newContent = new StringBuilder();
        boolean found = false;

        for (String line : existingContent.split("\n")) {
            if (line.trim().isEmpty()) continue;
            String[] parts = line.split("\t");
            if (parts.length >= 4 && parts[3].equals(fileName)) {
                // Replace this entry
                newContent.append("100644\tblob\t").append(blobHash).append("\t").append(fileName).append("\n");
                found = true;
            } else {
                newContent.append(line).append("\n");
            }
        }

        if (!found) {
            // Add new entry
            newContent.append("100644\tblob\t").append(blobHash).append("\t").append(fileName).append("\n");
        }

        return storeObject(owner, repo, "tree", newContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String removeFileFromTree(String owner, String repo, String treeHash, String path) throws Exception {
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

        byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
        VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
        String existingContent = new String(treeObj.content(), StandardCharsets.UTF_8);

        StringBuilder newContent = new StringBuilder();

        for (String line : existingContent.split("\n")) {
            if (line.trim().isEmpty()) continue;
            String[] parts = line.split("\t");
            if (parts.length >= 4 && !parts[3].equals(fileName)) {
                newContent.append(line).append("\n");
            }
        }

        return storeObject(owner, repo, "tree", newContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String createCommit(String owner, String repo, String treeHash, List<String> parents, String message, String author) throws Exception {
        StringBuilder commitContent = new StringBuilder();
        commitContent.append("tree ").append(treeHash).append("\n");

        for (String parent : parents) {
            commitContent.append("parent ").append(parent).append("\n");
        }

        long timestamp = Instant.now().getEpochSecond();
        commitContent.append("author ").append(author).append(" <").append(author).append("@vic.com> ").append(timestamp).append("\n");
        commitContent.append("committer ").append(author).append(" <").append(author).append("@vic.com> ").append(timestamp).append("\n");
        commitContent.append("\n").append(message).append("\n");

        return storeObject(owner, repo, "commit", commitContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ─── Request/Response DTOs ────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateFileRequest {
        private String content;
        private String message;
        private String branch;
        private String sha; // for updates, the SHA of the file being replaced

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
        public String getSha() { return sha; }
        public void setSha(String sha) { this.sha = sha; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DeleteFileRequest {
        private String message;
        private String branch;
        private String sha;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
        public String getSha() { return sha; }
        public void setSha(String sha) { this.sha = sha; }
    }

    public static class WebCommitResponse {
        @JsonProperty("commit_sha")
        private String commitSha;
        @JsonProperty("short_sha")
        private String shortSha;
        private String path;
        private String status;

        public WebCommitResponse(String commitSha, String shortSha, String path, String status) {
            this.commitSha = commitSha;
            this.shortSha = shortSha;
            this.path = path;
            this.status = status;
        }

        public String getCommitSha() { return commitSha; }
        public String getShortSha() { return shortSha; }
        public String getPath() { return path; }
        public String getStatus() { return status; }
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\TaskController.java`

```java
package com.final_project.versioncontrolservice.controller;


import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.SubmissionResponse;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.MilestoneService;
import com.final_project.versioncontrolservice.service.TaskService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/v1/task")
@RestController
@AllArgsConstructor
public class TaskController {
    private final AuthService authService;
    private final TaskService taskService;
    /**
     * Create a new task
     * POST /repos/{owner}/{repo}/tasks
     */

    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{username}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> createTask(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody TaskService.TaskRequest request,
            @PathVariable String username

    ) {
        return ResponseEntity.ok(taskService.createTask(owner, repo, request, username));
    }

    /**
     * Assign task to user
     * POST /repos/{owner}/{repo}/tasks/{number}/assign
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/assign/{user}/{assignee}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> assignTask(
            @PathVariable String user,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @PathVariable String assignee
    ) {
        return ResponseEntity.ok(taskService.assignTask(owner, repo, number, assignee, user));
    }

    /**
     * Submit work for a task
     * POST /repos/{owner}/{repo}/tasks/{number}/submit
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/submit",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SubmissionResponse> submitTask(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody TaskService.SubmissionRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {

        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(taskService.submitTask(owner, repo, number, request, user.getUsername()));
    }

    /**
     * Review/grading a task
     * POST /repos/{owner}/{repo}/tasks/{number}/review
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/review",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> reviewTask(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody TaskService.ReviewRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(taskService.reviewTask(owner, repo, number, request, user.getUsername()));
    }

    /**
     * Get student dashboard
     * GET /repos/{owner}/{repo}/dashboard
     */
    @GetMapping(path = "/repos/{owner}/{repo}/dashboard",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TaskService.StudentDashboard> getDashboard(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal Jwt jwt
            ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(taskService.getStudentDashboard(owner, repo, user.getUsername()));
    }

    /**
     * List tasks (with filters)
     * GET /repos/{owner}/{repo}/tasks
     */
//    @GetMapping(path = "/repos/{owner}/{repo}/tasks",
//            produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<List<MilestoneService.TaskResponse>> listTasks(
//            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
//            @PathVariable String owner,
//            @PathVariable String repo,
//            @RequestParam(required = false) String assignee,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) Integer milestone) {
//        return ResponseEntity.ok(taskService.);
//    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\RepositoryController.java`

```java
package com.final_project.versioncontrolservice.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.InvitationApplicationService;
import com.final_project.versioncontrolservice.service.RepoAccessRules;
import com.final_project.versioncontrolservice.service.RepositoryService;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/api/v1/repos")
@AllArgsConstructor
public class RepositoryController {
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final RepositoryService vicRepositoryService;
    private final InvitationApplicationService invitationApplicationService;


    @PostMapping( consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryResponse> createRepo(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody CreateRepositoryRequest request
    ) {
        return ResponseEntity.ok(repositoryService.createRepo(request));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RepositoryResponse>> searchRepositories(
            @RequestParam String keyword
    ) {
             return   ResponseEntity.ok(repositoryService.searchRepositories(keyword));
    }
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<RepositoryResponse>> getOwnerRepos(
            @PathVariable String ownerId
    ) {
        return ResponseEntity.ok(repositoryService.getOwnerRepos(ownerId));
    }

    @GetMapping(path = "/{owner}/{repo}/info/refs", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> infoRefs(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal Jwt jwt
    ) {

        var meta = repositoryService.loadMeta(owner, repo);
        String userName =  jwt.getClaim("preferred_username");
        return repositoryService.listRefs(meta);
    }

    @GetMapping(path = "/{owner}/{repo}/objects/{hash}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getObject(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String hash,
            @AuthenticationPrincipal Jwt jwt
    ) {
        var meta = repositoryService.loadMeta(owner, repo);
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        byte[] data = repositoryService.readObjectRaw(meta, hash.trim());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).body(data);
    }

    @PostMapping(
            path = "/{owner}/{repo}/objects/{hash}",
            consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadObject(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String hash,
            @RequestBody byte[] body,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = repositoryService.loadMeta(owner, repo);
        repositoryService.writeObject(meta, hash.trim(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "stored"));
    }

    @PostMapping(
            path = "/{owner}/{repo}/refs/heads/{branch}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public UpdateBranchResponse updateBranch(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String branch,
            @RequestBody UpdateBranchBody body,
            @AuthenticationPrincipal Jwt jwt
    ) throws IOException {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = repositoryService.loadMeta(owner, repo);
        repositoryService.updateBranchRef(meta, branch, body.hash().trim());
        return new UpdateBranchResponse("updated", branch.trim());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepositoryDTO> getRepoById(
            @PathVariable String id
    ){
        return ResponseEntity.ok(repositoryService.getRepositoryById(id));
    }
    @PostMapping(path = "/{owner}/{repo}/invitations/{guest}")
    public ResponseEntity<InvitationResponse> create(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String guest
    ) {
      return ResponseEntity.ok(
              invitationApplicationService.create(InvitationRequest
                      .builder()
                      .repository(repo)
                      .guest(guest)
                      .host(owner)
                      .build())
      ) ;
    }

    @GetMapping(path = "/invitations/{user}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<InvitationResponse> listMine(
            @PathVariable String user
    ) {
        return invitationApplicationService.listPendingForUser(user);
    }

    @PostMapping(path = "/invitations/{invitationId}/accept/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InvitationResponse> accept(
            @PathVariable String userId,
            @PathVariable String invitationId
    ) {
       return ResponseEntity.ok(invitationApplicationService.accept(invitationId, userId)) ;
    }


    @PostMapping(path = "/guest/{guestId}/owner/{ownerId}/repository/{repoName}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryDTO> removeFromRepositoryContribution(
            @PathVariable String guestId,
            @PathVariable String ownerId,
            @PathVariable String repoName
    ) {
        return ResponseEntity.ok(repositoryService.removeBlockUserFromRepository(ownerId,guestId, repoName)) ;
    }
    @PostMapping(path = "/invitations/{invitationId}/reject/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InvitationResponse> reject(
            @PathVariable String userId,
            @PathVariable String invitationId
    ) {
        return ResponseEntity.ok(invitationApplicationService.reject(invitationId, userId)) ;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InviteBody(String username, String role) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreateRepoBody(String name, String description) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdateBranchBody(String hash) {}

    /** Matches Go: JSON field {@code hash} holds the branch name. */
    public record UpdateBranchResponse(String status, @JsonProperty("hash") String branchName) {}
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\PullRequestController.java`

```java
package com.final_project.versioncontrolservice.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.model.PullRequest;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.PullRequestApplicationService;
import com.final_project.versioncontrolservice.service.RepoAccessRules;
import com.final_project.versioncontrolservice.service.RepositoryService;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/repos")
public class PullRequestController {


    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final PullRequestApplicationService pullRequestApplicationService;


    @PostMapping(path = "/{owner}/{repo}/pulls", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PullRequestResponse> create(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody CreatePullRequest request

            ) {
        return ResponseEntity.ok(pullRequestApplicationService.create(
                owner,
                repo,
                request
        ));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<PullRequestResponse>> list(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.list(owner, repo));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PullRequestResponse> get(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.find(id, owner, repo));
    }

    @PostMapping(path = "/{owner}/{repo}/pulls/{id}/merge", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MergeResponse> merge(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) throws IOException {
        return ResponseEntity.ok(pullRequestApplicationService.merge(id, owner, repo));
    }

    @GetMapping(
            path = "/{owner}/{repo}/pulls/{id}/conflicts",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<MergeConflictResponse> conflicts(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(
                pullRequestApplicationService.getConflicts(id, owner, repo)
        );
    }

    @PostMapping(
            path = "/{owner}/{repo}/pulls/{id}/conflicts/resolve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<MergeResponse> resolveConflicts(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id,
            @RequestBody ResolveConflictRequest request
    ) throws IOException {
        return ResponseEntity.ok(
                pullRequestApplicationService.resolveConflicts(id, owner, repo, request)
        );
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\MilestoneController.java`

```java
package com.final_project.versioncontrolservice.controller;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.model.Milestone;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.MilestoneService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RequestMapping("/api/v1/milestone")
@RestController
public class MilestoneController {

    private final AuthService authService;
    private final MilestoneService milestoneService;

    /**
     * Create a new milestone
     * POST /repos/{owner}/{repo}/milestones
     */
    @PostMapping(path = "/repos/{owner}/{repo}/milestones",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> createMilestone(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody MilestoneService.MilestoneRequest request) {
        String writer = jwt.getSubject();
        return ResponseEntity.ok(milestoneService.createMilestone(owner, repo, request, writer));
    }
    /**
     * List all milestones for a repository
     * GET /repos/{owner}/{repo}/milestones
     */
    @GetMapping(path = "/repos/{owner}/{repo}/milestones",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MilestoneService.MilestoneResponse>> listMilestones(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "open") String state) {
        List<MilestoneService.MilestoneResponse> milestones = milestoneService.getMilestones(owner, repo);

        // Filter by state if specified
        if (!"all".equals(state)) {
            milestones = milestones.stream()
                    .filter(m -> state.equals(m.getStatus()))
                    .toList();
        }

        return ResponseEntity.ok(milestones);
    }
    /**
     * Get a specific milestone
     * GET /repos/{owner}/{repo}/milestones/{number}
     */
    @GetMapping(path = "/repos/{owner}/{repo}/milestones/{number}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> getMilestone(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number) {
        return ResponseEntity.ok (MilestoneService.MilestoneResponse.fromDocument(milestoneService.getMilestone(owner, repo, number)) );
    }


    /**
     * Close a milestone
     * PATCH /repos/{owner}/{repo}/milestones/{number}
     */
    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> updateMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody MilestoneService.MilestoneRequest request
            ) {
        return ResponseEntity.ok(milestoneService.updateMilestone(owner, repo,number, request));
    }
    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}/open",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> closeMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String username = jwt.getSubject();
        return ResponseEntity.ok(milestoneService.closeMilestone(owner, repo,number,username));

    }

    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}/re-open",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> reOpenMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String username = jwt.getSubject();
        return ResponseEntity.ok(milestoneService.reopenMilestone(owner, repo,number,username));
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\GlobalExceptionHandler.java`

```java
package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.final_project.versioncontrolservice.service.AuthService;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<String> notFound(NotFoundException ex) {
        return text(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<String> badRequest(BadRequestException ex) {
        return text(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<String> invalidCreds() {
        return text(HttpStatus.UNAUTHORIZED, "invalid credentials");
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<String> unauthorized(UnauthorizedException ex) {
        return text(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<String> forbiddenPr(ForbiddenException ex) {
        return text(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> illegalArg(IllegalArgumentException ex) {
        return text(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> illegalState(IllegalStateException ex) {
        return text(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    private static ResponseEntity<String> text(HttpStatus status, String body) {
        return ResponseEntity.status(status).contentType(MediaType.TEXT_PLAIN).body(body);
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\FileViewController.java`

```java
package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.service.*;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("api/v1/repos/{owner}/{repo}")
@AllArgsConstructor
public class FileViewController {

    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;
    private final CommitGraphService commitGraphService;


    /**
     * Get file content at a specific commit/branch
     * GET /repos/{owner}/{repo}/contents/{path}?ref=main
     */
    @GetMapping(value = "/contents/**", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FileContentResponse> getFileContent(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {

        var meta = vicRepositoryService.loadMeta(owner, repo);
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        // Check permissions
        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        // Extract file path from URL
        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        // Resolve ref to commit hash
        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        // Get file content from commit
        FileContentResponse response = getFileAtCommit(owner, repo, commitHash, filePath);
        return ResponseEntity.ok(response);
    }

    /**
     * Get file history (blame)
     * GET /repos/{owner}/{repo}/blame/{path}?ref=main
     */
    @GetMapping(value = "/blame/**", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<BlameEntry>> getBlame(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/blame/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<BlameEntry> blame = calculateBlame(owner, repo, commitHash, filePath);
        return ResponseEntity.ok(blame);
    }

    /**
     * Get file history (commits that modified this file)
     * GET /repos/{owner}/{repo}/commits?path=src/main.java&ref=main
     */
    @GetMapping(value = "/commits", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<CommitResponse>> getFileHistory(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(required = false) String path,
            @RequestParam(defaultValue = "main") String ref,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<CommitResponse> history = getCommitHistory(owner, repo, commitHash, path, limit);
        return ResponseEntity.ok(history);
    }

    /**
     * Get directory listing (tree view)
     * GET /repos/{owner}/{repo}/tree?ref=main&path=src
     */
    @GetMapping(value = "/tree", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<TreeEntry>> getTree(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            @RequestParam(defaultValue = "") String path
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<TreeEntry> tree = getTreeEntries(owner, repo, commitHash, path);
        return ResponseEntity.ok(tree);
    }

    /**
     * Compare two commits/branches
     * GET /repos/{owner}/{repo}/compare/base...head
     */
    @GetMapping(value = "/compare/{base}...{head}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CompareResponse> compareCommits(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String base,
            @PathVariable String head
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String baseHash = resolveRef(meta, base);
        String headHash = resolveRef(meta, head);

        if (baseHash.isEmpty() || headHash.isEmpty()) {
            throw new NotFoundException("ref not found");
        }

        CompareResponse comparison = compareTrees(owner, repo, baseHash, headHash);
        return ResponseEntity.ok(comparison);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────

    private String resolveRef(RepositoryDocument meta, String ref) {
        // Try as branch name
        String hash = meta.getBranchHeads().get(ref);
        if (hash != null && !hash.isEmpty()) {
            return hash;
        }

        // Try as full SHA
        if (ref.length() == 40 && ref.matches("[0-9a-f]{40}")) {
            return ref;
        }

        return "";
    }

    private FileContentResponse getFileAtCommit(String owner, String repo, String commitHash, String filePath) {
        try {
            // Read commit to get tree hash
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            // Find file in tree
            String[] pathParts = filePath.split("/");
            String currentTree = commitInfo.tree();

            for (int i = 0; i < pathParts.length - 1; i++) {
                currentTree = findTreeEntry(owner, repo, currentTree, pathParts[i]);
                if (currentTree == null) {
                    throw new NotFoundException("path not found: " + filePath);
                }
            }

            // Get the file blob
            String fileName = pathParts[pathParts.length - 1];
            String blobHash = findBlobEntry(owner, repo, currentTree, fileName);
            if (blobHash == null) {
                throw new NotFoundException("file not found: " + filePath);
            }

            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            String content = new String(blobObj.content(), StandardCharsets.UTF_8);
            long size = blobObj.content().length;

            // Detect language for syntax highlighting
            String language = detectLanguage(fileName);

            return new FileContentResponse(
                    fileName,
                    filePath,
                    blobHash,
                    content,
                    size,
                    language,
                    commitHash
            );
        } catch (Exception e) {
            throw new NotFoundException("file not found: " + e.getMessage());
        }
    }

    private String findTreeEntry(String owner, String repo, String treeHash, String name) {
        try {
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                String[] parts = line.split("\t");
                if (parts.length >= 4 && parts[3].equals(name)) {
                    return parts[2]; // return hash
                }
            }
        } catch (Exception e) {
            // Entry not found
        }
        return null;
    }

    private String findBlobEntry(String owner, String repo, String treeHash, String name) {
        return findTreeEntry(owner, repo, treeHash, name);
    }

    private List<BlameEntry> calculateBlame(String owner, String repo, String commitHash, String filePath) {
        Map<Integer, BlameEntry> lineMap = new HashMap<>();

        // Walk commit history for this file
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(commitHash);

        while (!queue.isEmpty()) {
            String currentHash = queue.poll();
            if (visited.contains(currentHash)) continue;
            visited.add(currentHash);

            try {
                // Get commit info
                byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
                VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
                VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

                // Get author and timestamp
                String commitContent = new String(commitObj.content(), StandardCharsets.UTF_8);
                String author = extractHeader(commitContent, "author");
                String[] authorParts = author.split(" ");
                String authorName = String.join(" ", Arrays.copyOf(authorParts, authorParts.length - 1));

                // Get file content at this commit
                try {
                    FileContentResponse fileContent = getFileAtCommit(owner, repo, currentHash, filePath);
                    String[] lines = fileContent.getContent().split("\n", -1);

                    for (int i = 0; i < lines.length; i++) {
                        if (!lineMap.containsKey(i)) {
                            BlameEntry entry = new BlameEntry(
                                    currentHash.substring(0, 8),
                                    authorName,
                                    i + 1,
                                    lines[i]
                            );
                            lineMap.put(i, entry);
                        }
                    }
                } catch (NotFoundException e) {
                    // File didn't exist at this commit
                }

                // Add parents to queue
                queue.addAll(commitInfo.parents());
            } catch (Exception e) {
                // Skip problematic commits
            }
        }

        // Convert map to sorted list
        List<BlameEntry> blame = new ArrayList<>(lineMap.values());
        blame.sort(Comparator.comparingInt(BlameEntry::getLineNumber));

        return blame;
    }

    private List<CommitResponse> getCommitHistory(String owner, String repo, String commitHash, String path, int limit) {
        List<CommitResponse> history = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(commitHash);

        while (!queue.isEmpty() && history.size() < limit) {
            String currentHash = queue.poll();
            if (visited.contains(currentHash)) continue;
            visited.add(currentHash);

            try {
                byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
                VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
                VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

                String commitContent = new String(commitObj.content(), StandardCharsets.UTF_8);

                // Check if this commit affects the specified path
                if (path != null && !path.isEmpty()) {
                    boolean affectsPath = doesCommitAffectPath(owner, repo, currentHash, path);
                    if (!affectsPath) {
                        queue.addAll(commitInfo.parents());
                        continue;
                    }
                }

                CommitResponse response = new CommitResponse(
                        currentHash,
                        currentHash.substring(0, 8),
                        extractHeader(commitContent, "author"),
                        extractHeader(commitContent, "committer"),
                        extractMessage(commitContent),
                        commitInfo.parents()
                );

                history.add(response);

                queue.addAll(commitInfo.parents());
            } catch (Exception e) {
                // Skip
            }
        }

        return history;
    }

    private boolean doesCommitAffectPath(String owner, String repo, String commitHash, String path) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            // Try to find the file in this commit's tree
            String blobHash = findBlobEntry(owner, repo, commitInfo.tree(), path);
            return blobHash != null;
        } catch (Exception e) {
            return false;
        }
    }

    private List<TreeEntry> getTreeEntries(String owner, String repo, String commitHash, String path) {
        List<TreeEntry> entries = new ArrayList<>();

        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String currentTree = commitInfo.tree();

            // Navigate to subdirectory if path specified
            if (!path.isEmpty()) {
                String[] parts = path.split("/");
                for (String part : parts) {
                    currentTree = findTreeEntry(owner, repo, currentTree, part);
                    if (currentTree == null) {
                        throw new NotFoundException("directory not found: " + path);
                    }
                }
            }

            // Read tree entries
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, currentTree);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\t");
                if (parts.length >= 4) {
                    TreeEntry entry = new TreeEntry(
                            parts[3], // name
                            parts[1], // type (blob/tree)
                            parts[0], // mode
                            parts[2], // hash
                            path.isEmpty() ? parts[3] : path + "/" + parts[3]
                    );
                    entries.add(entry);
                }
            }
        } catch (Exception e) {
            throw new NotFoundException("tree not found: " + e.getMessage());
        }

        return entries;
    }

    private CompareResponse compareTrees(String owner, String repo, String baseHash, String headHash) {
        List<FileDiff> diffs = new ArrayList<>();

        try {
            // Get base tree
            byte[] baseCommitData = minioStorageService.getObjectBytes(owner, repo, baseHash);
            VicObjectFormat.ParsedObject baseCommitObj = VicObjectFormat.parseCompressed(baseCommitData);
            VicObjectFormat.CommitData baseCommitInfo = VicObjectFormat.parseCommitContent(baseCommitObj.content());

            // Get head tree
            byte[] headCommitData = minioStorageService.getObjectBytes(owner, repo, headHash);
            VicObjectFormat.ParsedObject headCommitObj = VicObjectFormat.parseCompressed(headCommitData);
            VicObjectFormat.CommitData headCommitInfo = VicObjectFormat.parseCommitContent(headCommitObj.content());

            // Get all files in base
            Map<String, String> baseFiles = getAllFiles(owner, repo, baseCommitInfo.tree(), "");

            // Get all files in head
            Map<String, String> headFiles = getAllFiles(owner, repo, headCommitInfo.tree(), "");

            // Compare files
            Set<String> allPaths = new HashSet<>();
            allPaths.addAll(baseFiles.keySet());
            allPaths.addAll(headFiles.keySet());

            for (String path : allPaths) {
                String baseFileHash = baseFiles.get(path);
                String headFileHash = headFiles.get(path);

                if (baseFileHash == null && headFileHash != null) {
                    // Added
                    diffs.add(new FileDiff(path, "added", null, headFileHash));
                } else if (baseFileHash != null && headFileHash == null) {
                    // Deleted
                    diffs.add(new FileDiff(path, "deleted", baseFileHash, null));
                } else if (!baseFileHash.equals(headFileHash)) {
                    // Modified
                    diffs.add(new FileDiff(path, "modified", baseFileHash, headFileHash));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("compare failed: " + e.getMessage());
        }

        return new CompareResponse(baseHash, headHash, diffs);
    }

    private Map<String, String> getAllFiles(String owner, String repo, String treeHash, String prefix) {
        Map<String, String> files = new HashMap<>();

        try {
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\t");
                if (parts.length >= 4) {
                    String name = parts[3];
                    String type = parts[1];
                    String hash = parts[2];
                    String fullPath = prefix.isEmpty() ? name : prefix + "/" + name;

                    if ("tree".equals(type)) {
                        files.putAll(getAllFiles(owner, repo, hash, fullPath));
                    } else {
                        files.put(fullPath, hash);
                    }
                }
            }
        } catch (Exception e) {
            // Skip
        }

        return files;
    }

    private String extractHeader(String content, String key) {
        for (String line : content.split("\n")) {
            if (line.startsWith(key + " ")) {
                return line.substring(key.length() + 1);
            }
        }
        return "";
    }

    private String extractMessage(String content) {
        String[] parts = content.split("\n\n", 2);
        return parts.length > 1 ? parts[1].trim() : "";
    }

    private String detectLanguage(String fileName) {
        if (fileName.endsWith(".java")) return "java";
        if (fileName.endsWith(".py")) return "python";
        if (fileName.endsWith(".js")) return "javascript";
        if (fileName.endsWith(".ts")) return "typescript";
        if (fileName.endsWith(".go")) return "go";
        if (fileName.endsWith(".xml")) return "xml";
        if (fileName.endsWith(".json")) return "json";
        if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) return "yaml";
        if (fileName.endsWith(".md")) return "markdown";
        if (fileName.endsWith(".html")) return "html";
        if (fileName.endsWith(".css")) return "css";
        if (fileName.endsWith(".sql")) return "sql";
        return "text";
    }

    // ─── Response DTOs ────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class FileContentResponse {
        private String name;
        private String path;
        private String sha;
        private String content;
        private long size;
        private String language;
        private String commitSha;

    }

    @Data
    @AllArgsConstructor
    public static class BlameEntry {
        private String commitSha;
        private String author;
        private int lineNumber;
        private String content;
    }

    @Data
    @AllArgsConstructor
    public static class CommitResponse {
        private String sha;
        private String shortSha;
        private String author;
        private String committer;
        private String message;
        private List<String> parents;


    }

    @AllArgsConstructor
    @Data
    public static class TreeEntry {
        private String name;
        private String type;
        private String mode;
        private String sha;
        private String path;

    }

    @Data
    @AllArgsConstructor
    public static class FileDiff {
        private String path;
        private String status;
        private String baseSha;
        private String headSha;


    }

    @Data
    @AllArgsConstructor
    public static class CompareResponse {
        private String baseCommit;
        private String headCommit;
        private List<FileDiff> files;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\ContributionController.java`

```java
package com.final_project.versioncontrolservice.controller;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.ContributionService;
import com.final_project.versioncontrolservice.service.RepoAccessRules;
import com.final_project.versioncontrolservice.service.RepositoryService;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/repos")
public class ContributionController {
    private final AuthService authService;
    private final ContributionService contributionService;
    private final RepositoryService vicRepositoryService;

    /**
     * Get contribution statistics for a repository
     * GET /repos/{owner}/{repo}/contributors
     */
    @GetMapping(value = "/{owner}/{repo}/contributors/{user}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ContributionService.ContributionStats> getContributors(
            @PathVariable String user,
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok( contributionService.getContributionStats(owner, repo, user));
    }

    /**
     * Get contribution graph for a user
     * GET /repos/{owner}/{repo}/contributors/{username}/graph
     */
    @GetMapping(value = "/{owner}/{repo}/contributors/{username}/graph", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ContributionService.ContributionGraph> getContributionGraph(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String username
    ) {
        return ResponseEntity.ok(contributionService.getContributionGraph(owner, repo, username));
    }

    /**
     * Get user activity feed
     * GET /users/{username}/activity
     */
    @GetMapping(value = "/{username}/activity", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ContributionService.ActivityEvent>> getUserActivity(
            @PathVariable String username,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(contributionService.getUserActivity(username, limit));
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\controller\AuthController.java`

```java
package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.dto.AuthResponse;
import com.final_project.versioncontrolservice.dto.LoginRequest;
import com.final_project.versioncontrolservice.dto.RefreshTokenRequest;
import com.final_project.versioncontrolservice.dto.SignupRequest;
import com.final_project.versioncontrolservice.service.AuthService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@AllArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping(path = "/auth/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> register(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping(path = "/auth/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
       return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping(path = "/auth/refresh", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest refreshToken) {
        log.info("Refresh Token: {}", refreshToken.getRefreshToken());
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }


}
```

## `src/main\java\com\final_project\versioncontrolservice\config\WebSocketConfig.java`

```java
package com.final_project.versioncontrolservice.config;


import com.final_project.versioncontrolservice.websocket.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to carry messages back to clients
        config.enableSimpleBroker(
                "/topic",     // For broadcast messages
                "/queue",     // For user-specific messages
                "/repo"       // For repository-specific events
        );

        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");

        // User-specific message prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new CustomHandshakeHandler())
                .addInterceptors(new AuthHandshakeInterceptor())
                .withSockJS(); // Fallback for browsers that don't support WebSocket

        // Additional endpoint for native WebSocket clients (like Go CLI)
        registry.addEndpoint("/ws/native")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new CustomHandshakeHandler());
    }

    /**
     * Custom handshake handler to assign unique session IDs
     */
    static class CustomHandshakeHandler extends DefaultHandshakeHandler {
        @Override
        protected Principal determineUser(
                org.springframework.http.server.ServerHttpRequest request,
                org.springframework.web.socket.WebSocketHandler wsHandler,
                Map<String, Object> attributes) {
            // Generate a unique principal for each connection
            return new StompPrincipal(UUID.randomUUID().toString());
        }
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\UserServiceClientConfig.java`

```java
package com.final_project.versioncontrolservice.config;

import org.simpleframework.xml.strategy.Strategy;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.oauth2.server.resource.web.reactive.function.client.ServletBearerExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class UserServiceClientConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder userWebClientBuilder () {
        return WebClient.builder();
    }



    @Bean(name = "userWebClient")
    public WebClient userWebClient (WebClient.Builder webClientBuilder) {
        ServletBearerExchangeFilterFunction oauth = new ServletBearerExchangeFilterFunction();
        return webClientBuilder
                .baseUrl("http://auth-service")
                .exchangeStrategies(ExchangeStrategies.builder().build())
                .filter(oauth)
                .codecs( configure ->
                        configure
                                .defaultCodecs()
                                .maxInMemorySize(10 * 1024 * 1024)

                )
                .clientConnector( new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(5))
                ))
                .build();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\StorageBootstrap.java`

```java

package  com.final_project.versioncontrolservice.config;
import com.final_project.versioncontrolservice.service.MinioStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class StorageBootstrap {

    private final MinioStorageService minioStorageService;

    public StorageBootstrap(MinioStorageService minioStorageService) {
        this.minioStorageService = minioStorageService;
    }

    @PostConstruct
    public void init() {
        minioStorageService.ensureBuckets();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\SecurityConfig.java`

```java
package com.final_project.versioncontrolservice.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Uncomment this to enable @PreAuthorize
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/actuator/**", "/swagger-ui/**", "/auth/login","/auth/refresh", "/auth/register").permitAll()
                        .anyRequest().authenticated() // Ensure requests MUST be authenticated
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        jwtDecoder.setJwtValidator(token -> {
            try {
                // This forces validation and helps us catch the error
                System.out.println("Validating token from issuer: " + token.getIssuer());
                return OAuth2TokenValidatorResult.success();
            } catch (Exception e) {
                System.err.println("JWT Validation Error: " + e.getMessage());
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", e.getMessage(), null));
            }
        });

        return jwtDecoder;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter defaultAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // 1. Get default SCOPE_ authorities (e.g., SCOPE_profile)
            Collection<GrantedAuthority> authorities = defaultAuthoritiesConverter.convert(jwt);

            // 2. Extract Realm Roles
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                authorities.addAll(roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .toList());
            }

            return authorities;
        });
        return converter;
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\MinioConfig.java`

```java
package com.final_project.versioncontrolservice.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Bean
    public MinioClient minioClient(
            @Value("${storage.minio.endpoint}") String endpoint,
            @Value("${storage.minio.access-key}") String accessKey,
            @Value("${storage.minio.secret-key}") String secretKey
    ) {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\MessagingTemplateConfig.java`

```java
package com.final_project.versioncontrolservice.config;


import org.springframework.context.annotation.Configuration;

@Configuration
public class MessagingTemplateConfig {
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\KafkaConfig.java`

```java
package com.final_project.versioncontrolservice.config;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }
    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

## `src/main\java\com\final_project\versioncontrolservice\config\AppProperties.java`

```java
package com.final_project.versioncontrolservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private Kafka kafka = new  Kafka();
    @Data
    public static class Kafka{
        private Topics topics = new  Topics();

        @Data
        public static class Topics{
            private String repositoryOperation = "repository.operations";
        }
    }
}
```


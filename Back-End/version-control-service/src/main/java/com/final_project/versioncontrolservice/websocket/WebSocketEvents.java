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

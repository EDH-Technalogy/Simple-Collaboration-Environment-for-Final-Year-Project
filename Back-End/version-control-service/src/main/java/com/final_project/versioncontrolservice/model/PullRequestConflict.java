package com.final_project.versioncontrolservice.model;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "pull_request_conflicts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
        private boolean binary;

        private String baseHash;
        private String sourceHash;
        private String targetHash;

        private List<FileSegment> segments;
        private boolean resolved;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileSegment {
        private String id;
        private int orderIndex;
        private SegmentType type;

        private String content;

        private Integer baseStartLine;
        private Integer baseEndLine;
        private Integer sourceStartLine;
        private Integer sourceEndLine;
        private Integer targetStartLine;
        private Integer targetEndLine;

        private String baseChunk;
        private String sourceChunk;
        private String targetChunk;

        private ConflictResolution resolution;
        private String resolvedChunk;
        private boolean resolved;
    }

    public enum SegmentType {
        PLAIN,
        CONFLICT
    }

    public enum ConflictResolution {
        SOURCE,
        TARGET,
        BOTH,
        CUSTOM
    }
}

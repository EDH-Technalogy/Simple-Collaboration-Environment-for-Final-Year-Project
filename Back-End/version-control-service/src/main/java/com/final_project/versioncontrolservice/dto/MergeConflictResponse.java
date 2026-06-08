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
        private boolean binary;
        private String baseHash;
        private String sourceHash;
        private String targetHash;
        private List<SegmentDTO> segments;
    }

    @Data
    @Builder
    public static class SegmentDTO {
        private String id;
        private int orderIndex;
        private String type;

        private String content;

        private Integer sourceStartLine;
        private Integer sourceEndLine;
        private Integer targetStartLine;
        private Integer targetEndLine;

        private String baseChunk;
        private String sourceChunk;
        private String targetChunk;

        private boolean resolved;
        private String resolvedChunk;
        private String resolution;
    }
}

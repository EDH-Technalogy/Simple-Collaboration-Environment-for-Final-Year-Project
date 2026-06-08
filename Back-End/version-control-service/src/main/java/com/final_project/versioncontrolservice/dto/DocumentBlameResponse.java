package com.final_project.versioncontrolservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentBlameResponse {
    private String path;
    private String ref;
    private String commitSha;
    private String mode;
    private String fileType;
    private List<DocumentBlameSegment> segments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentBlameSegment {
        private String id;
        private String kind;
        private String text;
        private String stableHash;
        private Integer page;
        private Integer orderIndex;
        private String location;
        private String changeType;
        private String previousText;
        private String commitSha;
        private String shortSha;
        private String author;
        private String message;
        private String timestamp;
    }
}

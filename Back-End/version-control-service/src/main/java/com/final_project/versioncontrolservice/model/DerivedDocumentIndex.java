package com.final_project.versioncontrolservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "derived_document_index")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DerivedDocumentIndex {

    @Id
    private String id;

    private String ownerUsername;
    private String repositoryName;
    private String branch;
    private String path;
    private String fileName;
    private String blobHash;
    private String commitHash;
    private String fileType;
    private Integer extractionVersion;
    private Instant indexedAt;
    private List<DocumentSegment> segments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentSegment {
        private String id;
        private String kind;
        private String text;
        private String stableHash;
        private Integer page;
        private Integer orderIndex;
        private String location;
    }
}

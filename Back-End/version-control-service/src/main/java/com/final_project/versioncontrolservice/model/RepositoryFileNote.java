package com.final_project.versioncontrolservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "repository_file_notes")
public class RepositoryFileNote {
    @Id
    private String id;

    private String repositoryId;
    private String ownerUsername;
    private String repositoryName;
    private String branch;
    private String filePath;

    private String selectedText;
    private Integer startOffset;
    private Integer endOffset;
    private String body;

    private String authorId;
    private String authorName;
    private String authorProfile;

    private Boolean resolved;
    private LocalDateTime resolvedAt;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

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
    private String fileKind;
    private boolean binary;
    private String derivedDocumentId;
    private boolean deleted;
    private Instant indexedAt;
}

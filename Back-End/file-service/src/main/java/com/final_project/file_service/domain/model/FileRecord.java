package com.final_project.file_service.domain.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@AllArgsConstructor
@Document(collection = "file_record")
public class FileRecord {
    @Id
    private String id;
    private String fileName;

    private String bucket;
    private String objectKey;

    private String ownerId;
    private OwnerType ownerType;
    private FileCategory category;
    private String subFolder;
    private Instant uploadedAt;
}

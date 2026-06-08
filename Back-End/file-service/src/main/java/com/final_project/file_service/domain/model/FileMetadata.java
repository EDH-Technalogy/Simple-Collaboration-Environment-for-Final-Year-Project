package com.final_project.file_service.domain.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;


@Data
public  class FileMetadata {
    private String id = UUID.randomUUID().toString();
    private final String fileName;
    private final String contentType;
    private final Instant uploadedAt = Instant.now();
    private final  String ownerId;
    private final OwnerType ownerType;
    private final FileCategory category;
    private final String subFolder;

    public FileMetadata(String fileName, String contentType,
                        String ownerId, OwnerType ownerType,
                        FileCategory category, String subFolder) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.ownerId = ownerId;
        this.ownerType = ownerType;
        this.category = category;
        this.subFolder = subFolder;
    }
}

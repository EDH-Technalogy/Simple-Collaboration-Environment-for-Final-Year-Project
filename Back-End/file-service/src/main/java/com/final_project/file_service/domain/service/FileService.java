package com.final_project.file_service.domain.service;

import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.ports.BucketStrategy;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.repo.FileRecordRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.Instant;

@Service
@AllArgsConstructor
public class FileService {
    @Qualifier("fileStoragePort")
    private final FileStoragePort storage;
    @Qualifier("bucketStrategy")
    private final BucketStrategy strategy;

    private final FileRecordService fileRecordService;
    public String upload(FileMetadata metadata, InputStream stream) {
        FileRecord record = uploadRecord(metadata, stream);
        return storage.generatePresignedUrl(record.getBucket(), record.getObjectKey());
    }

    public FileRecord uploadRecord(FileMetadata metadata, InputStream stream) {
        String bucket = strategy.resolveBucket(metadata);
        String key = strategy.resolveKey(metadata);
        FileRecord record = new FileRecord(
                null,
                metadata.getFileName(),
                bucket,
                key,
                metadata.getOwnerId(),
                metadata.getOwnerType(),
                metadata.getCategory(),
                metadata.getSubFolder(),
                Instant.now()
        );
        FileRecord saved = fileRecordService.add(record);
        storage.upload(bucket, key, stream, metadata.getContentType());
        return saved;
    }
    public InputStream download(FileMetadata metadata) {
        return storage.download(
                strategy.resolveBucket(metadata),
                strategy.resolveKey(metadata)
        );
    }

    public void delete(FileMetadata metadata) {
        storage.delete(
                strategy.resolveBucket(metadata),
                strategy.resolveKey(metadata)
        );
    }
}

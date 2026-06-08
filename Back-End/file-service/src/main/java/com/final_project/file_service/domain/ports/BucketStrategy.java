package com.final_project.file_service.domain.ports;

import com.final_project.file_service.domain.model.FileMetadata;

public interface BucketStrategy {
    String resolveBucket(FileMetadata fileMetadata);
    String resolveKey(FileMetadata fileMetadata);
}

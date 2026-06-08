package com.final_project.file_service.domain.repo;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FileRecordRepository extends MongoRepository<FileRecord, String > {
    Optional<FileRecord> findFirstByOwnerIdAndCategory(String ownerId, FileCategory category);
    Optional<FileRecord> findFirstByOwnerIdAndSubFolder(String ownerId, String subFolder);
    Optional<List<FileRecord>> findAllByOwnerIdAndSubFolder(String ownerId, String subFolder);
    Optional<FileRecord> findByFileNameAndOwnerId(String fileName,String ownerId);
    Optional<FileRecord> findByIdAndOwnerIdAndCategory(String fileId,String ownerId,FileCategory category);
    Optional<FileRecord> findFirstByOwnerIdAndCategoryOrderByUploadedAtDesc(String ownerId, FileCategory category);
}

package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.DerivedDocumentIndex;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DerivedDocumentIndexRepository extends MongoRepository<DerivedDocumentIndex, String> {

    void deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
            String ownerUsername,
            String repositoryName,
            String branch
    );

    Optional<DerivedDocumentIndex>
    findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndPathAndBlobHash(
            String ownerUsername,
            String repositoryName,
            String branch,
            String path,
            String blobHash
    );

    Optional<DerivedDocumentIndex>
    findFirstByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndCommitHashAndPathAndBlobHashAndExtractionVersionOrderByIndexedAtDesc(
            String ownerUsername,
            String repositoryName,
            String commitHash,
            String path,
            String blobHash,
            Integer extractionVersion
    );
}

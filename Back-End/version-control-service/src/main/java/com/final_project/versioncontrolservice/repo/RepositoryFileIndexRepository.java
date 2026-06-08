package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RepositoryFileIndexRepository
        extends MongoRepository<RepositoryFileIndex, String> {

    List<RepositoryFileIndex>
    findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndDeletedFalse(
            String ownerUsername,
            String repositoryName,
            String branch
    );

    Optional<RepositoryFileIndex>
    findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndPathAndDeletedFalse(
            String ownerUsername,
            String repositoryName,
            String branch,
            String path
    );

    void deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
            String ownerUsername,
            String repositoryName,
            String branch
    );
}
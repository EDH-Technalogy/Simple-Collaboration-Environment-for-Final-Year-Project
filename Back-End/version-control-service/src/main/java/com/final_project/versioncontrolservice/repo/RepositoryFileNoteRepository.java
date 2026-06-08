package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.RepositoryFileNote;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RepositoryFileNoteRepository extends MongoRepository<RepositoryFileNote, String> {
    List<RepositoryFileNote> findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndFilePathAndDeletedFalseOrderByStartOffsetAscCreatedAtAsc(
            String ownerUsername,
            String repositoryName,
            String branch,
            String filePath
    );

    Optional<RepositoryFileNote> findByIdAndOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndDeletedFalse(
            String id,
            String ownerUsername,
            String repositoryName
    );
}

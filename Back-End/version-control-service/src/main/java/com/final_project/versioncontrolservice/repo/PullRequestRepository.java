package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.dto.PullRequestUser;
import com.final_project.versioncontrolservice.model.PullRequest;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PullRequestRepository extends MongoRepository<PullRequest, String> {

    List<PullRequest> findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
            String repoOwnerUsername,
            String repoName
    );

    Optional<PullRequest> findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
            String id,
            String repoOwnerUsername,
            String repoName
    );
}

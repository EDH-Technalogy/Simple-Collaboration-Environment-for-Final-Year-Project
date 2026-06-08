package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.PullRequestConflict;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PullRequestConflictRepository extends MongoRepository<PullRequestConflict, String> {

    Optional<PullRequestConflict> findByPullRequestIdAndResolvedFalse(String pullRequestId);

    void deleteByPullRequestId(String pullRequestId);
}
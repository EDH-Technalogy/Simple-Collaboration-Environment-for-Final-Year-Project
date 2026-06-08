package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.Milestone;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends MongoRepository<Milestone, String> {
    List<Milestone> findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String username,
            String repoName
    );

    Optional<Milestone> findByRepoOwner_UserNameAndRepoNameAndNumber(
            String username,
            String repoName,
            Integer number
    );

    List<Milestone> findByRepoOwner_UserNameAndRepoNameAndStatus(
            String username,
            String repoName,
            String status
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1}", count = true)
    long countByRepo(String username, String repoName);

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'status': 'open'}", count = true)
    long countOpenByRepo(String username, String repoName);

    Optional<Milestone> findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String username,
            String repoName
    );

}

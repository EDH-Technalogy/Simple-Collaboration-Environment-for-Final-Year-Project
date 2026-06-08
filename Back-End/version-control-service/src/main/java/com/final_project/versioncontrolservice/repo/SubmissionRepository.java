package com.final_project.versioncontrolservice.repo;


import com.final_project.versioncontrolservice.model.Submission;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, ObjectId> {

    List<Submission> findByTaskIdOrderBySubmittedAtDesc(String taskId);

    Optional<Submission> findTopByTaskIdAndSubmittedByOrderBySubmittedAtDesc(
            String taskId, String submittedBy);

    List<Submission> findBySubmittedByOrderBySubmittedAtDesc(String submittedBy);

    long countByTaskIdAndStatus(String taskId, String status);

    List<Submission> findByPullRequestId(String pullRequestId);
}


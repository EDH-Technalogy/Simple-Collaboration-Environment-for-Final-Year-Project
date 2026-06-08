package com.final_project.versioncontrolservice.repo;

import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.model.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String repoOwner,
            String repoName
    );

    Optional<Task> findByRepoOwner_UserNameAndRepoNameAndNumberOrderByNumber(
            String repoOwner,
            String repoName,
            Integer number
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndMilestoneId(
            String repoOwner,
            String repoName,
            String milestoneId
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndAssignedTo_UserName(
            String repoOwner,
            String repoName,
            String assignedTo
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndStatus(
            String repoOwner,
            String repoName,
            TaskStatus status
    );

    List<Task> findByRepoOwner_UserNameAndRepoNameAndAssignedTo_UserNameAndStatus(
            String repoOwner,
            String repoName,
            String assignedTo,
            TaskStatus status
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'milestone_id': ?2}", count = true)
    long countByMilestone(
            String repoOwner,
            String repoName,
            String milestoneId
    );

    @Query(value = "{'repo_owner.username': ?0, 'repo_name': ?1, 'milestone_id': ?2, 'status': ?3}", count = true)
    long countByMilestoneAndStatus(
            String repoOwner,
            String repoName,
            String milestoneId,
            TaskStatus status
    );

    Optional<Task> findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
            String repoOwner,
            String repoName
    );

    @Query("{'repo_owner.username': ?0, 'repo_name': ?1, '$text': {'$search': ?2}}")
    List<Task> searchTasks(
            String repoOwner,
            String repoName,
            String searchTerm
    );

        List<Task> findByLinkedPrId(String linkedPrId);

    @Query("{'due_date': {'$gt': ?0, '$lte': ?1}, 'status': {'$nin': ['COMPLETED', 'CANCELLED']}, 'assigned_to': {'$ne': null}}")
    List<Task> findDeadlineReminderCandidates(Instant now, Instant upperBound);
}

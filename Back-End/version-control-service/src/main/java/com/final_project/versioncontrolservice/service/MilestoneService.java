package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.MilestoneRepository;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MilestoneService {

    private final AuthService authService;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final RepositoryService vicRepositoryService;
    private final KafkaProducer kafkaProducer;
    /**
     * Create a new milestone
     */
    public MilestoneResponse createMilestone(String owner, String repo,
                                             MilestoneRequest request, String username) {
        validateMilestoneRequest(request);
        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser == null) {
            throw new NotFoundException("There is not such uers");
        }
        UserDTO creatorUser = authService.getUserByUsername(username);
        if  (creatorUser == null) {
            throw new NotFoundException("User not found");
        }
        // Validate permissions

        RepositoryDocument meta = vicRepositoryService.loadMeta(ownerUser.getUsername(), repo);
        if (!canManageTaskPlanning(meta, creatorUser)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException(
                    "Only repository owners, admins, or teachers can create milestones"
            );
        }


        // Generate milestone number
        int number = getNextMilestoneNumber(owner, repo);

        Milestone milestone = Milestone.builder()
                .repoOwner(MilestoneTaskUser
                        .builder()
                        .userId(ownerUser.getId())
                        .email(ownerUser.getEmail())
                        .profile(ownerUser.getProfile())
                        .firstName(ownerUser.getFirstName())
                        .userName(ownerUser.getUsername())
                        .build())
                .repoName(repo)
                .number(number)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(username)
                .status("open")


                // Academic fields
                .maxScore(request.getMaxScore())
                .passingScore(request.getPassingScore())
                .rubric(request.getRubric())
                .requiredTasks(request.getRequiredTasks())
                .completionPercentage(0.0)

                // Optional: initialize stats explicitly (good practice)
                .totalTasks(0)
                .openTasks(0)
                .completedTasks(0)
                .inProgressTasks(0)

                .build();
       Milestone saved =  milestoneRepository.save(milestone);

       return MilestoneResponse.fromDocument(saved);
    }

    /**
     * Update milestone progress based on task completion
     */
    public void updateMilestoneProgress(String owner, String repo, String  milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new NotFoundException("milestone not found"));
        applyMilestoneStats(owner, repo, milestone, true);
    }

    private boolean canManageTaskPlanning(RepositoryDocument meta, UserDTO user) {
        String username = user == null ? "" : user.getUsername();
        if (RepoAccessRules.canAdmin(meta, username)) {
            return true;
        }
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream()
                .map(role -> role == null ? "" : role.trim().toLowerCase())
                .anyMatch(role -> role.equals("teacher") || role.equals("admin"));
    }

    private void applyMilestoneStats(String owner, String repo, Milestone milestone, boolean persist) {
        String milestoneId = milestone.getId();

        // Count tasks by status
        long totalTasks = taskRepository.countByMilestone(owner, repo, milestoneId);
        long completedTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.COMPLETED);
        long inProgressTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.PROGRESS);
        long openTasks = taskRepository.countByMilestoneAndStatus(owner, repo, milestoneId, TaskStatus.OPEN);

        milestone.setTotalTasks((int) totalTasks);
        milestone.setCompletedTasks((int) completedTasks);
        milestone.setInProgressTasks((int) inProgressTasks);
        milestone.setOpenTasks((int) openTasks);

        // Calculate completion percentage
        if (totalTasks > 0) {
            double percentage = ((double) completedTasks / totalTasks) * 100.0;
            milestone.setCompletionPercentage(Math.round(percentage * 100.0) / 100.0);
        } else {
            milestone.setCompletionPercentage(0.0);
        }

        boolean requiredTasksSatisfied = milestone.getRequiredTasks() != null
                && milestone.getRequiredTasks() > 0
                && completedTasks >= milestone.getRequiredTasks();
        boolean allTasksCompleted = totalTasks > 0 && completedTasks >= totalTasks;

        if ((requiredTasksSatisfied || allTasksCompleted)
                && !"closed".equalsIgnoreCase(String.valueOf(milestone.getStatus()))) {
            milestone.setStatus("closed");
            milestone.setClosedAt(Instant.now());
        }

        if (persist) {
            milestone.setUpdatedAt(Instant.now());
            milestoneRepository.save(milestone);
        }
    }

    /**
     * Get milestones with detailed progress
     */
    public List<MilestoneResponse> getMilestones(String owner, String repo) {
        List<Milestone> milestones = milestoneRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo);

        return milestones.stream()
                .map(m -> {
                    applyMilestoneStats(owner, repo, m, false);
                    MilestoneResponse response = MilestoneResponse.fromDocument(m);

                    // Get tasks for this milestone
                    List<Task> tasks = taskRepository
                            .findByRepoOwner_UserNameAndRepoNameAndMilestoneId(owner, repo, m.getId());
                    response.setTasks(tasks.stream()
                            .map(TaskResponse::fromDocument)
                            .collect(Collectors.toList()));

                    return response;
                })
                .collect(Collectors.toList());
    }

    public MilestoneResponse updateMilestone(
            String owner,
            String repo,
            int number,
            MilestoneRequest request
    ) {
        validateMilestoneRequest(request);
        Milestone milestone = milestoneRepository
                .findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("milestone #" + number + " not found"));

        if (request.getTitle() != null) {
            milestone.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            milestone.setDescription(request.getDescription());
        }

        if (request.getDueDate() != null) {
            milestone.setDueDate(request.getDueDate());
        }

        if (request.getMaxScore() != null) {
            milestone.setMaxScore(request.getMaxScore());
        }

        if (request.getPassingScore() != null) {
            milestone.setPassingScore(request.getPassingScore());
        }

        if (request.getRubric() != null) {
            milestone.setRubric(request.getRubric());
        }

        if (request.getRequiredTasks() != null) {
            milestone.setRequiredTasks(request.getRequiredTasks());
        }

        milestone.setUpdatedAt(Instant.now());

        Milestone saved = milestoneRepository.save(milestone);
        applyMilestoneStats(owner, repo, saved, true);
        return MilestoneResponse.fromDocument(saved);
    }
    /**
     * Get milestone by number
     */
    public Milestone getMilestone(String owner, String repo, int number) {
        Milestone milestone = milestoneRepository.findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("milestone #" + number + " not found"));
        applyMilestoneStats(owner, repo, milestone, false);
        return milestone;
    }
    /**
     * Close a milestone
     */
    public MilestoneResponse closeMilestone(String owner, String repo, int number, String username) {
        Milestone milestone = getMilestone(owner, repo, number);
        if (!Objects.equals(normalizeUsername(milestone.getCreatedBy()), normalizeUsername(username))) {
            throw new ForbiddenException("only the milestone creator can close milestones");
        }

        milestone.setStatus("closed");
        milestone.setClosedAt(Instant.now());
        milestone.setUpdatedAt(Instant.now());

        Milestone saved =  milestoneRepository.save(milestone);
        return MilestoneResponse.fromDocument(saved);
    }


    /**
     * Reopen a milestone
     */
    public MilestoneResponse reopenMilestone(String owner, String repo, int number, String username) {
        Milestone milestone = getMilestone(owner, repo, number);
        if (!Objects.equals(normalizeUsername(milestone.getCreatedBy()), normalizeUsername(username))) {
            throw new ForbiddenException("only the milestone creator can reopen milestones");
        }

        milestone.setStatus("open");
        milestone.setClosedAt(null);
        milestone.setUpdatedAt(Instant.now());

        Milestone result =  milestoneRepository.save(milestone);
        return MilestoneResponse.fromDocument(result);
    }

    private int getNextMilestoneNumber(String owner, String repo) {
        return milestoneRepository.findTopByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .map(m -> m.getNumber() + 1)
                .orElse(1);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MilestoneRequest {
        private String title;
        private String description;
        private Instant dueDate;
        private Integer maxScore;
        private Integer passingScore;
        private String rubric;
        private Integer requiredTasks;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MilestoneResponse {
        private String id;
        private int number;
        private String title;
        private String description;
        private Instant dueDate;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant closedAt;
        private String createdBy;
        private String status;
        private Integer maxScore;
        private Integer passingScore;
        private String rubric;
        private Integer requiredTasks;
        private Double completionPercentage;
        private Integer totalTasks;
        private Integer openTasks;
        private Integer completedTasks;
        private Integer inProgressTasks;
        private List<TaskResponse> tasks;

        public static MilestoneResponse fromDocument(Milestone doc) {
            MilestoneResponse response = new MilestoneResponse();
            response.setId(doc.getId());
            response.setNumber(doc.getNumber());
            response.setTitle(doc.getTitle());
            response.setDescription(doc.getDescription());
            response.setDueDate(doc.getDueDate());
            response.setCreatedAt(doc.getCreatedAt());
            response.setUpdatedAt(doc.getUpdatedAt());
            response.setClosedAt(doc.getClosedAt());
            response.setCreatedBy(doc.getCreatedBy());
            response.setStatus(doc.getStatus());
            response.setMaxScore(doc.getMaxScore());
            response.setPassingScore(doc.getPassingScore());
            response.setRubric(doc.getRubric());
            response.setRequiredTasks(doc.getRequiredTasks());
            response.setCompletionPercentage(doc.getCompletionPercentage());
            response.setTotalTasks(doc.getTotalTasks());
            response.setOpenTasks(doc.getOpenTasks());
            response.setCompletedTasks(doc.getCompletedTasks());
            response.setInProgressTasks(doc.getInProgressTasks());
            return response;
        }

    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TaskResponse {
        private String id;
        private int number;
        private String title;
        private String description;
        private String createdBy;
        private MilestoneTaskUser assignedTo;
        private String status;
        private String priority;
        private List<String> labels;
        private Instant dueDate;
        private Integer maxScore;
        private Integer earnedScore;
        private Integer milestoneNumber;
        private Instant completedAt;
        private String reviewedBy;
        private String reviewComments;
        private String submissionUrl;
        private String submissionBranch;
        private String linkedPrId;
        private List<Task.RequirementCheck> requirementsChecklist;
        private Integer commentsCount;

        public static TaskResponse fromDocument(Task doc) {
            TaskResponse response = new TaskResponse();
            response.setId(doc.getId());
            response.setNumber(doc.getNumber());
            response.setTitle(doc.getTitle());
            response.setDescription(doc.getDescription());
            response.setCreatedBy(doc.getCreatedBy());
            response.setAssignedTo(doc.getAssignedTo());
            response.setStatus(doc.getStatus().getStatus());
            response.setPriority(doc.getPriority().value());
            response.setLabels(doc.getLabels().stream().map(String::valueOf).collect(Collectors.toList()));
            response.setDueDate(doc.getDueDate());
            response.setMaxScore(doc.getMaxScore());
            response.setEarnedScore(doc.getEarnedScore());
            response.setMilestoneNumber(doc.getMilestoneNumber());
            response.setCompletedAt(doc.getCompletedAt());
            response.setReviewedBy(doc.getReviewedBy());
            response.setReviewComments(doc.getReviewComments());
            response.setSubmissionUrl(doc.getSubmissionUrl());
            response.setSubmissionBranch(doc.getSubmissionBranch());
            response.setLinkedPrId(doc.getLinkedPrId());
            response.setRequirementsChecklist(doc.getRequirementsChecklist());
            response.setCommentsCount(doc.getCommentsCount());
            return response;
        }


    }

    private String normalizeUsername(String username) {
        return String.valueOf(username == null ? "" : username).trim().toLowerCase(Locale.ROOT);
    }

    private void validateMilestoneRequest(MilestoneRequest request) {
        if (request == null) {
            return;
        }
        Integer maxScore = request.getMaxScore();
        Integer passingScore = request.getPassingScore();
        Integer requiredTasks = request.getRequiredTasks();

        if (maxScore != null && maxScore < 0) {
            throw new BadRequestException("milestone max score cannot be negative");
        }
        if (passingScore != null && passingScore < 0) {
            throw new BadRequestException("milestone passing score cannot be negative");
        }
        if (maxScore != null && passingScore != null && passingScore > maxScore) {
            throw new BadRequestException("milestone passing score cannot exceed the milestone max score");
        }
        if (requiredTasks != null && requiredTasks < 0) {
            throw new BadRequestException("milestone required tasks cannot be negative");
        }
    }
}

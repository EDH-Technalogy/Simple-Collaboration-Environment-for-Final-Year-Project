package com.final_project.versioncontrolservice.service;


import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.MilestoneTaskUser;
import com.final_project.versioncontrolservice.dto.PullRequestResponse;
import com.final_project.versioncontrolservice.dto.SubmissionResponse;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.repo.*;
import com.final_project.versioncontrolservice.websocket.WebSocketEvents;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
@AllArgsConstructor
@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskCommentRepository commentRepository;
    private final SubmissionRepository submissionRepository;
    private final PullRequestRepository pullRequestRepository;
    private final RepositoryService vicRepositoryService;
    private final MilestoneService milestoneService;
    private final PullRequestMergeService pullRequestMergeService;
    private final WebSocketNotificationService notificationService;
    private final AuthService authService;
    private final KafkaProducer kafkaProducer;
    private final AppProperties appProperties;
    /**
     * Create a new task (with optional milestone assignment)
     */
    public MilestoneService.TaskResponse createTask(String owner, String repo, TaskRequest request, ContributorUser creatorUser) {
        validateTaskRequest(request);

        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser == null) {
            throw new NotFoundException("User Not Found");
        }
        String creatorUsername = creatorUser == null ? "" : creatorUser.getUsername();
        UserDTO repoUser = authService.getUserByUsername(creatorUsername);
        if (repoUser == null) {
            throw new NotFoundException("Repo User Not Found");
        }



        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (!canManageTaskPlanning(meta, creatorUser)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException(
                    "Only repository owners, admins, or teachers can create tasks"
            );
        }
        int number = getNextTaskNumber(owner, repo);
        Milestone milestone = null;
        if (request.getMilestoneNumber() != null) {
            milestone = milestoneRepository
                    .findByRepoOwner_UserNameAndRepoNameAndNumber(owner, repo, request.getMilestoneNumber())
                    .orElseThrow(() -> new NotFoundException("milestone #" + request.getMilestoneNumber() + " not found"));
        }
        Integer resolvedMaxScore = resolveTaskMaxScore(owner, repo, request, milestone);

        Task task = Task.builder()
                .priority(request.getPriority())
                .status(TaskStatus.OPEN)
                .repoName(meta.getRepositoryName())
                .assignedAt(Instant.now())
                .createdAt(Instant.now())
                .number(number)
                .repoOwner(MilestoneTaskUser
                        .builder()
                        .email(ownerUser.getEmail())
                        .firstName(ownerUser.getFirstName())
                        .userId(ownerUser.getId())
                        .userName(ownerUser.getUsername())
                        .profile(ownerUser.getProfile())
                        .build())
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(repoUser.getUsername())
                .updatedAt(Instant.now())
                .labels(request.getLabels())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .maxScore(resolvedMaxScore)
                .build();
        if (request.getRequirements() != null) {
            task.setRequirementsChecklist(
                    request.getRequirements()
                            .stream()
                            .map(req -> {
                                Task.RequirementCheck check = new Task.RequirementCheck();
                                check.setRequirement(req);
                                check.setCompleted(false);
                                return check;
                            })
                            .collect(Collectors.toList())
            );
        }
        if (milestone != null) {
            task.setMilestoneId(milestone.getId());
            task.setMilestoneNumber(milestone.getNumber());
        }


        Task saved = taskRepository.save(task);

        if (saved.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, saved.getMilestoneId());
        }

        // Send notification
//        sendTaskNotification(owner, repo, saved, "created", creatorUsername);

        return MilestoneService.TaskResponse.fromDocument(saved);
    }

    /**
     * Assign task to a user
     */
    public MilestoneService.TaskResponse assignTask(String owner, String repo, int taskNumber,
                                   String assignee, ContributorUser assignedByContributor) {
        String assignedBy = assignedByContributor == null ? "" : assignedByContributor.getUsername();
        UserDTO assigneeUser = authService.getUserByUsername(assignee);
        if (assigneeUser == null) {
            throw new NotFoundException("User Not Found");
        }

        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("Repo User Not Found");
        }

        UserDTO assignedByUser = authService.getUserByUsername(assignedBy);
        if (assignedByUser == null) {
            throw new NotFoundException("User Not Found");
        }

        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        Task task = getTask(owner, repo, taskNumber);
        ensureCanAssignTask(meta, task, assignedByContributor, "Only task creators, repository admins, teachers, or admins can assign contributors");
        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new BadRequestException("Completed tasks cannot be reassigned");
        }
        ensureAcceptedCollaborator(meta, assignee, "Tasks can only be assigned to accepted repository contributors");
        task.setAssignedTo(
                MilestoneTaskUser.builder()
                        .email(assigneeUser.getEmail())
                        .firstName(assigneeUser.getFirstName())
                        .userId(assigneeUser.getId())
                        .userName(assigneeUser.getUsername())
                        .profile(assigneeUser.getProfile())
                        .build()
        );

        task.setAssignedAt(Instant.now());
        task.setStatus(TaskStatus.PROGRESS);
        task.setUpdatedAt(Instant.now());
        Task updated = taskRepository.save(task);

        // Update milestone if task belongs to one
        if (task.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, task.getMilestoneId());
        }

        publishTaskAssignedEvent(owner, repo, updated, assignedByUser, assigneeUser, repoOwner);

        return MilestoneService.TaskResponse.fromDocument(updated);
    }

    /**
     * Submit work for a task
     */
    public SubmissionResponse submitTask(String owner, String repo, int taskNumber,
                                         SubmissionRequest request, String username) {
        UserDTO user = authService.getUserByUsername(username);
        if (user == null) {
            throw new NotFoundException("User Not Found");
        }
        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("Repo User Not Found");
        }

        Task task = getTask(owner, repo, taskNumber);
        ensureAssignedUser(task, username, "Only the assigned contributor can submit task work");
        ResolvedSubmissionPayload resolved = resolveSubmissionPayload(owner, repo, task, request, username);
        Submission submission = Submission
                .builder()
                .taskId(task.getId())
                .submittedBy(
                        MilestoneTaskUser
                                .builder()
                                .profile(user.getProfile())
                                .userName(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .userId(user.getId())
                                .build()
                )
                .submittedAt(Instant.now())
                .description(request.getDescription())
                .branchName(resolved.branchName())
                .commitHash(resolved.commitHash())
                .pullRequestUrl(resolved.pullRequestUrl())
                .pullRequestId(resolved.pullRequestId())
                .files(resolved.files()).status("submitted")
                .revisionCount(0)
                        .build();
        // Update task status

        task.setStatus(TaskStatus.REVIEW);
        task.setSubmissionUrl(resolved.pullRequestUrl());
        task.setSubmissionBranch(resolved.branchName());
        task.setSubmissionCommit(resolved.commitHash());
        task.setLinkedPrId(resolved.pullRequestId());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        Submission saved = submissionRepository.save(submission);
        publishTaskSubmittedEvent(owner, repo, task, user, repoOwner);
        return SubmissionResponse.from(saved);
    }

    /**
     * Review/grading a task submission
     */
    public MilestoneService.TaskResponse reviewTask(String owner, String repo, int taskNumber,
                                                    ReviewRequest request, ContributorUser reviewerUser) {
        Task task = getTask(owner, repo, taskNumber);
        ReviewRequest review = request == null ? new ReviewRequest(null, null, false, List.of()) : request;
        String reviewer = reviewerUser == null ? "" : reviewerUser.getUsername();


        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (!RepoAccessRules.canAdmin(meta, reviewer) && !hasTaskOverviewRole(reviewerUser) && !isTaskCreator(task, reviewer)) {
            throw new ForbiddenException("only repository admins, teachers, or admins can review/grading tasks");
        }
        if (isTaskAssignee(task, reviewer)) {
            throw new ForbiddenException("Assigned contributors cannot review their own task submission");
        }

        // Create review comment
        TaskComment comment = new TaskComment();
        comment.setTaskId(task.getId());
        comment.setRepoOwner(owner);
        comment.setRepoName(repo);
        comment.setAuthor(reviewer);
        comment.setBody(review.getFeedback());
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        comment.setReview(true);
        Integer reviewScore = normalizeCompletedTaskScore(
                task,
                review.getScore(),
                review.isApproved()
        );
        comment.setReviewScore(reviewScore);
        commentRepository.save(comment);

        // Update task
        task.setReviewedBy(reviewer);
        task.setReviewedAt(Instant.now());
        task.setReviewComments(review.getFeedback());
        task.setEarnedScore(reviewScore);

        if (review.isApproved()) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(Instant.now());
        } else {
            task.setStatus(TaskStatus.PROGRESS);  // Back to in_progress for revisions
            task.setCompletedAt(null);
        }

        task.setUpdatedAt(Instant.now());
        task.setCommentsCount((int) commentRepository.countByTaskId(task.getId()));

        Task updated = taskRepository.save(task);

        // Update milestone progress
        if (task.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, task.getMilestoneId());
        }

        if (review.isApproved()) {
            publishTaskCompletedEvent(owner, repo, updated, reviewer);
        }
        return MilestoneService.TaskResponse.fromDocument(updated);
    }

    public MilestoneService.TaskResponse completeTask(
            String owner,
            String repo,
            int taskNumber,
            CompleteTaskRequest request,
            String reviewer
    ) {
        Task task = getTask(owner, repo, taskNumber);

        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        if (meta == null) {
            throw new NotFoundException("Repository not found");
        }

        if (!RepoAccessRules.canAdmin(meta, reviewer)) {
            throw new ForbiddenException("Only admins can complete tasks");
        }

        if (task.getStatus() == TaskStatus.COMPLETED) {
            return MilestoneService.TaskResponse.fromDocument(task);
        }

        if (task.getStatus() == TaskStatus.CANCELLED) {
            throw new BadRequestException("Cancelled task cannot be completed");
        }

        if (request != null && request.getPullRequestId() != null && !request.getPullRequestId().isBlank()) {
            validatePullRequestForTaskCompletion(owner, repo, task, request.getPullRequestId());
        }

        TaskComment comment = new TaskComment();
        comment.setTaskId(task.getId());
        comment.setRepoOwner(owner);
        comment.setRepoName(repo);
        comment.setAuthor(reviewer);
        comment.setBody(request == null ? null : request.getFeedback());
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        comment.setReview(true);
        Integer reviewScore = normalizeCompletedTaskScore(
                task,
                request == null ? null : request.getScore(),
                true
        );
        comment.setReviewScore(reviewScore);
        commentRepository.save(comment);

        task.setReviewedBy(reviewer);
        task.setReviewedAt(Instant.now());
        task.setReviewComments(request == null ? null : request.getFeedback());
        task.setEarnedScore(reviewScore);

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(Instant.now());
        task.setUpdatedAt(Instant.now());
        task.setCommentsCount((int) commentRepository.countByTaskId(task.getId()));

        if (request != null && request.getPullRequestId() != null && !request.getPullRequestId().isBlank()) {
            PullRequest pullRequest = pullRequestRepository
                    .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                            request.getPullRequestId(),
                            owner,
                            repo
                    )
                    .orElseThrow(() -> new NotFoundException("Pull request not found"));

            task.setLinkedPrId(pullRequest.getId());
            task.setSubmissionBranch(pullRequest.getSourceBranch());
            task.setSubmissionCommit(pullRequest.getSourceHash());
            task.setSubmissionUrl(
                    buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo + "/pulls/" + pullRequest.getId())
            );
        }

        Task updated = taskRepository.save(task);

        if (updated.getMilestoneId() != null) {
            milestoneService.updateMilestoneProgress(owner, repo, updated.getMilestoneId());
        }

        publishTaskCompletedEvent(owner, repo, updated, reviewer);

        return MilestoneService.TaskResponse.fromDocument(updated);
    }

    /**
     * Get student dashboard with all assigned tasks
     */
    public StudentDashboard getStudentDashboard(String owner, String repo, ContributorUser viewerUser) {
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        List<Task> tasks = visibleTasksForUser(
                taskRepository.findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo),
                meta,
                viewerUser
        );
        String username = viewerUser == null ? "" : viewerUser.getUsername();
        List<Milestone> milestones = milestoneRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo);
        long totalTasks = tasks.size();
        long completedTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.COMPLETED)).count();
        long inProgressTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.PROGRESS)).count();
        long inReviewTasks = tasks
                .stream().filter(t -> t.getStatus().equals(TaskStatus.REVIEW)).count();
        long openTasks = tasks
                .stream()
                .filter(t -> t.getStatus().equals(TaskStatus.OPEN)).count();
        long totalMilestones = milestones.size();
        long closedMilestones = milestones.stream()
                .filter(m -> "closed".equalsIgnoreCase(String.valueOf(m.getStatus())))
                .count();
        long openMilestones = totalMilestones - closedMilestones;
        // Calculate total score
        int totalEarnedScore = tasks.stream()
                .filter(t -> t.getEarnedScore() != null)
                .mapToInt(Task::getEarnedScore)
                .sum();
        int totalPossibleScore = tasks.stream()
                .filter(t -> t.getMaxScore() != null)
                .mapToInt(Task::getMaxScore)
                .sum();
        return StudentDashboard.builder()
                .username(username)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .inReviewTasks(inReviewTasks)
                .openTasks(openTasks)
                .totalMilestones(totalMilestones)
                .openMilestones(openMilestones)
                .closedMilestones(closedMilestones)
                .totalEarnedScore(totalEarnedScore)
                .totalPossibleScore(totalPossibleScore)
                .scorePercentage(totalPossibleScore > 0 ?
                        (double) totalEarnedScore / totalPossibleScore * 100 : 0)
                .tasks(tasks.stream()
                        .map(MilestoneService.TaskResponse::fromDocument)
                        .collect(Collectors.toList()))
                .build();
    }

    public List<MilestoneService.TaskResponse> listTasks(
            String owner,
            String repo,
            ContributorUser viewerUser,
            String assignee,
            String status,
            Integer milestone,
            String search
    ) {
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);
        List<Task> tasks = visibleTasksForUser(
                taskRepository.findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo),
                meta,
                viewerUser
        );

        if (assignee != null && !assignee.isBlank()) {
            String normalizedAssignee = assignee.trim().toLowerCase(Locale.ROOT);
            tasks = tasks.stream()
                    .filter(task -> task.getAssignedTo() != null)
                    .filter(task -> {
                        String userName = task.getAssignedTo().getUserName();
                        return userName != null
                                && userName.trim().toLowerCase(Locale.ROOT).equals(normalizedAssignee);
                    })
                    .toList();
        }

        if (milestone != null) {
            tasks = tasks.stream()
                    .filter(task -> Objects.equals(task.getMilestoneNumber(), milestone))
                    .toList();
        }

        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status.trim())) {
            TaskStatus normalizedStatus = parseTaskStatus(status);
            tasks = tasks.stream()
                    .filter(task -> task.getStatus() == normalizedStatus)
                    .toList();
        }

        if (search != null && !search.isBlank()) {
            String needle = search.trim().toLowerCase(Locale.ROOT);
            tasks = tasks.stream()
                    .filter(task -> matchesTaskSearch(task, needle))
                    .toList();
        }

        return tasks.stream()
                .map(MilestoneService.TaskResponse::fromDocument)
                .toList();
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

    private boolean canManageTaskPlanning(RepositoryDocument meta, ContributorUser user) {
        String username = user == null ? "" : user.getUsername();
        return RepoAccessRules.canAdmin(meta, username) || hasTaskOverviewRole(user);
    }

    private List<Task> visibleTasksForUser(List<Task> tasks, RepositoryDocument meta, String username) {
        String viewer = normalizeUsername(username);
        if (viewer.isEmpty()) {
            return List.of();
        }
        if (RepoAccessRules.canAdmin(meta, viewer)) {
            return tasks;
        }
        return tasks.stream()
                .filter(task -> isTaskCreator(task, viewer) || isTaskAssignee(task, viewer))
                .toList();
    }

    private List<Task> visibleTasksForUser(List<Task> tasks, RepositoryDocument meta, ContributorUser user) {
        String viewer = normalizeUsername(user == null ? null : user.getUsername());
        if (viewer.isEmpty()) {
            return List.of();
        }
        if (RepoAccessRules.canAdmin(meta, viewer) || hasTaskOverviewRole(user)) {
            return tasks;
        }
        return tasks.stream()
                .filter(task -> isTaskCreator(task, viewer) || isTaskAssignee(task, viewer))
                .toList();
    }

    private boolean hasTaskOverviewRole(ContributorUser user) {
        if (user == null) {
            return false;
        }
        java.util.Set<String> roles = new java.util.HashSet<>();
        if (user.getRoles() != null) {
            roles.addAll(user.getRoles());
        }
        if (user.getRole() != null && !user.getRole().isBlank()) {
            roles.add(user.getRole());
        }
        return roles.stream()
                .map(role -> role == null ? "" : role.trim().toLowerCase(Locale.ROOT))
                .map(role -> role.startsWith("role_") ? role.substring("role_".length()) : role)
                .anyMatch(role -> role.equals("admin")
                        || role.equals("admin_user")
                        || role.equals("admin-user")
                        || role.equals("teacher")
                        || role.equals("teacher_user")
                        || role.equals("teacher-user"));
    }

    private boolean isTaskCreator(Task task, String username) {
        return normalizeUsername(task == null ? null : task.getCreatedBy()).equals(username);
    }

    private boolean isTaskAssignee(Task task, String username) {
        if (task == null || task.getAssignedTo() == null) {
            return false;
        }
        return normalizeUsername(task.getAssignedTo().getUserName()).equals(username);
    }

    public List<TaskPullRequestCandidateResponse> listEligiblePullRequests(
            String owner,
            String repo,
            int taskNumber,
            String username
    ) {
        Task task = getTask(owner, repo, taskNumber);
        ensureAssignedUser(task, username, "Only the assigned contributor can submit task work");

        String linkedPrId = trimToNull(task.getLinkedPrId());
        Set<String> usedPullRequests = taskRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .stream()
                .filter(existing -> !Objects.equals(existing.getId(), task.getId()))
                .map(Task::getLinkedPrId)
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return pullRequestRepository
                .findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(owner, repo)
                .stream()
                .filter(pr -> pr.getAuthor() != null)
                .filter(pr -> normalizeUsername(pr.getAuthor().getUsername()).equals(normalizeUsername(username)))
                .filter(pr -> pr.getStatus() != PullRequestStatus.CLOSED)
                .filter(pr -> !usedPullRequests.contains(pr.getId()) || Objects.equals(pr.getId(), linkedPrId))
                .sorted(Comparator.comparing(PullRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(pr -> TaskPullRequestCandidateResponse.builder()
                        .id(pr.getId())
                        .title(pr.getTitle())
                        .description(pr.getDescription())
                        .sourceBranch(pr.getSourceBranch())
                        .sourceHash(pr.getSourceHash())
                        .targetBranch(pr.getTargetBranch())
                        .status(pr.getStatus() == null ? null : pr.getStatus().name())
                        .createdAt(pr.getCreatedAt())
                        .pullRequestUrl(buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo + "/pulls/" + pr.getId()))
                        .selected(Objects.equals(pr.getId(), linkedPrId))
                        .build())
                .toList();
    }

    private Task getTask(String owner, String repo, int number) {
        return taskRepository.findByRepoOwner_UserNameAndRepoNameAndNumberOrderByNumber(owner, repo, number)
                .orElseThrow(() -> new NotFoundException("task #" + number + " not found"));
    }

    private int getNextTaskNumber(String owner, String repo) {
        return taskRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .stream()
                .findFirst()
                .map(task -> task.getNumber() + 1)
                .orElse(1);
    }

    private void sendTaskNotification(String owner, String repo, Task task,
                                      String action, String username) {
        WebSocketEvents.RepositoryActivity activity = WebSocketEvents.RepositoryActivity.builder()
                .type("task_" + action)
                .description("Task #" + task.getNumber() + " " + action + ": " + task.getTitle())
                .actor(WebSocketEvents.UserInfo.builder().username(username).build())
                .timestamp(Instant.now())
                .metadata(Map.of(
                        "task_number", task.getNumber(),
                        "task_id", task.getId()
                ))
                .build();

        notificationService.broadcastActivity(owner, repo, activity);
    }

    private void notifyAdminsAboutSubmission(String owner, String repo,
                                             Task task, String submitter) {
        // Get repo admins and notify them
        RepositoryDocument meta = vicRepositoryService.loadMeta(owner, repo);

        // Notify owner
        notificationService.sendUserNotification(meta.getOwner().getUsername(),
                WebSocketEvents.NotificationEvent.builder()
                        .type("new_submission")
                        .title("New Submission")
                        .message("Task #" + task.getNumber() + " submitted by " + submitter)
                        .url("/repos/" + owner + "/" + repo + "/tasks/" + task.getNumber())
                        .createdAt(Instant.now())
                        .build()
        );
    }

    private boolean matchesTaskSearch(Task task, String needle) {
        return containsIgnoreCase(task.getTitle(), needle)
                || containsIgnoreCase(task.getDescription(), needle)
                || containsIgnoreCase(task.getCreatedBy(), needle)
                || containsIgnoreCase(task.getReviewedBy(), needle)
                || containsIgnoreCase(task.getReviewComments(), needle)
                || containsIgnoreCase(task.getSubmissionBranch(), needle)
                || containsIgnoreCase(task.getSubmissionCommit(), needle)
                || containsIgnoreCase(task.getSubmissionUrl(), needle)
                || (task.getAssignedTo() != null
                && (containsIgnoreCase(task.getAssignedTo().getUserName(), needle)
                || containsIgnoreCase(task.getAssignedTo().getFirstName(), needle)
                || containsIgnoreCase(task.getAssignedTo().getEmail(), needle)))
                || (task.getLabels() != null
                && task.getLabels().stream().anyMatch(label -> containsIgnoreCase(String.valueOf(label), needle)));
    }

    private boolean containsIgnoreCase(String source, String needle) {
        return source != null && source.toLowerCase(Locale.ROOT).contains(needle);
    }

    private TaskStatus parseTaskStatus(String raw) {
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "open" -> TaskStatus.OPEN;
            case "progress", "in_progress", "in-progress" -> TaskStatus.PROGRESS;
            case "review", "in_review", "in-review" -> TaskStatus.REVIEW;
            case "completed", "done" -> TaskStatus.COMPLETED;
            case "cancelled", "canceled" -> TaskStatus.CANCELLED;
            default -> throw new NotFoundException("task status '" + raw + "' not supported");
        };
    }


    @Data
    @Builder
    @AllArgsConstructor
    public static class TaskRequest {
        private String title;
        private String description;
        private Integer milestoneNumber;
        private TaskPriority priority;
        private List<Label> labels;
        private Instant dueDate;
        private Integer estimatedHours;
        private Integer maxScore;
        private List<String> requirements;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class SubmissionRequest {
        private String pullRequestId;
        private String description;
        private String branchName;
        private String commitHash;
        private String pullRequestUrl;
        private List<String> files;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class ReviewRequest {
        private String feedback;
        private Integer score;
        private boolean approved;
        private List<String> checkedRequirements;
    }

    @Data
    @Builder
    public static class StudentDashboard {
        private String username;
        private long totalTasks;
        private long completedTasks;
        private long inProgressTasks;
        private long inReviewTasks;
        private long openTasks;
        private long totalMilestones;
        private long openMilestones;
        private long closedMilestones;
        private int totalEarnedScore;
        private int totalPossibleScore;
        private double scorePercentage;
        private List<MilestoneService.TaskResponse> tasks;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class TaskPullRequestCandidateResponse {
        private String id;
        private String title;
        private String description;
        private String sourceBranch;
        private String sourceHash;
        private String targetBranch;
        private String status;
        private Instant createdAt;
        private String pullRequestUrl;
        private boolean selected;
    }

    private void validateTaskRequest(TaskRequest request) {
        if (request == null) {
            return;
        }
        Integer maxScore = request.getMaxScore();
        Integer estimatedHours = request.getEstimatedHours();
        if (maxScore != null && maxScore < 0) {
            throw new BadRequestException("task max score cannot be negative");
        }
        if (estimatedHours != null && estimatedHours < 0) {
            throw new BadRequestException("estimated hours cannot be negative");
        }
    }

    private Integer resolveTaskMaxScore(
            String owner,
            String repo,
            TaskRequest request,
            Milestone milestone
    ) {
        if (request.getMaxScore() != null) {
            return request.getMaxScore();
        }
        if (milestone == null || milestone.getMaxScore() == null || milestone.getMaxScore() < 0) {
            return null;
        }

        Integer requiredTasks = milestone.getRequiredTasks();
        if (requiredTasks == null || requiredTasks <= 0) {
            return null;
        }

        int existingTaskCount = taskRepository
                .findByRepoOwner_UserNameAndRepoNameAndMilestoneId(owner, repo, milestone.getId())
                .size();
        if (existingTaskCount >= requiredTasks) {
            throw new BadRequestException(
                    "milestone score allocation is exhausted; increase required tasks or set the task marks manually"
            );
        }

        int totalMarks = milestone.getMaxScore();
        int base = totalMarks / requiredTasks;
        int remainder = totalMarks % requiredTasks;
        int taskIndex = existingTaskCount + 1;
        return base + (taskIndex <= remainder ? 1 : 0);
    }

    private Integer normalizeReviewScore(Task task, Integer score) {
        if (score == null) {
            return null;
        }
        if (score < 0) {
            throw new BadRequestException("review score cannot be negative");
        }
        Integer maxScore = task == null ? null : task.getMaxScore();
        if (maxScore != null && score > maxScore) {
            throw new BadRequestException("review score cannot exceed the task max score");
        }
        return score;
    }

    private Integer normalizeCompletedTaskScore(Task task, Integer score, boolean completed) {
        if (score != null) {
            return normalizeReviewScore(task, score);
        }
        if (!completed || task == null || task.getMaxScore() == null) {
            return null;
        }
        return normalizeReviewScore(task, task.getMaxScore());
    }

    private void ensureTaskCreator(Task task, String username, String message) {
        String actor = normalizeUsername(username);
        String creator = normalizeUsername(task.getCreatedBy());
        if (actor.isEmpty() || creator.isEmpty() || !creator.equals(actor)) {
            throw new ForbiddenException(message);
        }
    }

    private void ensureCanAssignTask(RepositoryDocument meta, Task task, ContributorUser user, String message) {
        String actor = normalizeUsername(user == null ? null : user.getUsername());
        if (actor.isEmpty()) {
            throw new ForbiddenException(message);
        }
        if (RepoAccessRules.canAdmin(meta, actor) || hasTaskOverviewRole(user) || isTaskCreator(task, actor)) {
            return;
        }
        throw new ForbiddenException(message);
    }

    private void ensureAssignedUser(Task task, String username, String message) {
        String actor = normalizeUsername(username);
        String assignee = task.getAssignedTo() == null
                ? ""
                : normalizeUsername(task.getAssignedTo().getUserName());
        if (actor.isEmpty() || assignee.isEmpty() || !assignee.equals(actor)) {
            throw new ForbiddenException(message);
        }
    }

    private void ensureAcceptedRepoMember(RepositoryDocument meta, String username, String message) {
        String normalized = normalizeUsername(username);
        if (normalized.isEmpty()) {
            throw new ForbiddenException(message);
        }
        String ownerUsername = meta.getOwner() == null
                ? ""
                : normalizeUsername(meta.getOwner().getUsername());
        if (ownerUsername.equals(normalized)) {
            return;
        }
        boolean acceptedContributor = meta.getCollaborators() != null
                && meta.getCollaborators().stream().anyMatch(collaborator -> isAcceptedCollaborator(collaborator, normalized));
        if (!acceptedContributor) {
            throw new ForbiddenException(message);
        }
    }

    private void ensureAcceptedCollaborator(RepositoryDocument meta, String username, String message) {
        String normalized = normalizeUsername(username);
        boolean acceptedContributor = meta.getCollaborators() != null
                && meta.getCollaborators().stream().anyMatch(collaborator -> isAcceptedCollaborator(collaborator, normalized));
        if (!acceptedContributor) {
            throw new ForbiddenException(message);
        }
    }
    private void validatePullRequestForTaskCompletion(
            String owner,
            String repo,
            Task task,
            String pullRequestId
    ) {
        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullRequestId,
                        owner,
                        repo
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        if (pullRequest.getStatus() != PullRequestStatus.MERGED) {
            throw new BadRequestException("Task can only be completed with a merged pull request");
        }

        if (task.getAssignedTo() == null) {
            throw new BadRequestException("Task is not assigned to any contributor");
        }

        if (pullRequest.getAuthor() == null) {
            throw new BadRequestException("Pull request author is missing");
        }

        String prAuthorId = normalizeValue(pullRequest.getAuthor().getId());
        String taskAssigneeId = normalizeValue(task.getAssignedTo().getUserId());

        String prAuthorUsername = normalizeUsername(pullRequest.getAuthor().getUsername());
        String taskAssigneeUsername = normalizeUsername(task.getAssignedTo().getUserName());

        boolean sameUserById =
                !prAuthorId.isBlank()
                        && !taskAssigneeId.isBlank()
                        && prAuthorId.equals(taskAssigneeId);

        boolean sameUserByUsername =
                !prAuthorUsername.isBlank()
                        && !taskAssigneeUsername.isBlank()
                        && prAuthorUsername.equals(taskAssigneeUsername);

        if (!sameUserById && !sameUserByUsername) {
            throw new ForbiddenException(
                    "The pull request author must be the assigned contributor of this task"
            );
        }
    }
    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isAcceptedCollaborator(ContributorUser collaborator, String username) {
        if (collaborator == null) {
            return false;
        }
        String collaboratorUsername = normalizeUsername(collaborator.getUsername());
        if (collaboratorUsername.isEmpty() || !collaboratorUsername.equals(username)) {
            return false;
        }
        ContributorStatus status = collaborator.getContributorStatus();
        return status == null || status == ContributorStatus.ACCEPTED;
    }

    private String normalizeUsername(String username) {
        return String.valueOf(username == null ? "" : username).trim().toLowerCase(Locale.ROOT);
    }

    private ResolvedSubmissionPayload resolveSubmissionPayload(
            String owner,
            String repo,
            Task task,
            SubmissionRequest request,
            String username
    ) {
        String pullRequestId = trimToNull(request.getPullRequestId());
        if (pullRequestId == null) {
            return new ResolvedSubmissionPayload(
                    null,
                    trimToNull(request.getBranchName()),
                    trimToNull(request.getCommitHash()),
                    trimToNull(request.getPullRequestUrl()),
                    request.getFiles() == null ? List.of() : request.getFiles().stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isBlank()).toList()
            );
        }

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(pullRequestId, owner, repo)
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        if (pullRequest.getAuthor() == null ||
                !normalizeUsername(username).equals(normalizeUsername(pullRequest.getAuthor().getUsername()))) {
            throw new ForbiddenException("Only your own pull requests can be submitted for this task");
        }

        boolean usedByAnotherTask = taskRepository
                .findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(owner, repo)
                .stream()
                .filter(existing -> !Objects.equals(existing.getId(), task.getId()))
                .anyMatch(existing -> Objects.equals(trimToNull(existing.getLinkedPrId()), pullRequestId));
        if (usedByAnotherTask) {
            throw new ForbiddenException("This pull request has already been submitted to another task");
        }

        List<String> files = pullRequestMergeService.listChangedPathsBetweenCommits(
                owner,
                repo,
                pullRequest.getTargetHash(),
                pullRequest.getSourceHash()
        );

        return new ResolvedSubmissionPayload(
                pullRequestId,
                trimToNull(pullRequest.getSourceBranch()),
                trimToNull(pullRequest.getSourceHash()),
                buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo + "/pulls/" + pullRequest.getId()),
                files
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record ResolvedSubmissionPayload(
            String pullRequestId,
            String branchName,
            String commitHash,
            String pullRequestUrl,
            List<String> files
    ) {}

    @Data
    @Builder
    @AllArgsConstructor
    public static class CompleteTaskRequest {
        private String feedback;
        private Integer score;

        /**
         * Optional.
         * If frontend sends pullRequestId, we validate that:
         * 1. PR exists in same repo
         * 2. PR author is the assigned task user
         * 3. PR is already merged
         */
        private String pullRequestId;
    }

    private void publishTaskAssignedEvent(
            String owner,
            String repo,
            Task task,
            UserDTO actor,
            UserDTO assignee,
            UserDTO repoOwner
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actionType", "TASK_ASSIGNED");
        metadata.put("taskId", task.getId());
        metadata.put("taskNumber", task.getNumber());
        metadata.put("taskTitle", task.getTitle());
        metadata.put("taskStatus", task.getStatus() == null ? null : task.getStatus().getStatus());
        metadata.put("repositoryOwner", owner);
        metadata.put("repositoryName", repo);
        metadata.put("senderUserId", actor.getId());
        metadata.put("senderName", actor.getUsername());
        metadata.put("senderEmail", actor.getEmail());
        metadata.put("receiverUserId", assignee.getId());
        metadata.put("receiverName", assignee.getUsername());
        metadata.put("receiverEmail", assignee.getEmail());
        metadata.put("message", actor.getUsername() + " assigned you task #" + task.getNumber() + ": " + task.getTitle());
        metadata.put("actionUrl", buildGatewayUrl("/api/v1/task/repos/" + owner + "/" + repo + "/tasks"));
        metadata.put("viewEndpoint", buildGatewayUrl("/api/v1/task/repos/" + owner + "/" + repo + "/tasks"));
        metadata.put("uiPath", buildTaskUiPath(owner, repo, task.getNumber()));

        kafkaProducer.produce(
                RepositoryOperationEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(RepositoryEventType.TASK_ASSIGNED)
                        .repositoryId(null)
                        .repositoryName(repo)
                        .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo))
                        .actorUserId(actor.getId())
                        .actorName(actor.getUsername())
                        .actorEmail(actor.getEmail())
                        .ownerUserId(repoOwner.getId())
                        .ownerName(repoOwner.getUsername())
                        .ownerEmail(repoOwner.getEmail())
                        .recipients(List.of(buildRecipient(assignee, "ASSIGNEE")))
                        .occurredAt(LocalDateTime.now())
                        .metadata(metadata)
                        .build()
        );
    }

    private void publishTaskSubmittedEvent(
            String owner,
            String repo,
            Task task,
            UserDTO submitter,
            UserDTO repoOwner
    ) {
        Map<String, RepositoryMemberRecipient> recipients = new LinkedHashMap<>();
        addRecipient(recipients, buildRecipient(repoOwner, "OWNER"));
        UserDTO creator = findUserByUsername(task.getCreatedBy());
        addRecipient(recipients, buildRecipient(creator, "CREATOR"));

        if (recipients.isEmpty()) {
            return;
        }

        Map<String, Object> metadata = baseTaskMetadata("TASK_SUBMITTED", owner, repo, task, submitter);
        metadata.put("message", submitter.getUsername() + " submitted work for task #" + task.getNumber() + ": " + task.getTitle());

        kafkaProducer.produce(
                RepositoryOperationEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(RepositoryEventType.TASK_SUBMITTED)
                        .repositoryName(repo)
                        .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo))
                        .actorUserId(submitter.getId())
                        .actorName(submitter.getUsername())
                        .actorEmail(submitter.getEmail())
                        .ownerUserId(repoOwner.getId())
                        .ownerName(repoOwner.getUsername())
                        .ownerEmail(repoOwner.getEmail())
                        .recipients(new ArrayList<>(recipients.values()))
                        .occurredAt(LocalDateTime.now())
                        .metadata(metadata)
                        .build()
        );
    }

    private void publishTaskCompletedEvent(
            String owner,
            String repo,
            Task task,
            String reviewerUsername
    ) {
        UserDTO reviewer = findUserByUsername(reviewerUsername);
        UserDTO repoOwner = findUserByUsername(owner);
        if (reviewer == null || repoOwner == null) {
            return;
        }

        Map<String, RepositoryMemberRecipient> recipients = new LinkedHashMap<>();
        addRecipient(recipients, buildRecipient(repoOwner, "OWNER"));
        UserDTO creator = findUserByUsername(task.getCreatedBy());
        addRecipient(recipients, buildRecipient(creator, "CREATOR"));

        if (recipients.isEmpty()) {
            return;
        }

        Map<String, Object> metadata = baseTaskMetadata("TASK_COMPLETED", owner, repo, task, reviewer);
        metadata.put("message", reviewer.getUsername() + " marked task #" + task.getNumber() + " as completed: " + task.getTitle());

        kafkaProducer.produce(
                RepositoryOperationEvent.builder()
                        .eventId(UUID.randomUUID().toString())
                        .eventType(RepositoryEventType.TASK_COMPLETED)
                        .repositoryName(repo)
                        .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo))
                        .actorUserId(reviewer.getId())
                        .actorName(reviewer.getUsername())
                        .actorEmail(reviewer.getEmail())
                        .ownerUserId(repoOwner.getId())
                        .ownerName(repoOwner.getUsername())
                        .ownerEmail(repoOwner.getEmail())
                        .recipients(new ArrayList<>(recipients.values()))
                        .occurredAt(LocalDateTime.now())
                        .metadata(metadata)
                        .build()
        );
    }

    private Map<String, Object> baseTaskMetadata(
            String actionType,
            String owner,
            String repo,
            Task task,
            UserDTO actor
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actionType", actionType);
        metadata.put("taskId", task.getId());
        metadata.put("taskNumber", task.getNumber());
        metadata.put("taskTitle", task.getTitle());
        metadata.put("taskStatus", task.getStatus() == null ? null : task.getStatus().getStatus());
        metadata.put("repositoryOwner", owner);
        metadata.put("repositoryName", repo);
        metadata.put("senderUserId", actor.getId());
        metadata.put("senderName", actor.getUsername());
        metadata.put("senderEmail", actor.getEmail());
        metadata.put("actionUrl", buildGatewayUrl("/api/v1/task/repos/" + owner + "/" + repo + "/tasks"));
        metadata.put("viewEndpoint", buildGatewayUrl("/api/v1/task/repos/" + owner + "/" + repo + "/tasks"));
        metadata.put("uiPath", buildTaskUiPath(owner, repo, task.getNumber()));
        return metadata;
    }

    private RepositoryMemberRecipient buildRecipient(UserDTO user, String role) {
        if (user == null || user.getId() == null || user.getId().isBlank()) {
            return null;
        }
        return RepositoryMemberRecipient.builder()
                .userId(user.getId())
                .name(user.getUsername())
                .email(user.getEmail())
                .role(role)
                .build();
    }

    private void addRecipient(Map<String, RepositoryMemberRecipient> recipients, RepositoryMemberRecipient recipient) {
        if (recipient == null || recipient.getUserId() == null || recipient.getUserId().isBlank()) {
            return;
        }
        recipients.putIfAbsent(recipient.getUserId(), recipient);
    }

    private UserDTO findUserByUsername(String username) {
        if (username == null || username.isBlank()) {
            return null;
        }
        try {
            return authService.getUserByUsername(username);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String buildGatewayUrl(String path) {
        String base = appProperties.getGatewayBaseUrl() == null
                ? "http://localhost:8080"
                : appProperties.getGatewayBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (path == null || path.isBlank()) {
            return base;
        }
        return path.startsWith("/") ? base + path : base + "/" + path;
    }

    private String buildTaskUiPath(String owner, String repo, Integer taskNumber) {
        return "/repository/" + owner + "/" + repo + "/tasks/issue/" + taskNumber;
    }



}


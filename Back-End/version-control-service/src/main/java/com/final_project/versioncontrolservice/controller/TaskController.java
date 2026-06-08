package com.final_project.versioncontrolservice.controller;


import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.SubmissionResponse;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.MilestoneService;
import com.final_project.versioncontrolservice.service.TaskService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequestMapping("/api/v1/task")
@RestController
@AllArgsConstructor
public class TaskController {
    private final AuthService authService;
    private final TaskService taskService;
        private final com.final_project.versioncontrolservice.repo.TaskRepository taskRepository;
    /**
     * Create a new task
     * POST /repos/{owner}/{repo}/tasks
     */

    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{username}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> createTask(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody TaskService.TaskRequest request,
            @PathVariable String username,
            @AuthenticationPrincipal Jwt jwt

    ) {
        ContributorUser user = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.createTask(owner, repo, request, user));
    }

    /**
     * Assign task to user
     * POST /repos/{owner}/{repo}/tasks/{number}/assign
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/assign/{user}/{assignee}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> assignTask(
            @PathVariable String user,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @PathVariable String assignee,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser contributor = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.assignTask(owner, repo, number, assignee, contributor));
    }

    /**
     * Submit work for a task
     * POST /repos/{owner}/{repo}/tasks/{number}/submit
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/submit",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SubmissionResponse> submitTask(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody TaskService.SubmissionRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {

        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(taskService.submitTask(owner, repo, number, request, user.getUsername()));
    }

    /**
     * Review/grading a task
     * POST /repos/{owner}/{repo}/tasks/{number}/review
     */
    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/review",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> reviewTask(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody TaskService.ReviewRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {
        ContributorUser user = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.reviewTask(owner, repo, number, request, user));
    }

    @PostMapping(path = "/repos/{owner}/{repo}/tasks/{number}/complete",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.TaskResponse> completeTask(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody TaskService.CompleteTaskRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.completeTask(owner, repo, number, request, user.getUsername()));
    }

    /**
     * Get student dashboard
     * GET /repos/{owner}/{repo}/dashboard
     */
    @GetMapping(path = "/repos/{owner}/{repo}/dashboard",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TaskService.StudentDashboard> getDashboard(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal Jwt jwt
            ) {
        ContributorUser user = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.getStudentDashboard(owner, repo, user));
    }

    /**
     * List tasks (with filters)
     * GET /repos/{owner}/{repo}/tasks
     */
    @GetMapping(path = "/repos/{owner}/{repo}/tasks",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MilestoneService.TaskResponse>> listTasks(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer milestone,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal Jwt jwt) {
        ContributorUser user = contributorWithJwtRoles(jwt);
        return ResponseEntity.ok(taskService.listTasks(owner, repo, user, assignee, status, milestone, search));
    }

    private ContributorUser contributorWithJwtRoles(Jwt jwt) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        if (user == null) {
            return null;
        }

        Set<String> roles = new HashSet<>();
        if (user.getRoles() != null) {
            roles.addAll(user.getRoles());
        }

        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> realmMap) {
            Object jwtRoles = realmMap.get("roles");
            if (jwtRoles instanceof Collection<?> collection) {
                collection.stream()
                        .map(role -> role == null ? "" : String.valueOf(role).trim())
                        .filter(role -> !role.isBlank())
                        .forEach(roles::add);
            }
        }

        user.setRoles(roles);
        return user;
    }

    @GetMapping(path = "/repos/{owner}/{repo}/tasks/{number}/eligible-pulls",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<TaskService.TaskPullRequestCandidateResponse>> listEligiblePullRequests(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(taskService.listEligiblePullRequests(owner, repo, number, user.getUsername()));
    }

        /**
         * Manual trigger: complete tasks linked to a given pull request id.
         * POST /repos/{owner}/{repo}/tasks/complete-by-pr
         */
        @PostMapping(path = "/repos/{owner}/{repo}/tasks/complete-by-pr",
                        consumes = MediaType.APPLICATION_JSON_VALUE,
                        produces = MediaType.APPLICATION_JSON_VALUE)
        public ResponseEntity<Map<String, Object>> completeTasksByPullRequest(
                        @PathVariable String owner,
                        @PathVariable String repo,
                        @RequestBody TaskService.CompleteTaskRequest request,
                        @AuthenticationPrincipal Jwt jwt
        ) {
                ContributorUser user = authService.getContributorUser(jwt.getSubject());
                String reviewer = user == null ? "system" : user.getUsername();

                String prId = request == null ? null : request.getPullRequestId();
                if (prId == null || prId.isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "pullRequestId is required"));
                }

                List<com.final_project.versioncontrolservice.model.Task> linked = taskRepository.findByLinkedPrId(prId);
                int completed = 0;
                int failed = 0;
                List<MilestoneService.TaskResponse> completedResponses = new java.util.ArrayList<>();

                for (com.final_project.versioncontrolservice.model.Task task : linked) {
                        try {
                                MilestoneService.TaskResponse resp = taskService.completeTask(owner, repo, task.getNumber(), request, reviewer);
                                if (resp != null) {
                                        completedResponses.add(resp);
                                        completed++;
                                }
                        } catch (Exception ex) {
                                failed++;
                        }
                }

                return ResponseEntity.ok(Map.of(
                                "pullRequestId", prId,
                                "completed", completed,
                                "failed", failed,
                                "responses", completedResponses
                ));
        }
}

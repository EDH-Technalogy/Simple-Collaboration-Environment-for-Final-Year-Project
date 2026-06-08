package com.final_project.versioncontrolservice.controller;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.model.Milestone;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.MilestoneService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RequestMapping("/api/v1/milestone")
@RestController
public class MilestoneController {

    private final AuthService authService;
    private final MilestoneService milestoneService;

    /**
     * Create a new milestone
     * POST /repos/{owner}/{repo}/milestones
     */
    @PostMapping(path = "/repos/{owner}/{repo}/milestones",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> createMilestone(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody MilestoneService.MilestoneRequest request) {
        ContributorUser writer = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(
                milestoneService.createMilestone(owner, repo, request, writer.getUsername())
        );
    }
    /**
     * List all milestones for a repository
     * GET /repos/{owner}/{repo}/milestones
     */
    @GetMapping(path = "/repos/{owner}/{repo}/milestones",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<MilestoneService.MilestoneResponse>> listMilestones(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "open") String state) {
        List<MilestoneService.MilestoneResponse> milestones = milestoneService.getMilestones(owner, repo);

        // Filter by state if specified
        if (!"all".equals(state)) {
            milestones = milestones.stream()
                    .filter(m -> state.equals(m.getStatus()))
                    .toList();
        }

        return ResponseEntity.ok(milestones);
    }
    /**
     * Get a specific milestone
     * GET /repos/{owner}/{repo}/milestones/{number}
     */
    @GetMapping(path = "/repos/{owner}/{repo}/milestones/{number}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> getMilestone(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number) {
        return ResponseEntity.ok (MilestoneService.MilestoneResponse.fromDocument(milestoneService.getMilestone(owner, repo, number)) );
    }


    /**
     * Close a milestone
     * PATCH /repos/{owner}/{repo}/milestones/{number}
     */
    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> updateMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @RequestBody MilestoneService.MilestoneRequest request
            ) {
        return ResponseEntity.ok(milestoneService.updateMilestone(owner, repo,number, request));
    }
    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}/open",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> closeMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        String username = user.getUsername();
        return ResponseEntity.ok(milestoneService.closeMilestone(owner, repo,number,username));

    }

    @PatchMapping(path = "/repos/{owner}/{repo}/milestones/{number}/re-open",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MilestoneService.MilestoneResponse> reOpenMilestone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int number,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        String username = user.getUsername();
        return ResponseEntity.ok(milestoneService.reopenMilestone(owner, repo,number,username));
    }
}

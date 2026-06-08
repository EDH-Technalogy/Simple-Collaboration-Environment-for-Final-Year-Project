package com.final_project.versioncontrolservice.controller;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.ContributionService;
import com.final_project.versioncontrolservice.service.RepoAccessRules;
import com.final_project.versioncontrolservice.service.RepositoryService;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/repos")
public class ContributionController {
    private final AuthService authService;
    private final ContributionService contributionService;
    private final RepositoryService vicRepositoryService;

    /**
     * Get contribution statistics for a repository
     * GET /repos/{owner}/{repo}/contributors
     */
    @GetMapping(value = "/{owner}/{repo}/contributors/{user}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ContributionService.ContributionStats> getContributor(
            @PathVariable String user,
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok( contributionService.getContributionStats(owner, repo, user));
    }

    /**
     * Get contribution graph for a user
     * GET /repos/{owner}/{repo}/contributors/{username}/graph
     */
    @GetMapping(value = "/{owner}/{repo}/contributors/{username}/graph", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ContributionService.ContributionGraph> getContributionGraph(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String username
    ) {
        return ResponseEntity.ok(contributionService.getContributionGraph(owner, repo, username));
    }

    /**
     * Get user activity feed
     * GET /users/{username}/activity
     */
    @GetMapping(value = "/{username}/activity", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ContributionService.ActivityEvent>> getUserActivity(
            @PathVariable String username,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(contributionService.getUserActivity(username, limit));
    }
}

package com.final_project.versioncontrolservice.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.model.PullRequest;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.PullRequestApplicationService;
import com.final_project.versioncontrolservice.service.PullRequestMergeService;
import com.final_project.versioncontrolservice.service.RepoAccessRules;
import com.final_project.versioncontrolservice.service.RepositoryService;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/repos")
public class PullRequestController {


    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final PullRequestApplicationService pullRequestApplicationService;


    @PostMapping(path = "/{owner}/{repo}/pulls", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PullRequestResponse> create(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody CreatePullRequest request

            ) {
        return ResponseEntity.ok(pullRequestApplicationService.create(
                owner,
                repo,
                request
        ));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<PullRequestResponse>> list(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.list(owner, repo));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PullRequestResponse> get(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.find(id, owner, repo));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls/{id}/files", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<PullRequestMergeService.FileChange>> files(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.listChangedFiles(id, owner, repo));
    }

    @GetMapping(path = "/{owner}/{repo}/pulls/{id}/files/{fileIndex}/diff", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PullRequestMergeService.FileChange> fileDiff(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id,
            @PathVariable int fileIndex
    ) {
        return ResponseEntity.ok(pullRequestApplicationService.getChangedFileDiff(id, owner, repo, fileIndex));
    }

    @PostMapping(path = "/{owner}/{repo}/pulls/{id}/merge", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MergeResponse> merge(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) throws IOException {
        return ResponseEntity.ok(pullRequestApplicationService.merge(id, owner, repo));
    }

    @GetMapping(
            path = "/{owner}/{repo}/pulls/{id}/conflicts",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<MergeConflictResponse> conflicts(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(
                pullRequestApplicationService.getConflicts(id, owner, repo)
        );
    }

    @PostMapping(
            path = "/{owner}/{repo}/pulls/{id}/conflicts/resolve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<MergeResponse> resolveConflicts(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String id,
            @RequestBody ResolveConflictRequest request
    ) throws IOException {
        return ResponseEntity.ok(
                pullRequestApplicationService.resolveConflicts(id, owner, repo, request)
        );
    }
}

package com.final_project.versioncontrolservice.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.service.*;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/api/v1/repos")
@AllArgsConstructor
public class RepositoryController {
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final RepositoryService vicRepositoryService;
    private final InvitationApplicationService invitationApplicationService;
    private final RepositoryStatisticsService repositoryStatisticsService;


    @PostMapping( consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryResponse> createRepo(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody CreateRepositoryRequest request
    ) {
        return ResponseEntity.ok(repositoryService.createRepo(request));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RepositoryResponse>> searchRepositories(
            @RequestParam String keyword
    ) {
             return   ResponseEntity.ok(repositoryService.searchRepositories(keyword));
    }
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<RepositoryResponse>> getOwnerRepos(
            @PathVariable String ownerId
    ) {
        return ResponseEntity.ok(repositoryService.getOwnerRepos(ownerId));
    }

    @GetMapping("/accessible/{userId}")
    public ResponseEntity<List<RepositoryResponse>> getAccessibleRepos(
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(repositoryService.getAccessibleRepos(userId));
    }

    @GetMapping("/{owner}/{repo}/statistics")
    public ResponseEntity<RepositoryStatisticsResponse> getRepositoryStatistics(
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok(repositoryStatisticsService.getRepositoryStatistics(owner, repo));
    }

    @GetMapping(value = "/{owner}/{repo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryResponse> getRepositoryByOwnerAndName(
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok(repositoryService.repositoryResponseByOwnerAndRepoName(owner, repo));
    }

    @GetMapping(path = "/{owner}/{repo}/info/refs", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> infoRefs(
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        var meta = repositoryService.loadMeta(owner, repo);
        return repositoryService.listRefs(meta);
    }

    @GetMapping(path = "/{owner}/{repo}/objects/{hash}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getObject(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String hash
    ) {
        var meta = repositoryService.loadMeta(owner, repo);
        byte[] data = repositoryService.readObjectRaw(meta, hash.trim());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).body(data);
    }

    @GetMapping(path = "/{owner}/{repo}/archive.zip", produces = "application/zip")
    public ResponseEntity<byte[]> downloadArchive(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = repositoryService.loadMeta(owner, repo);
        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new ForbiddenException("forbidden");
        }
        byte[] archive = repositoryService.archiveRepository(meta, ref);
        String fileName = owner + "-" + repo + ".zip";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(archive.length)
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(archive);
    }

    @PostMapping(
            path = "/{owner}/{repo}/objects/{hash}",
            consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadObject(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String hash,
            @RequestBody byte[] body,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = repositoryService.loadMeta(owner, repo);
        repositoryService.writeObject(meta, hash.trim(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "stored"));
    }

    @PostMapping(
            path = "/{owner}/{repo}/refs/heads/{branch}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public UpdateBranchResponse updateBranch(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String branch,
            @RequestBody UpdateBranchBody body,
            @AuthenticationPrincipal Jwt jwt
    ) throws IOException {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = repositoryService.loadMeta(owner, repo);
        repositoryService.updateBranchRef(meta, branch, body.hash().trim());
        return new UpdateBranchResponse("updated", branch.trim());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepositoryDTO> getRepoById(
            @PathVariable String id
    ){
        return ResponseEntity.ok(repositoryService.getRepositoryById(id));
    }
    @PostMapping(path = "/{owner}/{repo}/invitations/{guest}")
    public ResponseEntity<InvitationResponse> create(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String guest,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String  ownerId = jwt.getSubject();
      return ResponseEntity.ok(

              invitationApplicationService.create(InvitationRequest
                      .builder()
                      .repository(repo)
                      .hostId(ownerId)
                      .guest(guest)
                      .host(owner)
                      .build())
      ) ;
    }

    @GetMapping(path = "/{owner}/{repo}/invitations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<InvitationResponse>> listForRepository(
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok(invitationApplicationService.listForRepository(owner, repo));
    }

    @GetMapping(path = "/invitations/{user}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<InvitationResponse> listMine(
            @PathVariable String user
    ) {
        return invitationApplicationService.listPendingForUser(user);
    }

    @PostMapping(path = "/invitations/{invitationId}/accept/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InvitationResponse> accept(
            @PathVariable String userId,
            @PathVariable String invitationId
    ) {
       return ResponseEntity.ok(invitationApplicationService.accept(invitationId, userId)) ;
    }


    @PostMapping(path = "/guest/{guestId}/owner/{ownerId}/repository/{repoName}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryDTO> removeFromRepositoryContribution(
            @PathVariable String guestId,
            @PathVariable String ownerId,
            @PathVariable String repoName
    ) {
        return ResponseEntity.ok(repositoryService.removeBlockUserFromRepository(ownerId,guestId, repoName)) ;
    }
    @PostMapping(path = "/invitations/{invitationId}/reject/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InvitationResponse> reject(
            @PathVariable String userId,
            @PathVariable String invitationId
    ) {
        return ResponseEntity.ok(invitationApplicationService.reject(invitationId, userId)) ;
    }
    @GetMapping(value = "/{owner}/{repo}/contributors", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ContributorUser>> getContributors(
            @PathVariable String owner,
            @PathVariable String repo
    ) {
        return ResponseEntity.ok( repositoryService.getContributors(owner,repo));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InviteBody(String username, String role) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreateRepoBody(String name, String description) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdateBranchBody(String hash) {}

    /** Matches Go: JSON field {@code hash} holds the branch name. */
    public record UpdateBranchResponse(String status, @JsonProperty("hash") String branchName) {}
}

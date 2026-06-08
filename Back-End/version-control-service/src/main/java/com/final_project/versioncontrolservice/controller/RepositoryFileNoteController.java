package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.RepositoryFileNoteRequest;
import com.final_project.versioncontrolservice.dto.RepositoryFileNoteUpdateRequest;
import com.final_project.versioncontrolservice.model.RepositoryFileNote;
import com.final_project.versioncontrolservice.service.AuthService;
import com.final_project.versioncontrolservice.service.RepositoryFileNoteService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/repos/{owner}/{repo}/notes")
@AllArgsConstructor
public class RepositoryFileNoteController {
    private final AuthService authService;
    private final RepositoryFileNoteService noteService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<RepositoryFileNote>> listNotes(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam("path") String filePath,
            @RequestParam(defaultValue = "main") String ref,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser viewer = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(noteService.listNotes(owner, repo, ref, filePath, viewer));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryFileNote> createNote(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody RepositoryFileNoteRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser author = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.createNote(owner, repo, request, author));
    }

    @PatchMapping(path = "/{noteId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RepositoryFileNote> updateNote(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String noteId,
            @RequestBody RepositoryFileNoteUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser viewer = authService.getContributorUser(jwt.getSubject());
        return ResponseEntity.ok(noteService.updateNote(owner, repo, noteId, request, viewer));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String noteId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser viewer = authService.getContributorUser(jwt.getSubject());
        noteService.deleteNote(owner, repo, noteId, viewer);
        return ResponseEntity.noContent().build();
    }
}

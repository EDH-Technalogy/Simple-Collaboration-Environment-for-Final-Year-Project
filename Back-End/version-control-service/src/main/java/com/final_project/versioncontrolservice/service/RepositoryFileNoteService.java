package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.RepositoryFileNoteRequest;
import com.final_project.versioncontrolservice.dto.RepositoryFileNoteUpdateRequest;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.ForbiddenException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryFileNote;
import com.final_project.versioncontrolservice.repo.RepositoryFileNoteRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
public class RepositoryFileNoteService {
    private final RepositoryService repositoryService;
    private final RepositoryFileNoteRepository noteRepository;

    public List<RepositoryFileNote> listNotes(
            String owner,
            String repo,
            String branch,
            String filePath,
            ContributorUser viewer
    ) {
        RepositoryDocument meta = contributorRepository(owner, repo, viewer);
        String normalizedPath = normalizeRequired(filePath, "file path is required");
        String normalizedBranch = normalizeBranch(branch);
        return noteRepository.findByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranchAndFilePathAndDeletedFalseOrderByStartOffsetAscCreatedAtAsc(
                ownerUsername(meta, owner),
                repositoryName(meta, repo),
                normalizedBranch,
                normalizedPath
        );
    }

    public RepositoryFileNote createNote(
            String owner,
            String repo,
            RepositoryFileNoteRequest request,
            ContributorUser author
    ) {
        RepositoryDocument meta = contributorRepository(owner, repo, author);
        String body = normalizeRequired(request.body(), "note body is required");
        String selectedText = normalizeRequired(request.selectedText(), "selected text is required");
        Integer startOffset = request.startOffset();
        Integer endOffset = request.endOffset();
        if (startOffset == null || endOffset == null || endOffset <= startOffset) {
            throw new BadRequestException("valid selection offsets are required");
        }

        LocalDateTime now = LocalDateTime.now();
        RepositoryFileNote note = RepositoryFileNote.builder()
                .repositoryId(meta.getId())
                .ownerUsername(ownerUsername(meta, owner))
                .repositoryName(repositoryName(meta, repo))
                .branch(normalizeBranch(request.branch()))
                .filePath(normalizeRequired(request.filePath(), "file path is required"))
                .selectedText(selectedText)
                .startOffset(startOffset)
                .endOffset(endOffset)
                .body(body)
                .authorId(authorId(author))
                .authorName(authorName(author))
                .authorProfile(author == null ? "" : safe(author.getProfile()))
                .resolved(false)
                .deleted(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return noteRepository.save(note);
    }

    public RepositoryFileNote updateNote(
            String owner,
            String repo,
            String noteId,
            RepositoryFileNoteUpdateRequest request,
            ContributorUser viewer
    ) {
        contributorRepository(owner, repo, viewer);
        RepositoryFileNote note = loadNote(owner, repo, noteId);
        LocalDateTime now = LocalDateTime.now();

        if (request.body() != null) {
            note.setBody(normalizeRequired(request.body(), "note body is required"));
        }
        if (request.resolved() != null) {
            note.setResolved(request.resolved());
            note.setResolvedAt(request.resolved() ? now : null);
        }
        note.setUpdatedAt(now);
        return noteRepository.save(note);
    }

    public void deleteNote(String owner, String repo, String noteId, ContributorUser viewer) {
        contributorRepository(owner, repo, viewer);
        RepositoryFileNote note = loadNote(owner, repo, noteId);
        note.setDeleted(true);
        note.setUpdatedAt(LocalDateTime.now());
        noteRepository.save(note);
    }

    private RepositoryFileNote loadNote(String owner, String repo, String noteId) {
        return noteRepository.findByIdAndOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndDeletedFalse(
                noteId,
                owner,
                repo
        ).orElseThrow(() -> new NotFoundException("note not found"));
    }

    private RepositoryDocument contributorRepository(String owner, String repo, ContributorUser viewer) {
        RepositoryDocument meta = repositoryService.loadMeta(owner, repo);
        String username = viewer == null ? "" : safe(viewer.getUsername());
        if (!RepoAccessRules.isOwnerOrAcceptedCollaborator(meta, username)) {
            throw new ForbiddenException("forbidden");
        }
        return meta;
    }

    private String ownerUsername(RepositoryDocument meta, String fallback) {
        return meta.getOwner() != null && meta.getOwner().getUsername() != null
                ? meta.getOwner().getUsername()
                : fallback;
    }

    private String repositoryName(RepositoryDocument meta, String fallback) {
        return meta.getRepositoryName() == null || meta.getRepositoryName().isBlank()
                ? fallback
                : meta.getRepositoryName();
    }

    private String normalizeBranch(String branch) {
        String normalized = safe(branch);
        return normalized.isBlank() ? "main" : normalized;
    }

    private String normalizeRequired(String value, String message) {
        String normalized = safe(value);
        if (normalized.isBlank()) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    private String authorId(ContributorUser user) {
        if (user == null) return "";
        if (!safe(user.getId()).isBlank()) return safe(user.getId());
        if (!safe(user.getUsername()).isBlank()) return safe(user.getUsername());
        return safe(user.getEmail());
    }

    private String authorName(ContributorUser user) {
        if (user == null) return "Collaborator";
        String fullName = (safe(user.getFirstName()) + " " + safe(user.getLastName())).trim();
        if (!fullName.isBlank()) return fullName;
        if (!safe(user.getUsername()).isBlank()) return safe(user.getUsername());
        if (!safe(user.getEmail()).isBlank()) return safe(user.getEmail());
        return "Collaborator";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}

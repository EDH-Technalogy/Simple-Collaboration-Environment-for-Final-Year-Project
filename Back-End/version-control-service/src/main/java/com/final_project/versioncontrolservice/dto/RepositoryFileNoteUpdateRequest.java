package com.final_project.versioncontrolservice.dto;

public record RepositoryFileNoteUpdateRequest(
        String body,
        Boolean resolved
) {
}

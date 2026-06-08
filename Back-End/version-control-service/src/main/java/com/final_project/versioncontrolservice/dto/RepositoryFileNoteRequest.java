package com.final_project.versioncontrolservice.dto;

public record RepositoryFileNoteRequest(
        String branch,
        String filePath,
        String selectedText,
        Integer startOffset,
        Integer endOffset,
        String body
) {
}

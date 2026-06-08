package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.exception.NotFoundException;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@AllArgsConstructor
public class RepositoryObjectReaderService {
    private final MinioStorageService minioStorageService;
    public byte[] readFileBytesAtCommit(
            String owner,
            String repo,
            String commitHash,
            String filePath
    ) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo =
                    VicObjectFormat.parseCommitContent(commitObj.content());

            String blobHash = findBlobHashByPath(owner, repo, commitInfo.tree(), filePath);

            if (blobHash == null || blobHash.isBlank()) {
                throw new NotFoundException("file not found: " + filePath);
            }

            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            if (!"blob".equals(blobObj.type())) {
                throw new NotFoundException("object is not blob: " + filePath);
            }

            return blobObj.content();

        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new NotFoundException("failed to read file at commit: " + e.getMessage());
        }
    }

    public String findBlobHashAtCommit(
            String owner,
            String repo,
            String commitHash,
            String filePath
    ) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo =
                    VicObjectFormat.parseCommitContent(commitObj.content());

            return findBlobHashByPath(owner, repo, commitInfo.tree(), filePath);

        } catch (Exception e) {
            return null;
        }
    }

    public String findBlobHashByPath(
            String owner,
            String repo,
            String treeHash,
            String path
    ) {
        if (path == null || path.isBlank()) {
            return null;
        }

        try {
            String normalizedPath = path.trim().replace("\\", "/");
            String[] pathParts = normalizedPath.split("/");

            String currentTree = treeHash;

            for (int i = 0; i < pathParts.length - 1; i++) {
                currentTree = findTreeEntry(owner, repo, currentTree, pathParts[i]);

                if (currentTree == null) {
                    return null;
                }
            }

            String fileName = pathParts[pathParts.length - 1];
            return findTreeEntry(owner, repo, currentTree, fileName);

        } catch (Exception e) {
            return null;
        }
    }

    public String findTreeEntry(
            String owner,
            String repo,
            String treeHash,
            String name
    ) {
        try {
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);

            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8)
                    .split("\n");

            for (String line : lines) {
                if (line == null || line.isBlank()) {
                    continue;
                }

                String[] parts = line.split("\t");

                if (parts.length >= 4 && parts[3].equals(name)) {
                    return parts[2];
                }
            }

        } catch (Exception ignored) {
        }

        return null;
    }

    public CommitMeta readCommitMeta(
            String owner,
            String repo,
            String commitHash
    ) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo =
                    VicObjectFormat.parseCommitContent(commitObj.content());

            String commitContent = new String(commitObj.content(), StandardCharsets.UTF_8);

            String authorHeader = extractHeader(commitContent, "author");
            String committerHeader = extractHeader(commitContent, "committer");

            String authorName = extractAuthorName(authorHeader);
            String timestamp = extractAuthorTimestamp(authorHeader);

            if (authorName.isBlank()) {
                authorName = extractAuthorName(committerHeader);
            }

            if (timestamp.isBlank()) {
                timestamp = extractAuthorTimestamp(committerHeader);
            }

            return new CommitMeta(
                    commitHash,
                    authorName,
                    extractMessage(commitContent),
                    timestamp,
                    commitInfo.parents()
            );

        } catch (Exception e) {
            throw new NotFoundException("commit not found: " + commitHash);
        }
    }

    private String extractHeader(String content, String key) {
        for (String line : content.split("\n")) {
            if (line.startsWith(key + " ")) {
                return line.substring(key.length() + 1);
            }
        }

        return "";
    }

    private String extractMessage(String content) {
        String[] parts = content.split("\n\n", 2);
        return parts.length > 1 ? parts[1].trim() : "";
    }

    private String extractAuthorName(String authorHeader) {
        if (authorHeader == null || authorHeader.isBlank()) {
            return "";
        }

        int emailStart = authorHeader.indexOf('<');

        if (emailStart > 0) {
            return authorHeader.substring(0, emailStart).trim();
        }

        return authorHeader.trim();
    }

    private String extractAuthorTimestamp(String authorHeader) {
        if (authorHeader == null || authorHeader.isBlank()) {
            return "";
        }

        int emailEnd = authorHeader.indexOf('>');

        if (emailEnd < 0 || emailEnd + 1 >= authorHeader.length()) {
            return "";
        }

        String tail = authorHeader.substring(emailEnd + 1).trim();
        String[] parts = tail.split("\\s+");

        if (parts.length < 1) {
            return "";
        }

        try {
            long epochSeconds = Long.parseLong(parts[0]);
            return java.time.Instant.ofEpochSecond(epochSeconds).toString();
        } catch (NumberFormatException e) {
            return "";
        }
    }

    @Data
    @AllArgsConstructor
    public static class CommitMeta {
        private String sha;
        private String author;
        private String message;
        private String timestamp;
        private List<String> parents;
    }
}
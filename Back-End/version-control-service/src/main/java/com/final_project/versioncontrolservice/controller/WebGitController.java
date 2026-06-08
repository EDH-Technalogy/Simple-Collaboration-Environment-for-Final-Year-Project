package com.final_project.versioncontrolservice.controller;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.service.*;
import com.final_project.versioncontrolservice.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/repos/{owner}/{repo}")
public class WebGitController {

    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;

    public WebGitController(
            AuthService authService,
            RepositoryService vicRepositoryService,
            MinioStorageService minioStorageService
    ) {
        this.authService = authService;
        this.vicRepositoryService = vicRepositoryService;
        this.minioStorageService = minioStorageService;
    }

    /**
     * Create or update a file via web interface
     * PUT /repos/{owner}/{repo}/contents/{path}
     */
    @PutMapping(value = "/contents/**", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WebCommitResponse> createOrUpdateFile(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody CreateFileRequest body,
            HttpServletRequest request
    ) {
        ContributorUser user = authService.getContributorUser(authorization);
        var meta = vicRepositoryService.loadMeta(owner, repo);

        if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
            throw new ForbiddenException("forbidden");
        }

        // Extract file path
        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        try {
            // Get current commit
            String branch = body.getBranch() != null ? body.getBranch() : "main";
            String currentHash = meta.getBranchHeads().getOrDefault(branch, "");

            // Create blob for new file content
            byte[] content = body.getContent().getBytes(StandardCharsets.UTF_8);
            String blobHash = storeObject(owner, repo, "blob", content);

            // Build new tree
            String newTreeHash;
            if (currentHash.isEmpty()) {
                // First commit
                newTreeHash = createTreeFromSingleFile(owner, repo, filePath, blobHash);
            } else {
                // Get existing tree and update
                byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
                VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
                VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

                newTreeHash = updateTreeWithFile(owner, repo, commitInfo.tree(), filePath, blobHash);
            }

            // Create commit
            List<String> parents = new ArrayList<>();
            if (!currentHash.isEmpty()) {
                parents.add(currentHash);
            }

            String commitHash = createCommit(owner, repo, newTreeHash, parents,
                    body.getMessage(), user.getUsername());

            // Update branch
            meta.getBranchHeads().put(branch, commitHash);
            vicRepositoryService.updateBranchRef(meta, branch, commitHash);

            WebCommitResponse response = new WebCommitResponse(
                    commitHash,
                    commitHash.substring(0, 8),
                    filePath,
                    "created/updated"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("web commit failed: " + e.getMessage());
        }
    }

    /**
     * Delete a file via web interface
     * DELETE /repos/{owner}/{repo}/contents/{path}
     */
    @DeleteMapping(value = "/contents/**", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WebCommitResponse> deleteFile(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody DeleteFileRequest body,
            HttpServletRequest request
    ) {
        ContributorUser user = authService.getContributorUser(authorization);
        var meta = vicRepositoryService.loadMeta(owner, repo);

        if (!RepoAccessRules.canWrite(meta, user.getUsername())) {
            throw new ForbiddenException("forbidden");
        }

        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        try {
            String branch = body.getBranch() != null ? body.getBranch() : "main";
            String currentHash = meta.getBranchHeads().getOrDefault(branch, "");

            if (currentHash.isEmpty()) {
                throw new BadRequestException("no commits yet");
            }

            // Get existing tree and remove file
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String newTreeHash = removeFileFromTree(owner, repo, commitInfo.tree(), filePath);

            // Create commit
            List<String> parents = new ArrayList<>();
            parents.add(currentHash);

            String commitHash = createCommit(owner, repo, newTreeHash, parents,
                    body.getMessage(), user.getUsername());

            meta.getBranchHeads().put(branch, commitHash);
            vicRepositoryService.updateBranchRef(meta, branch, commitHash);

            WebCommitResponse response = new WebCommitResponse(
                    commitHash,
                    commitHash.substring(0, 8),
                    filePath,
                    "deleted"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("web delete failed: " + e.getMessage());
        }
    }

    // ─── Helper Methods ───────────────────────────────────────────────────

    private String storeObject(String owner, String repo, String type, byte[] content) throws Exception {
        // Calculate SHA-1
        String header = type + " " + content.length + "\0";
        byte[] full = new byte[header.length() + content.length];
        System.arraycopy(header.getBytes(StandardCharsets.UTF_8), 0, full, 0, header.length());
        System.arraycopy(content, 0, full, header.length(), content.length);

        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] hashBytes = sha1.digest(full);
        String hash = bytesToHex(hashBytes);

        // Compress with zlib
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        DeflaterOutputStream dos = new DeflaterOutputStream(baos, new Deflater());
        dos.write(full);
        dos.close();
        byte[] compressed = baos.toByteArray();

        // Store in MinIO
        minioStorageService.putObjectIfAbsent(owner, repo, hash, compressed);

        return hash;
    }

    private String createTreeFromSingleFile(String owner, String repo, String path, String blobHash) throws Exception {
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
        String dirPath = path.contains("/") ? path.substring(0, path.lastIndexOf("/")) : "";

        String treeContent = "100644\tblob\t" + blobHash + "\t" + fileName;
        String treeHash = storeObject(owner, repo, "tree", treeContent.getBytes(StandardCharsets.UTF_8));

        // If file is in subdirectory, create parent trees
        if (!dirPath.isEmpty()) {
            String[] dirs = dirPath.split("/");
            String currentHash = treeHash;

            for (int i = dirs.length - 1; i >= 0; i--) {
                String parentContent = "040000\ttree\t" + currentHash + "\t" + dirs[i];
                currentHash = storeObject(owner, repo, "tree", parentContent.getBytes(StandardCharsets.UTF_8));
            }
            return currentHash;
        }

        return treeHash;
    }

    private String updateTreeWithFile(String owner, String repo, String treeHash, String path, String blobHash) throws Exception {
        // This is a simplified version - a complete implementation would handle nested trees properly
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

        byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
        VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
        String existingContent = new String(treeObj.content(), StandardCharsets.UTF_8);

        StringBuilder newContent = new StringBuilder();
        boolean found = false;

        for (String line : existingContent.split("\n")) {
            if (line.trim().isEmpty()) continue;
            String[] parts = line.split("\t");
            if (parts.length >= 4 && parts[3].equals(fileName)) {
                // Replace this entry
                newContent.append("100644\tblob\t").append(blobHash).append("\t").append(fileName).append("\n");
                found = true;
            } else {
                newContent.append(line).append("\n");
            }
        }

        if (!found) {
            // Add new entry
            newContent.append("100644\tblob\t").append(blobHash).append("\t").append(fileName).append("\n");
        }

        return storeObject(owner, repo, "tree", newContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String removeFileFromTree(String owner, String repo, String treeHash, String path) throws Exception {
        String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

        byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
        VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
        String existingContent = new String(treeObj.content(), StandardCharsets.UTF_8);

        StringBuilder newContent = new StringBuilder();

        for (String line : existingContent.split("\n")) {
            if (line.trim().isEmpty()) continue;
            String[] parts = line.split("\t");
            if (parts.length >= 4 && !parts[3].equals(fileName)) {
                newContent.append(line).append("\n");
            }
        }

        return storeObject(owner, repo, "tree", newContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String createCommit(String owner, String repo, String treeHash, List<String> parents, String message, String author) throws Exception {
        StringBuilder commitContent = new StringBuilder();
        commitContent.append("tree ").append(treeHash).append("\n");

        for (String parent : parents) {
            commitContent.append("parent ").append(parent).append("\n");
        }

        long timestamp = Instant.now().getEpochSecond();
        commitContent.append("author ").append(author).append(" <").append(author).append("@vic.com> ").append(timestamp).append("\n");
        commitContent.append("committer ").append(author).append(" <").append(author).append("@vic.com> ").append(timestamp).append("\n");
        commitContent.append("\n").append(message).append("\n");

        return storeObject(owner, repo, "commit", commitContent.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ─── Request/Response DTOs ────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateFileRequest {
        private String content;
        private String message;
        private String branch;
        private String sha; // for updates, the SHA of the file being replaced

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
        public String getSha() { return sha; }
        public void setSha(String sha) { this.sha = sha; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DeleteFileRequest {
        private String message;
        private String branch;
        private String sha;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
        public String getSha() { return sha; }
        public void setSha(String sha) { this.sha = sha; }
    }

    public static class WebCommitResponse {
        @JsonProperty("commit_sha")
        private String commitSha;
        @JsonProperty("short_sha")
        private String shortSha;
        private String path;
        private String status;

        public WebCommitResponse(String commitSha, String shortSha, String path, String status) {
            this.commitSha = commitSha;
            this.shortSha = shortSha;
            this.path = path;
            this.status = status;
        }

        public String getCommitSha() { return commitSha; }
        public String getShortSha() { return shortSha; }
        public String getPath() { return path; }
        public String getStatus() { return status; }
    }
}

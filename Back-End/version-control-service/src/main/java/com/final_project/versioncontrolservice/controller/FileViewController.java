package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.dto.DocumentBlameResponse;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.service.*;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("api/v1/repos/{owner}/{repo}")
@AllArgsConstructor
public class FileViewController {

    private final AuthService authService;
    private final RepositoryService vicRepositoryService;
    private final MinioStorageService minioStorageService;
    private final CommitGraphService commitGraphService;
    private final DocumentBlameService documentBlameService;


    /**
     * Get file content at a specific commit/branch
     * GET /repos/{owner}/{repo}/contents/{path}?ref=main
     */
    @GetMapping(value = "/contents/**", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FileContentResponse> getFileContent(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt
            ) {

        var meta = vicRepositoryService.loadMeta(owner, repo);
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        // Check permissions
        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        // Extract file path from URL
        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/contents/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        // Resolve ref to commit hash
        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        // Get file content from commit
        FileContentResponse response = getFileAtCommit(owner, repo, commitHash, filePath);
        return ResponseEntity.ok(response);
    }

    private boolean isDocumentBlameFile(String filePath) {
        if (filePath == null) {
            return false;
        }

        String lower = filePath.toLowerCase();

        return lower.endsWith(".docx")
                || lower.endsWith(".pdf")
                || lower.endsWith(".xlsx")
                || lower.endsWith(".pptx");
    }
    /**
     * Get file history (blame)
     * GET /repos/{owner}/{repo}/blame/{path}?ref=main
     */
    @GetMapping(value = "/blame/**", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<BlameEntry>> getBlame(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());

        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String fullPath = request.getRequestURI();
        String prefix = "/repos/" + owner + "/" + repo + "/blame/";
        String filePath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        if (isDocumentBlameFile(filePath)) {
            throw new BadRequestException(
                    "This file requires document blame mode. Use /document-blame/" + filePath
            );
        }
        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<BlameEntry> blame = calculateBlame(owner, repo, commitHash, filePath);
        return ResponseEntity.ok(blame);
    }

    /**
     * Get document-aware blame for supported document files.
     * GET /repos/{owner}/{repo}/document-blame/{path}?ref=main
     */
    @GetMapping(value = "/document-blame/**", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DocumentBlameResponse> getDocumentBlame(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";

        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String filePath = extractWildcardPath(request, "/document-blame/");

        String commitHash = resolveRef(meta, ref);

        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        return ResponseEntity.ok(
                documentBlameService.getDocumentBlame(owner, repo, ref, commitHash, filePath)
        );
    }

    /**
     * Get one commit by SHA
     * GET /repos/{owner}/{repo}/commits/{commitSha}
     */
    @GetMapping(value = "/commits/{commitSha}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommitResponse> getCommitDetail(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String commitSha,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String resolved = resolveRef(meta, commitSha);
        if (resolved.isEmpty()) {
            throw new NotFoundException("commit not found: " + commitSha);
        }

        return ResponseEntity.ok(readCommitResponse(owner, repo, resolved));
    }

    /**
     * Get unified diff between two commits
     * GET /repos/{owner}/{repo}/diff/{baseSha}/{headSha}
     */
    @GetMapping(value = "/diff/{baseSha}/{headSha}", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getDiffBetweenCommits(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String baseSha,
            @PathVariable String headSha,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject());
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String baseHash = resolveRef(meta, baseSha);
        String headHash = resolveRef(meta, headSha);

        if (baseHash.isEmpty() || headHash.isEmpty()) {
            throw new NotFoundException("ref not found");
        }

        return ResponseEntity.ok(buildRepositoryDiff(owner, repo, baseHash, headHash));
    }

    /**
     * Get file history (commits that modified this file)
     * GET /repos/{owner}/{repo}/commits?path=src/main.java&ref=main
     */
    @GetMapping(value = "/commits", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<CommitResponse>> getFileHistory(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(required = false) String path,
            @RequestParam(defaultValue = "main") String ref,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<CommitResponse> history = getCommitHistory(owner, repo, commitHash, path, limit);
        return ResponseEntity.ok(history);
    }

    /**
     * Get directory listing (tree view)
     * GET /repos/{owner}/{repo}/tree?ref=main&path=src
     */
    @GetMapping(value = "/tree", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<TreeEntry>> getTree(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "main") String ref,
            @RequestParam(defaultValue = "") String path
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        List<TreeEntry> tree = getTreeEntries(owner, repo, commitHash, path);
        return ResponseEntity.ok(tree);
    }

    /**
     * Get raw file bytes at a branch/ref.
     * GET /repos/{owner}/{repo}/tree/{ref}/{path}
     */
    @GetMapping(value = "/tree/{ref}/**", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getRawFileAtRef(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String ref,
            HttpServletRequest request
    ) {
        var meta = vicRepositoryService.loadMeta(owner, repo);

        ContributorUser user = jwt != null
                ? authService.getContributorUser(jwt.getSubject())
                : null;
        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String filePath = extractWildcardPath(request, "/tree/" + ref + "/");
        String commitHash = resolveRef(meta, ref);
        if (commitHash.isEmpty()) {
            throw new NotFoundException("ref not found: " + ref);
        }

        byte[] bytes = getFileBytesAtCommit(owner, repo, commitHash, filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(downloadFileName(filePath), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .contentLength(bytes.length)
                .body(bytes);
    }

    /**
     * Compare two commits/branches
     * GET /repos/{owner}/{repo}/compare/base...head
     */
    @GetMapping(value = "/compare/{base}...{head}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CompareResponse> compareCommits(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable String base,
            @PathVariable String head
    ) {
        ContributorUser user = authService.getContributorUser(jwt.getSubject())
                ;
        var meta = vicRepositoryService.loadMeta(owner, repo);

        String username = user != null ? user.getUsername() : "";
        if (!RepoAccessRules.canRead(meta, username)) {
            throw new com.final_project.versioncontrolservice.exception.ForbiddenException("forbidden");
        }

        String baseHash = resolveRef(meta, base);
        String headHash = resolveRef(meta, head);

        if (baseHash.isEmpty() || headHash.isEmpty()) {
            throw new NotFoundException("ref not found");
        }

        CompareResponse comparison = compareTrees(owner, repo, baseHash, headHash);
        return ResponseEntity.ok(comparison);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────

    private String resolveRef(RepositoryDocument meta, String ref) {
        String requested = ref == null ? "" : ref.trim();
        // Try as branch name
        if (meta.getBranchHeads() != null) {
            String hash = meta.getBranchHeads().get(requested);
            if (hash != null && !hash.isBlank()) {
                return hash.trim();
            }
        }

        // Try as full SHA
        if (requested.length() == 40 && requested.matches("[0-9a-fA-F]{40}")) {
            return requested;
        }

        String fallbackBranch = defaultBranchName(meta);
        if (meta.getBranchHeads() != null) {
            String fallbackHash = meta.getBranchHeads().get(fallbackBranch);
            if (fallbackHash != null && !fallbackHash.isBlank()) {
                return fallbackHash.trim();
            }
            for (String branchHash : meta.getBranchHeads().values()) {
                if (branchHash != null && !branchHash.isBlank()) {
                    return branchHash.trim();
                }
            }
        }

        return "";
    }

    private String defaultBranchName(RepositoryDocument meta) {
        String symbolic = meta == null ? "" : String.valueOf(meta.getSymbolicHead() == null ? "" : meta.getSymbolicHead()).trim();
        String symbolicBranch = symbolic.replaceFirst("^refs/heads/", "").trim();
        if (meta != null && meta.getBranchHeads() != null && !meta.getBranchHeads().isEmpty()) {
            if (!symbolicBranch.isBlank()) {
                String hash = meta.getBranchHeads().get(symbolicBranch);
                if (hash != null && !hash.isBlank()) {
                    return symbolicBranch;
                }
            }
            for (Map.Entry<String, String> entry : meta.getBranchHeads().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isBlank()) {
                    return entry.getKey();
                }
            }
            if (!symbolicBranch.isBlank()) {
                return symbolicBranch;
            }
            return meta.getBranchHeads().keySet().iterator().next();
        }
        return symbolicBranch.isBlank() ? "main" : symbolicBranch;
    }

    private FileContentResponse getFileAtCommit(String owner, String repo, String commitHash, String filePath) {
        try {
            // Read commit to get tree hash
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            // Find file in tree
            String[] pathParts = filePath.split("/");
            String currentTree = commitInfo.tree();

            for (int i = 0; i < pathParts.length - 1; i++) {
                currentTree = findTreeEntry(owner, repo, currentTree, pathParts[i]);
                if (currentTree == null) {
                    throw new NotFoundException("path not found: " + filePath);
                }
            }

            // Get the file blob
            String fileName = pathParts[pathParts.length - 1];
            String blobHash = findBlobEntry(owner, repo, currentTree, fileName);
            if (blobHash == null) {
                throw new NotFoundException("file not found: " + filePath);
            }

            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            String content = isBinaryPreviewFile(fileName)
                    ? null
                    : new String(blobObj.content(), StandardCharsets.UTF_8);
            long size = blobObj.content().length;

            // Detect language for syntax highlighting
            String language = detectLanguage(fileName);

            return new FileContentResponse(
                    fileName,
                    filePath,
                    blobHash,
                    content,
                    size,
                    language,
                    commitHash
            );
        } catch (Exception e) {
            throw new NotFoundException("file not found: " + e.getMessage());
        }
    }

    private byte[] getFileBytesAtCommit(String owner, String repo, String commitHash, String filePath) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String[] pathParts = filePath.split("/");
            String currentTree = commitInfo.tree();

            for (int i = 0; i < pathParts.length - 1; i++) {
                currentTree = findTreeEntry(owner, repo, currentTree, pathParts[i]);
                if (currentTree == null) {
                    throw new NotFoundException("path not found: " + filePath);
                }
            }

            String fileName = pathParts[pathParts.length - 1];
            String blobHash = findBlobEntry(owner, repo, currentTree, fileName);
            if (blobHash == null) {
                throw new NotFoundException("file not found: " + filePath);
            }

            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            if (!"blob".equals(blobObj.type())) {
                throw new NotFoundException("file object is not a blob: " + filePath);
            }

            return blobObj.content();
        } catch (Exception e) {
            throw new NotFoundException("file not found: " + e.getMessage());
        }
    }

    private boolean isBinaryPreviewFile(String fileName) {
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".doc")
                || lower.endsWith(".docx")
                || lower.endsWith(".pdf")
                || lower.endsWith(".ppt")
                || lower.endsWith(".pptx")
                || lower.endsWith(".xls")
                || lower.endsWith(".xlsx")
                || lower.endsWith(".zip")
                || lower.endsWith(".rar")
                || lower.endsWith(".7z")
                || lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".gif")
                || lower.endsWith(".webp")
                || lower.endsWith(".bmp")
                || lower.endsWith(".mp3")
                || lower.endsWith(".mp4")
                || lower.endsWith(".mov")
                || lower.endsWith(".avi");
    }

    private String findTreeEntry(String owner, String repo, String treeHash, String name) {
        try {
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                String[] parts = line.split("\t");
                if (parts.length >= 4 && parts[3].equals(name)) {
                    return parts[2]; // return hash
                }
            }
        } catch (Exception e) {
            // Entry not found
        }
        return null;
    }

    private String findBlobEntry(String owner, String repo, String treeHash, String name) {
        return findTreeEntry(owner, repo, treeHash, name);
    }

    private List<BlameEntry> calculateBlame(String owner, String repo, String commitHash, String filePath) {
        try {
            FileContentResponse targetFile = getFileAtCommit(owner, repo, commitHash, filePath);
            List<String> currentLines = splitLines(targetFile.getContent());

            CommitMeta targetMeta = readCommitMeta(owner, repo, commitHash);

            List<LineState> states = new ArrayList<>();
            for (String line : currentLines) {
                states.add(new LineState(line, targetMeta));
            }

            blameWalk(owner, repo, commitHash, filePath, states, new HashSet<>());

            List<BlameEntry> result = new ArrayList<>();
            for (int i = 0; i < states.size(); i++) {
                CommitMeta meta = states.get(i).commitMeta;

                result.add(new BlameEntry(
                        meta.sha,
                        meta.sha.length() >= 8 ? meta.sha.substring(0, 8) : meta.sha,
                        meta.author,
                        meta.message,
                        meta.timestamp,
                        i + 1,
                        states.get(i).content
                ));
            }

            return result;

        } catch (Exception e) {
            throw new NotFoundException("blame failed: " + e.getMessage());
        }
    }
    private List<CommitResponse> getCommitHistory(String owner, String repo, String commitHash, String path, int limit) {
        List<CommitResponse> history = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(commitHash);

        while (!queue.isEmpty() && history.size() < limit) {
            String currentHash = queue.poll();
            if (visited.contains(currentHash)) continue;
            visited.add(currentHash);

            try {
                byte[] commitData = minioStorageService.getObjectBytes(owner, repo, currentHash);
                VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
                VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

                // Check if this commit affects the specified path
                if (path != null && !path.isEmpty()) {
                    boolean affectsPath = doesCommitAffectPath(owner, repo, currentHash, path);
                    if (!affectsPath) {
                        queue.addAll(commitInfo.parents());
                        continue;
                    }
                }

                history.add(readCommitResponse(owner, repo, currentHash));

                queue.addAll(commitInfo.parents());
            } catch (Exception e) {
                // Skip
            }
        }

        return history;
    }

    private boolean doesCommitAffectPath(String owner, String repo, String commitHash, String path) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String currentBlobHash = findBlobHashByPath(owner, repo, commitInfo.tree(), path);

            // If the file does not exist in this commit, this commit does not affect it
            // for normal file history listing.
            if (currentBlobHash == null) {
                return false;
            }

            // Root commit: if file exists here, this commit introduced it.
            if (commitInfo.parents() == null || commitInfo.parents().isEmpty()) {
                return true;
            }

            // If any parent has the same blob hash, this commit did not change the file
            // compared to that parent.
            for (String parentHash : commitInfo.parents()) {
                try {
                    byte[] parentCommitData = minioStorageService.getObjectBytes(owner, repo, parentHash);
                    VicObjectFormat.ParsedObject parentCommitObj = VicObjectFormat.parseCompressed(parentCommitData);
                    VicObjectFormat.CommitData parentCommitInfo =
                            VicObjectFormat.parseCommitContent(parentCommitObj.content());

                    String parentBlobHash = findBlobHashByPath(owner, repo, parentCommitInfo.tree(), path);

                    if (Objects.equals(currentBlobHash, parentBlobHash)) {
                        return false;
                    }

                } catch (Exception ignored) {
                    // If one parent cannot be read, continue checking other parents.
                }
            }

            // Blob exists in current commit and differs from all readable parents,
            // so this commit added or modified the file.
            return true;

        } catch (Exception e) {
            return false;
        }
    }

    private String findBlobHashByPath(String owner, String repo, String treeHash, String path) {
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
            return findBlobEntry(owner, repo, currentTree, fileName);

        } catch (Exception e) {
            return null;
        }
    }

    private List<TreeEntry> getTreeEntries(String owner, String repo, String commitHash, String path) {
        List<TreeEntry> entries = new ArrayList<>();

        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String currentTree = commitInfo.tree();

            // Navigate to subdirectory if path specified
            if (!path.isEmpty()) {
                String[] parts = path.split("/");
                for (String part : parts) {
                    currentTree = findTreeEntry(owner, repo, currentTree, part);
                    if (currentTree == null) {
                        throw new NotFoundException("directory not found: " + path);
                    }
                }
            }

            // Read tree entries
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, currentTree);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\t");
                if (parts.length >= 4) {
                    TreeEntry entry = new TreeEntry(
                            parts[3], // name
                            parts[1], // type (blob/tree)
                            parts[0], // mode
                            parts[2], // hash
                            path.isEmpty() ? parts[3] : path + "/" + parts[3]
                    );
                    entries.add(entry);
                }
            }
        } catch (Exception e) {
            throw new NotFoundException("tree not found: " + e.getMessage());
        }

        return entries;
    }

    private String buildRepositoryDiff(String owner, String repo, String baseHash, String headHash) {
        StringBuilder out = new StringBuilder();

        CompareResponse compare = compareTrees(owner, repo, baseHash, headHash);
        if (compare.getFiles() == null) {
            return "";
        }

        for (FileDiff file : compare.getFiles()) {
            if (file.isBinary()) {
                continue;
            }
            String path = file.getPath();
            String oldText = file.getBaseSha() == null ? "" : readBlobText(owner, repo, file.getBaseSha());
            String newText = file.getHeadSha() == null ? "" : readBlobText(owner, repo, file.getHeadSha());

            out.append(buildUnifiedPatch(path, oldText, newText));
            if (out.length() == 0 || out.charAt(out.length() - 1) != '\n') {
                out.append("\n");
            }
        }

        return out.toString();
    }

    private CompareResponse compareTrees(String owner, String repo, String baseHash, String headHash) {
        List<FileDiff> diffs = new ArrayList<>();

        try {
            // Get base tree
            byte[] baseCommitData = minioStorageService.getObjectBytes(owner, repo, baseHash);
            VicObjectFormat.ParsedObject baseCommitObj = VicObjectFormat.parseCompressed(baseCommitData);
            VicObjectFormat.CommitData baseCommitInfo = VicObjectFormat.parseCommitContent(baseCommitObj.content());

            // Get head tree
            byte[] headCommitData = minioStorageService.getObjectBytes(owner, repo, headHash);
            VicObjectFormat.ParsedObject headCommitObj = VicObjectFormat.parseCompressed(headCommitData);
            VicObjectFormat.CommitData headCommitInfo = VicObjectFormat.parseCommitContent(headCommitObj.content());

            // Get all files in base
            Map<String, String> baseFiles = getAllFiles(owner, repo, baseCommitInfo.tree(), "");

            // Get all files in head
            Map<String, String> headFiles = getAllFiles(owner, repo, headCommitInfo.tree(), "");

            // Compare files
            Set<String> allPaths = new TreeSet<>();
            allPaths.addAll(baseFiles.keySet());
            allPaths.addAll(headFiles.keySet());
            for (String path : allPaths) {
                String baseFileHash = baseFiles.get(path);
                String headFileHash = headFiles.get(path);
                boolean binary = isBinaryBlob(owner, repo, baseFileHash) || isBinaryBlob(owner, repo, headFileHash);

                if (baseFileHash == null && headFileHash != null) {
                    String newText = binary ? "" : readBlobText(owner, repo, headFileHash);
                    String patch = binary ? null : buildUnifiedPatch(path, "", newText);
                    Integer additions = binary ? null : countLines(newText);

                    diffs.add(new FileDiff(
                            path,
                            "added",
                            null,
                            headFileHash,
                            binary,
                            additions,
                            0,
                            patch
                    ));

                } else if (baseFileHash != null && headFileHash == null) {
                    String oldText = binary ? "" : readBlobText(owner, repo, baseFileHash);
                    String patch = binary ? null : buildUnifiedPatch(path, oldText, "");
                    Integer deletions = binary ? null : countLines(oldText);

                    diffs.add(new FileDiff(
                            path,
                            "deleted",
                            baseFileHash,
                            null,
                            binary,
                            0,
                            deletions,
                            patch
                    ));

                } else if (!Objects.equals(baseFileHash, headFileHash)) {
                    String oldText = binary ? "" : readBlobText(owner, repo, baseFileHash);
                    String newText = binary ? "" : readBlobText(owner, repo, headFileHash);
                    String patch = binary ? null : buildUnifiedPatch(path, oldText, newText);

                    Integer additions = binary ? null : countPatchAdds(patch);
                    Integer deletions = binary ? null : countPatchDeletes(patch);

                    diffs.add(new FileDiff(
                            path,
                            "modified",
                            baseFileHash,
                            headFileHash,
                            binary,
                            additions,
                            deletions,
                            patch
                    ));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("compare failed: " + e.getMessage());
        }

        return new CompareResponse(baseHash, headHash, diffs);
    }

    private Map<String, String> getAllFiles(String owner, String repo, String treeHash, String prefix) {
        Map<String, String> files = new HashMap<>();

        try {
            byte[] treeData = minioStorageService.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
            String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");

            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\t");
                if (parts.length >= 4) {
                    String name = parts[3];
                    String type = parts[1];
                    String hash = parts[2];
                    String fullPath = prefix.isEmpty() ? name : prefix + "/" + name;

                    if ("tree".equals(type)) {
                        files.putAll(getAllFiles(owner, repo, hash, fullPath));
                    } else {
                        files.put(fullPath, hash);
                    }
                }
            }
        } catch (Exception e) {
            // Skip
        }

        return files;
    }
    private String readBlobText(String owner, String repo, String blobHash) {
        if (blobHash == null || blobHash.isBlank()) {
            return "";
        }

        try {
            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            if (!"blob".equals(blobObj.type())) {
                return "";
            }

            return new String(blobObj.content(), StandardCharsets.UTF_8);

        } catch (Exception e) {
            return "";
        }
    }

    private byte[] readBlobBytes(String owner, String repo, String blobHash) {
        if (blobHash == null || blobHash.isBlank()) {
            return new byte[0];
        }

        try {
            byte[] blobData = minioStorageService.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);

            if (!"blob".equals(blobObj.type())) {
                return new byte[0];
            }

            return blobObj.content();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    private boolean isBinaryBlob(String owner, String repo, String blobHash) {
        byte[] bytes = readBlobBytes(owner, repo, blobHash);
        if (bytes.length == 0) {
            return false;
        }

        for (byte value : bytes) {
            int c = value & 0xff;
            if (c == 0) {
                return true;
            }
            if (c < 32 && c != '\n' && c != '\r' && c != '\t') {
                return true;
            }
        }

        return false;
    }

    private String buildUnifiedPatch(String path, String oldText, String newText) {
        List<String> oldLines = splitLines(oldText);
        List<String> newLines = splitLines(newText);

        StringBuilder sb = new StringBuilder();
        sb.append("diff --git a/").append(path).append(" b/").append(path).append("\n");
        sb.append("--- a/").append(path).append("\n");
        sb.append("+++ b/").append(path).append("\n");
        sb.append("@@ -1,").append(oldLines.size())
                .append(" +1,").append(newLines.size())
                .append(" @@\n");

        int[][] lcs = buildLcsTable(oldLines, newLines);
        int i = 0;
        int j = 0;

        while (i < oldLines.size() && j < newLines.size()) {
            if (Objects.equals(oldLines.get(i), newLines.get(j))) {
                sb.append(" ").append(oldLines.get(i)).append("\n");
                i++;
                j++;
            } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
                sb.append("-").append(oldLines.get(i)).append("\n");
                i++;
            } else {
                sb.append("+").append(newLines.get(j)).append("\n");
                j++;
            }
        }

        while (i < oldLines.size()) {
            sb.append("-").append(oldLines.get(i)).append("\n");
            i++;
        }

        while (j < newLines.size()) {
            sb.append("+").append(newLines.get(j)).append("\n");
            j++;
        }

        return sb.toString();
    }

    private int countPatchAdds(String patch) {
        int count = 0;

        for (String line : patch.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++")) {
                count++;
            }
        }

        return count;
    }

    private int countPatchDeletes(String patch) {
        int count = 0;

        for (String line : patch.split("\n")) {
            if (line.startsWith("-") && !line.startsWith("---")) {
                count++;
            }
        }

        return count;
    }

    private int countLines(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }

        List<String> lines = splitLines(text);
        if (lines.size() == 1 && lines.get(0).isEmpty()) {
            return 0;
        }
        return lines.size();
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

    private String detectLanguage(String fileName) {
        if (fileName.endsWith(".java")) return "java";
        if (fileName.endsWith(".py")) return "python";
        if (fileName.endsWith(".js")) return "javascript";
        if (fileName.endsWith(".ts")) return "typescript";
        if (fileName.endsWith(".go")) return "go";
        if (fileName.endsWith(".xml")) return "xml";
        if (fileName.endsWith(".json")) return "json";
        if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) return "yaml";
        if (fileName.endsWith(".md")) return "markdown";
        if (fileName.endsWith(".html")) return "html";
        if (fileName.endsWith(".css")) return "css";
        if (fileName.endsWith(".sql")) return "sql";
        return "text";
    }
    private void blameWalk(
            String owner,
            String repo,
            String childCommitHash,
            String filePath,
            List<LineState> states,
            Set<String> visited
    ) {
        if (visited.contains(childCommitHash)) {
            return;
        }

        visited.add(childCommitHash);

        CommitMeta childMeta = readCommitMeta(owner, repo, childCommitHash);

        if (childMeta.parents == null || childMeta.parents.isEmpty()) {
            return;
        }

        // Simple first-parent blame.
        // For merge commits, you can later improve this by checking all parents.
        String parentHash = childMeta.parents.get(0);

        List<String> parentLines;
        try {
            FileContentResponse parentFile = getFileAtCommit(owner, repo, parentHash, filePath);
            parentLines = splitLines(parentFile.getContent());
        } catch (NotFoundException e) {
            // File did not exist in parent, so current commit introduced it.
            return;
        }

        CommitMeta parentMeta = readCommitMeta(owner, repo, parentHash);

        List<String> childLines = new ArrayList<>();
        for (LineState state : states) {
            childLines.add(state.content);
        }

        boolean[] unchangedChildLines = findUnchangedChildLines(parentLines, childLines);

        for (int i = 0; i < states.size(); i++) {
            LineState state = states.get(i);

            if (unchangedChildLines[i] && state.commitMeta.sha.equals(childCommitHash)) {
                state.commitMeta = parentMeta;
            }
        }

        blameWalk(owner, repo, parentHash, filePath, states, visited);
    }

    private List<String> splitLines(String content) {
        if (content == null || content.isEmpty()) {
            return new ArrayList<>();
        }

        return new ArrayList<>(Arrays.asList(content.split("\n", -1)));
    }

    private CommitMeta readCommitMeta(String owner, String repo, String commitHash) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String commitContent = new String(commitObj.content(), StandardCharsets.UTF_8);

            String authorHeader = extractHeader(commitContent, "author");
            String authorName = extractAuthorName(authorHeader);
            String timestamp = extractAuthorTimestamp(authorHeader);
            String message = extractMessage(commitContent);

            return new CommitMeta(
                    commitHash,
                    authorName,
                    message,
                    timestamp,
                    commitInfo.parents()
            );

        } catch (Exception e) {
            throw new NotFoundException("commit not found: " + commitHash);
        }
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


    private boolean[] findUnchangedChildLines(List<String> parentLines, List<String> childLines) {
        boolean[] unchanged = new boolean[childLines.size()];

        int[][] lcs = buildLcsTable(parentLines, childLines);

        int i = 0;
        int j = 0;

        while (i < parentLines.size() && j < childLines.size()) {
            if (Objects.equals(parentLines.get(i), childLines.get(j))) {
                unchanged[j] = true;
                i++;
                j++;
            } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
                i++;
            } else {
                j++;
            }
        }

        return unchanged;
    }

    private int[][] buildLcsTable(List<String> a, List<String> b) {
        int[][] dp = new int[a.size() + 1][b.size() + 1];

        for (int i = a.size() - 1; i >= 0; i--) {
            for (int j = b.size() - 1; j >= 0; j--) {
                if (Objects.equals(a.get(i), b.get(j))) {
                    dp[i][j] = dp[i + 1][j + 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
        }

        return dp;
    }


    private CommitResponse readCommitResponse(String owner, String repo, String commitHash) {
        try {
            byte[] commitData = minioStorageService.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());

            String commitContent = new String(commitObj.content(), StandardCharsets.UTF_8);

            return new CommitResponse(
                    commitHash,
                    commitHash.length() >= 8 ? commitHash.substring(0, 8) : commitHash,
                    extractAuthorName(extractHeader(commitContent, "author")),
                    extractAuthorName(extractHeader(commitContent, "committer")),
                    extractMessage(commitContent),
                    extractAuthorTimestamp(extractHeader(commitContent, "author")),
                    commitInfo.parents()
            );
        } catch (Exception e) {
            throw new NotFoundException("commit not found: " + commitHash);
        }
    }

    // ─── Response DTOs ────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class FileContentResponse {
        private String name;
        private String path;
        private String sha;
        private String content;
        private long size;
        private String language;
        private String commitSha;

    }

    @Data
    @AllArgsConstructor
    public static class BlameEntry {
        private String commitSha;
        private String shortSha;
        private String author;
        private String message;
        private String timestamp;
        private int lineNumber;
        private String content;
    }

    @Data
    @AllArgsConstructor
    public static class CommitResponse {
        private String sha;
        private String shortSha;
        private String author;
        private String committer;
        private String message;
        private String timestamp;
        private List<String> parents;
    }

    @AllArgsConstructor
    @Data
    public static class TreeEntry {
        private String name;
        private String type;
        private String mode;
        private String sha;
        private String path;

    }

    @Data
    @AllArgsConstructor
    public static class FileDiff {
        private String path;
        private String status;
        private String baseSha;
        private String headSha;
        private boolean binary;
        private Integer additions;
        private Integer deletions;
        private String patch;
    }

    @Data
    @AllArgsConstructor
    public static class CompareResponse {
        private String baseCommit;
        private String headCommit;
        private List<FileDiff> files;
    }

    private static class LineState {
        private final String content;
        private CommitMeta commitMeta;

        private LineState(String content, CommitMeta commitMeta) {
            this.content = content;
            this.commitMeta = commitMeta;
        }
    }

    private static class CommitMeta {
        private final String sha;
        private final String author;
        private final String message;
        private final String timestamp;
        private final List<String> parents;

        private CommitMeta(String sha, String author, String message, String timestamp, List<String> parents) {
            this.sha = sha;
            this.author = author;
            this.message = message;
            this.timestamp = timestamp;
            this.parents = parents;
        }
    }

    private String extractWildcardPath(HttpServletRequest request, String marker) {
        String fullPath = request.getRequestURI();
        int index = fullPath.indexOf(marker);

        if (index < 0) {
            throw new NotFoundException("path not found");
        }

        return fullPath.substring(index + marker.length());
    }

    private String downloadFileName(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return "download";
        }
        String normalized = filePath.replace('\\', '/');
        int slash = normalized.lastIndexOf('/');
        String name = slash >= 0 ? normalized.substring(slash + 1) : normalized;
        return name.isBlank() ? "download" : name;
    }
}

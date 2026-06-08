package com.final_project.versioncontrolservice.service;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.model.PullRequestConflict;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;

@Service
@AllArgsConstructor
public class PullRequestMergeService {

    private final MinioStorageService minio;
    private final DocumentExtractionService documentExtractionService;

    public MergeAnalysis analyze(
            String owner,
            String repo,
            String baseHash,
            String targetHash,
            String sourceHash
    ) {
        CommitInfo baseCommit = readCommit(owner, repo, baseHash);
        CommitInfo targetCommit = readCommit(owner, repo, targetHash);
        CommitInfo sourceCommit = readCommit(owner, repo, sourceHash);

        Map<String, TreeEntry> baseTree = readTreeRecursive(owner, repo, baseCommit.getTreeHash());
        Map<String, TreeEntry> targetTree = readTreeRecursive(owner, repo, targetCommit.getTreeHash());
        Map<String, TreeEntry> sourceTree = readTreeRecursive(owner, repo, sourceCommit.getTreeHash());

        Map<String, TreeEntry> merged = new TreeMap<>();
        List<ConflictFileAnalysis> conflicts = new ArrayList<>();

        Set<String> allPaths = new TreeSet<>();
        allPaths.addAll(baseTree.keySet());
        allPaths.addAll(targetTree.keySet());
        allPaths.addAll(sourceTree.keySet());

        for (String path : allPaths) {
            TreeEntry base = baseTree.get(path);
            TreeEntry target = targetTree.get(path);
            TreeEntry source = sourceTree.get(path);

            String baseBlob = hashOf(base);
            String targetBlob = hashOf(target);
            String sourceBlob = hashOf(source);

            // Same result on both branches
            if (Objects.equals(targetBlob, sourceBlob)) {
                if (source != null) {
                    merged.put(path, source);
                }
                continue;
            }

            // Target did not change, source changed
            if (Objects.equals(targetBlob, baseBlob)) {
                if (source != null) {
                    merged.put(path, source);
                }
                continue;
            }

            // Source did not change, target changed
            if (Objects.equals(sourceBlob, baseBlob)) {
                if (target != null) {
                    merged.put(path, target);
                }
                continue;
            }

            // Both changed differently
            conflicts.add(buildConflictFile(
                    owner,
                    repo,
                    path,
                    baseBlob,
                    targetBlob,
                    sourceBlob
            ));

        }

        if (!conflicts.isEmpty()) {
            return MergeAnalysis.builder()
                    .hasConflicts(true)
                    .conflicts(conflicts)
                    .mergedEntries(merged)
                    .build();
        }

        String mergedTreeHash = writeTree(owner, repo, merged);

        return MergeAnalysis.builder()
                .hasConflicts(false)
                .conflicts(List.of())
                .mergedEntries(merged)
                .mergedTreeHash(mergedTreeHash)
                .build();
    }

    public List<String> listChangedPathsBetweenCommits(
            String owner,
            String repo,
            String targetHash,
            String sourceHash
    ) {
        CommitInfo targetCommit = readCommit(owner, repo, targetHash);
        CommitInfo sourceCommit = readCommit(owner, repo, sourceHash);

        Map<String, TreeEntry> targetTree = readTreeRecursive(owner, repo, targetCommit.getTreeHash());
        Map<String, TreeEntry> sourceTree = readTreeRecursive(owner, repo, sourceCommit.getTreeHash());

        Set<String> allPaths = new TreeSet<>();
        allPaths.addAll(targetTree.keySet());
        allPaths.addAll(sourceTree.keySet());

        List<String> changed = new ArrayList<>();
        for (String path : allPaths) {
            if (!Objects.equals(hashOf(targetTree.get(path)), hashOf(sourceTree.get(path)))) {
                changed.add(path);
            }
        }
        return changed;
    }

    public List<FileChange> compareFilesBetweenCommits(
            String owner,
            String repo,
            String targetHash,
            String sourceHash
    ) {
        CommitInfo targetCommit = readCommit(owner, repo, targetHash);
        CommitInfo sourceCommit = readCommit(owner, repo, sourceHash);

        Map<String, TreeEntry> targetTree = readTreeRecursive(owner, repo, targetCommit.getTreeHash());
        Map<String, TreeEntry> sourceTree = readTreeRecursive(owner, repo, sourceCommit.getTreeHash());

        Set<String> allPaths = new TreeSet<>();
        allPaths.addAll(targetTree.keySet());
        allPaths.addAll(sourceTree.keySet());

        List<FileChange> changes = new ArrayList<>();
        for (String path : allPaths) {
            TreeEntry target = targetTree.get(path);
            TreeEntry source = sourceTree.get(path);
            String targetBlob = hashOf(target);
            String sourceBlob = hashOf(source);

            if (Objects.equals(targetBlob, sourceBlob)) {
                continue;
            }

            byte[] targetBytes = readBlobBytesOrEmpty(owner, repo, targetBlob);
            byte[] sourceBytes = readBlobBytesOrEmpty(owner, repo, sourceBlob);
            boolean document = documentExtractionService.supports(path);
            boolean binary = !document && (isBinaryBytes(targetBytes) || isBinaryBytes(sourceBytes));
            String oldContent = binary ? null : readableContent(owner, repo, path, targetBlob);
            String newContent = binary ? null : readableContent(owner, repo, path, sourceBlob);

            changes.add(FileChange.builder()
                    .path(path)
                    .filename(path)
                    .status(target == null ? "added" : source == null ? "deleted" : "modified")
                    .baseSha(targetBlob)
                    .oldSha(targetBlob)
                    .headSha(sourceBlob)
                    .newSha(sourceBlob)
                    .binary(binary)
                    .oldContent(oldContent)
                    .baseContent(oldContent)
                    .newContent(newContent)
                    .headContent(newContent)
                    .additions(binary ? null : countChangedLines(newContent))
                    .deletions(binary ? null : countChangedLines(oldContent))
                    .build());
        }
        return changes;
    }

    public String createMergeCommit(
            String owner,
            String repo,
            String mergedTreeHash,
            String targetParentHash,
            String sourceParentHash,
            String message,
            String authorUsername
    ) {
        String author = authorUsername == null || authorUsername.isBlank()
                ? "system"
                : authorUsername.trim();

        long timestamp = Instant.now().getEpochSecond();

        StringBuilder content = new StringBuilder();
        content.append("tree ").append(mergedTreeHash).append("\n");
        content.append("parent ").append(targetParentHash).append("\n");
        content.append("parent ").append(sourceParentHash).append("\n");
        content.append("author ").append(author).append(" <").append(author).append("@vic.local> ")
                .append(timestamp).append(" +0000\n");
        content.append("committer ").append(author).append(" <").append(author).append("@vic.local> ")
                .append(timestamp).append(" +0000\n");
        content.append("\n");
        content.append(message == null || message.isBlank() ? "Merge pull request" : message.trim());
        content.append("\n");

        return writeObject(owner, repo, "commit", content.toString().getBytes(StandardCharsets.UTF_8));
    }

    public String writeMergedTreeFromResolvedFiles(
            String owner,
            String repo,
            Map<String, TreeEntry> cleanMergedEntries,
            Map<String, String> resolvedContentByPath
    ) {
        Map<String, TreeEntry> resolvedEntries = new TreeMap<>();

        for (Map.Entry<String, String> resolved : resolvedContentByPath.entrySet()) {
            String path = normalizePath(resolved.getKey());
            String content = resolved.getValue() == null ? "" : resolved.getValue();

            String blobHash = writeObject(
                    owner,
                    repo,
                    "blob",
                    content.getBytes(StandardCharsets.UTF_8)
            );

            resolvedEntries.put(path, TreeEntry.builder()
                    .path(path)
                    .name(leafName(path))
                    .mode("100644")
                    .type("blob")
                    .hash(blobHash)
                    .build());
        }

        return writeMergedTreeFromResolvedEntries(owner, repo, cleanMergedEntries, resolvedEntries);
    }

    public String writeMergedTreeFromResolvedEntries(
            String owner,
            String repo,
            Map<String, TreeEntry> cleanMergedEntries,
            Map<String, TreeEntry> resolvedEntries
    ) {
        Map<String, TreeEntry> finalEntries = new TreeMap<>(cleanMergedEntries);
        finalEntries.putAll(resolvedEntries);
        return writeTree(owner, repo, finalEntries);
    }

    public TreeEntry createBlobEntry(String owner, String repo, String path, byte[] content) {
        String normalizedPath = normalizePath(path);
        String blobHash = writeObject(
                owner,
                repo,
                "blob",
                content == null ? new byte[0] : content
        );

        return TreeEntry.builder()
                .path(normalizedPath)
                .name(leafName(normalizedPath))
                .mode("100644")
                .type("blob")
                .hash(blobHash)
                .build();
    }

    private ConflictFileAnalysis buildConflictFile(
            String owner,
            String repo,
            String path,
            String baseHash,
            String targetHash,
            String sourceHash
    ) {
        byte[] baseBytes = readBlobBytesOrEmpty(owner, repo, baseHash);
        byte[] targetBytes = readBlobBytesOrEmpty(owner, repo, targetHash);
        byte[] sourceBytes = readBlobBytesOrEmpty(owner, repo, sourceHash);

        boolean document = documentExtractionService.supportsEditableMerge(path);
        boolean binary =
                !document &&
                        (isBinaryBytes(baseBytes) ||
                                isBinaryBytes(targetBytes) ||
                                isBinaryBytes(sourceBytes));

        String baseContent = binary ? "" : readableContent(owner, repo, path, baseHash);
        String targetContent = binary ? "" : readableContent(owner, repo, path, targetHash);
        String sourceContent = binary ? "" : readableContent(owner, repo, path, sourceHash);


        List<ConflictSegmentAnalysis> segments = binary
                ? List.of(
                ConflictSegmentAnalysis.builder()
                        .id(UUID.randomUUID().toString())
                        .orderIndex(0)
                        .type(PullRequestConflict.SegmentType.CONFLICT)
                        .baseChunk(null)
                        .sourceChunk(null)
                        .targetChunk(null)
                        .content(null)
                        .build()
        )
                : buildSegmentsFromContents(baseContent, targetContent, sourceContent);


        return ConflictFileAnalysis.builder()
                .path(path)
                .baseHash(baseHash)
                .targetHash(targetHash)
                .sourceHash(sourceHash)
                .baseContent(baseContent)
                .targetContent(targetContent)
                .sourceContent(sourceContent)
                .binary(binary)
                .segments(segments)
                .build();
    }

    private List<ConflictSegmentAnalysis> buildSegmentsFromContents(
            String baseContent,
            String targetContent,
            String sourceContent
    ) {
        List<String> targetLines = splitLines(targetContent);
        List<String> sourceLines = splitLines(sourceContent);

        int[][] lcs = buildLcsTable(targetLines, sourceLines);

        List<ConflictSegmentAnalysis> segments = new ArrayList<>();
        List<String> plainBuffer = new ArrayList<>();

        int ti = 0;
        int si = 0;
        int orderIndex = 0;

        while (ti < targetLines.size() && si < sourceLines.size()) {
            if (Objects.equals(targetLines.get(ti), sourceLines.get(si))) {
                plainBuffer.add(targetLines.get(ti));
                ti++;
                si++;
                continue;
            }

            if (!plainBuffer.isEmpty()) {
                segments.add(ConflictSegmentAnalysis.builder()
                        .id(UUID.randomUUID().toString())
                        .orderIndex(orderIndex++)
                        .type(PullRequestConflict.SegmentType.PLAIN)
                        .content(joinLines(plainBuffer))
                        .build());
                plainBuffer.clear();
            }

            int targetStart = ti + 1;
            int sourceStart = si + 1;

            List<String> targetChunk = new ArrayList<>();
            List<String> sourceChunk = new ArrayList<>();

            while (ti < targetLines.size() && si < sourceLines.size()
                    && !Objects.equals(targetLines.get(ti), sourceLines.get(si))) {
                if (lcs[ti + 1][si] >= lcs[ti][si + 1]) {
                    targetChunk.add(targetLines.get(ti));
                    ti++;
                } else {
                    sourceChunk.add(sourceLines.get(si));
                    si++;
                }
            }

            while (ti < targetLines.size()
                    && (si >= sourceLines.size()
                    || lcs[ti + 1][si] > lcs[ti][si + 1])) {
                targetChunk.add(targetLines.get(ti));
                ti++;
            }

            while (si < sourceLines.size()
                    && (ti >= targetLines.size()
                    || lcs[ti][si + 1] > lcs[ti + 1][si])) {
                sourceChunk.add(sourceLines.get(si));
                si++;
            }

            segments.add(ConflictSegmentAnalysis.builder()
                    .id(UUID.randomUUID().toString())
                    .orderIndex(orderIndex++)
                    .type(PullRequestConflict.SegmentType.CONFLICT)
                    .targetStartLine(targetStart)
                    .targetEndLine(targetChunk.isEmpty() ? targetStart - 1 : targetStart + targetChunk.size() - 1)
                    .sourceStartLine(sourceStart)
                    .sourceEndLine(sourceChunk.isEmpty() ? sourceStart - 1 : sourceStart + sourceChunk.size() - 1)
                    .baseChunk("")
                    .targetChunk(joinLines(targetChunk))
                    .sourceChunk(joinLines(sourceChunk))
                    .build());
        }

        while (ti < targetLines.size()) {
            plainBuffer.add(targetLines.get(ti));
            ti++;
        }

        while (si < sourceLines.size()) {
            if (!plainBuffer.isEmpty()) {
                segments.add(ConflictSegmentAnalysis.builder()
                        .id(UUID.randomUUID().toString())
                        .orderIndex(orderIndex++)
                        .type(PullRequestConflict.SegmentType.PLAIN)
                        .content(joinLines(plainBuffer))
                        .build());
                plainBuffer.clear();
            }

            List<String> sourceTail = new ArrayList<>();
            int sourceStart = si + 1;
            while (si < sourceLines.size()) {
                sourceTail.add(sourceLines.get(si));
                si++;
            }

            segments.add(ConflictSegmentAnalysis.builder()
                    .id(UUID.randomUUID().toString())
                    .orderIndex(orderIndex++)
                    .type(PullRequestConflict.SegmentType.CONFLICT)
                    .sourceStartLine(sourceStart)
                    .sourceEndLine(sourceStart + sourceTail.size() - 1)
                    .targetStartLine(targetLines.size() + 1)
                    .targetEndLine(targetLines.size())
                    .baseChunk("")
                    .targetChunk("")
                    .sourceChunk(joinLines(sourceTail))
                    .build());
        }

        if (!plainBuffer.isEmpty()) {
            segments.add(ConflictSegmentAnalysis.builder()
                    .id(UUID.randomUUID().toString())
                    .orderIndex(orderIndex)
                    .type(PullRequestConflict.SegmentType.PLAIN)
                    .content(joinLines(plainBuffer))
                    .build());
        }

        return segments;
    }

    private List<String> splitLines(String content) {
        if (content == null || content.isEmpty()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(Arrays.asList(content.split("\\R", -1)));
    }

    private String joinLines(List<String> lines) {
        if (lines == null || lines.isEmpty()) {
            return "";
        }
        return String.join(System.lineSeparator(), lines);
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

    private boolean isBinaryContent(String content) {
        if (content == null || content.isEmpty()) return false;
        return content.contains("\u0000") ||
                !content.chars().allMatch(c -> c >= 32 || c == '\n' || c == '\r' || c == '\t');
    }

    private byte[] readBlobBytesOrEmpty(String owner, String repo, String blobHash) {
        if (blobHash == null || blobHash.isBlank()) {
            return new byte[0];
        }

        try {
            byte[] raw = minio.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);
            if (!"blob".equals(obj.type())) {
                return new byte[0];
            }
            return obj.content();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    private String decodeUtf8(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private String readableContent(String owner, String repo, String path, String blobHash) {
        byte[] bytes = readBlobBytesOrEmpty(owner, repo, blobHash);
        if (bytes.length == 0) {
            return "";
        }
        if (documentExtractionService.supports(path)) {
            try {
                return documentExtractionService.extractPlainText(path, bytes);
            } catch (Exception ignored) {
                return "";
            }
        }
        return decodeUtf8(bytes);
    }

    private boolean isBinaryBytes(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return false;
        for (byte value : bytes) {
            int c = value & 0xff;
            if (c == 0) return true;
            if (c < 32 && c != '\n' && c != '\r' && c != '\t') {
                return true;
            }
        }
        return false;
    }

    private CommitInfo readCommit(String owner, String repo, String commitHash) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, commitHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"commit".equals(obj.type())) {
                throw new BadRequestException("Object is not a commit: " + commitHash);
            }

            VicObjectFormat.CommitData data = VicObjectFormat.parseCommitContent(obj.content());

            return CommitInfo.builder()
                    .hash(commitHash)
                    .treeHash(data.tree())
                    .parents(data.parents())
                    .build();

        } catch (Exception e) {
            throw new BadRequestException("Cannot read commit " + commitHash + ": " + e.getMessage());
        }
    }

    private Map<String, TreeEntry> readTreeRecursive(String owner, String repo, String treeHash) {
        Map<String, TreeEntry> result = new TreeMap<>();
        readTreeRecursive(owner, repo, treeHash, "", result);
        return result;
    }

    private void readTreeRecursive(
            String owner,
            String repo,
            String treeHash,
            String prefix,
            Map<String, TreeEntry> result
    ) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, treeHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"tree".equals(obj.type())) {
                throw new BadRequestException("Object is not a tree: " + treeHash);
            }

            String content = new String(obj.content(), StandardCharsets.UTF_8);

            if (content.isBlank()) {
                return;
            }

            for (String line : content.split("\n")) {
                if (line == null || line.isBlank()) {
                    continue;
                }

                String[] parts = line.split("\t", 4);
                if (parts.length != 4) {
                    throw new BadRequestException("Invalid tree line: " + line);
                }

                String mode = parts[0];
                String type = parts[1];
                String hash = parts[2];
                String name = parts[3];

                String fullPath = prefix.isBlank() ? name : prefix + "/" + name;

                if ("tree".equals(type)) {
                    readTreeRecursive(owner, repo, hash, fullPath, result);
                } else if ("blob".equals(type)) {
                    result.put(fullPath, TreeEntry.builder()
                            .path(fullPath)
                            .name(name)
                            .mode(mode)
                            .type(type)
                            .hash(hash)
                            .build());
                }
            }

        } catch (Exception e) {
            throw new BadRequestException("Cannot read tree " + treeHash + ": " + e.getMessage());
        }
    }

    private String writeTree(String owner, String repo, Map<String, TreeEntry> flatEntries) {
        TreeNode root = new TreeNode();

        for (Map.Entry<String, TreeEntry> entry : flatEntries.entrySet()) {
            String path = normalizePath(entry.getKey());
            TreeEntry treeEntry = entry.getValue();

            if (treeEntry == null || treeEntry.getHash() == null || treeEntry.getHash().isBlank()) {
                continue;
            }

            root.insert(path.split("/"), treeEntry.getMode(), treeEntry.getHash());
        }

        return root.write(owner, repo);
    }

    private String writeObject(String owner, String repo, String type, byte[] content) {
        try {
            String header = type + " " + content.length + "\0";
            byte[] headerBytes = header.getBytes(StandardCharsets.UTF_8);

            byte[] full = new byte[headerBytes.length + content.length];
            System.arraycopy(headerBytes, 0, full, 0, headerBytes.length);
            System.arraycopy(content, 0, full, headerBytes.length, content.length);

            String hash = sha1Hex(full);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            try (DeflaterOutputStream dos = new DeflaterOutputStream(baos, new Deflater())) {
                dos.write(full);
            }

            minio.putObjectIfAbsent(owner, repo, hash, baos.toByteArray());

            return hash;

        } catch (Exception e) {
            throw new BadRequestException("Cannot write " + type + " object: " + e.getMessage());
        }
    }

    private String readBlobAsStringOrEmpty(String owner, String repo, String blobHash) {
        if (blobHash == null || blobHash.isBlank()) {
            return "";
        }

        try {
            byte[] raw = minio.getObjectBytes(owner, repo, blobHash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"blob".equals(obj.type())) {
                return "";
            }

            return new String(obj.content(), StandardCharsets.UTF_8);

        } catch (Exception e) {
            return "";
        }
    }

    private String hashOf(TreeEntry entry) {
        return entry == null ? null : entry.getHash();
    }

    private Integer countChangedLines(String content) {
        if (content == null || content.isEmpty()) {
            return 0;
        }
        return (int) content.lines().count();
    }

    private String normalizePath(String path) {
        return path == null ? "" : path.trim().replace("\\", "/");
    }

    private String leafName(String path) {
        String normalized = normalizePath(path);
        int idx = normalized.lastIndexOf('/');
        return idx < 0 ? normalized : normalized.substring(idx + 1);
    }

    private String sha1Hex(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hash = digest.digest(data);

        StringBuilder sb = new StringBuilder();

        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }

        return sb.toString();
    }

    @Data
    @Builder
    public static class MergeAnalysis {
        private boolean hasConflicts;
        private List<ConflictFileAnalysis> conflicts;
        private Map<String, TreeEntry> mergedEntries;
        private String mergedTreeHash;
    }


    @Data
    @Builder
    public static class ConflictFileAnalysis {
        private String path;

        private String baseHash;
        private String targetHash;
        private String sourceHash;

        private String baseContent;
        private String targetContent;
        private String sourceContent;

        private boolean binary;
        private List<ConflictSegmentAnalysis> segments;
    }

    @Data
    @Builder
    public static class ConflictSegmentAnalysis {
        private String id;
        private int orderIndex;
        private PullRequestConflict.SegmentType type;

        private String content;

        private Integer baseStartLine;
        private Integer baseEndLine;
        private Integer sourceStartLine;
        private Integer sourceEndLine;
        private Integer targetStartLine;
        private Integer targetEndLine;

        private String baseChunk;
        private String sourceChunk;
        private String targetChunk;
    }


    @Data
    @Builder
    public static class CommitInfo {
        private String hash;
        private String treeHash;
        private List<String> parents;
    }

    @Data
    @Builder
    public static class TreeEntry {
        private String path;
        private String name;
        private String mode;
        private String type;
        private String hash;
    }

    @Data
    @Builder
    public static class FileChange {
        private String path;
        private String filename;
        private String status;
        private String baseSha;
        private String oldSha;
        private String headSha;
        private String newSha;
        private boolean binary;
        private Integer additions;
        private Integer deletions;
        private String oldContent;
        private String baseContent;
        private String newContent;
        private String headContent;
    }

    private class TreeNode {
        private String mode;
        private String blobHash;
        private final Map<String, TreeNode> children = new TreeMap<>();

        void insert(String[] parts, String mode, String hash) {
            if (parts.length == 0) {
                return;
            }

            if (parts.length == 1) {
                TreeNode leaf = new TreeNode();
                leaf.mode = mode == null || mode.isBlank() ? "100644" : mode;
                leaf.blobHash = hash;
                children.put(parts[0], leaf);
                return;
            }

            TreeNode child = children.computeIfAbsent(parts[0], key -> new TreeNode());
            child.insert(Arrays.copyOfRange(parts, 1, parts.length), mode, hash);
        }

        String write(String owner, String repo) {
            if (blobHash != null && !blobHash.isBlank()) {
                return blobHash;
            }

            List<String> lines = new ArrayList<>();

            for (Map.Entry<String, TreeNode> entry : children.entrySet()) {
                String name = entry.getKey();
                TreeNode child = entry.getValue();

                String mode;
                String type;
                String hash;

                if (child.blobHash != null && !child.blobHash.isBlank()) {
                    mode = child.mode == null || child.mode.isBlank() ? "100644" : child.mode;
                    type = "blob";
                    hash = child.blobHash;
                } else {
                    mode = "040000";
                    type = "tree";
                    hash = child.write(owner, repo);
                }

                lines.add(mode + "\t" + type + "\t" + hash + "\t" + name);
            }

            String content = String.join("\n", lines);

            return writeObject(owner, repo, "tree", content.getBytes(StandardCharsets.UTF_8));
        }
    }
}

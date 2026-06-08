package com.final_project.versioncontrolservice.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Set;

@Service
@AllArgsConstructor
public class CommitGraphService {
    private final MinioStorageService minio;

    public boolean isAncestorInRepo(String owner, String repo, String ancestor, String descendant) {
        if (ancestor == null || descendant == null || ancestor.isEmpty() || descendant.isEmpty()) {
            return false;
        }
        if (ancestor.equals(descendant)) {
            return true;
        }

        Set<String> seen = new HashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(descendant);

        while (!queue.isEmpty()) {
            String cur = queue.removeFirst();
            if (cur.isEmpty() || seen.contains(cur)) {
                continue;
            }
            seen.add(cur);
            if (cur.equals(ancestor)) {
                return true;
            }

            VicObjectFormat.ParsedObject obj;
            try {
                byte[] raw = minio.getObjectBytes(owner, repo, cur);
                obj = VicObjectFormat.parseCompressed(raw);
            } catch (Exception e) {
                throw new IllegalStateException("read commit " + cur + ": " + e.getMessage(), e);
            }
            if (!"commit".equals(obj.type())) {
                throw new IllegalStateException("object " + cur + " is not a commit");
            }
            VicObjectFormat.CommitData data = VicObjectFormat.parseCommitContent(obj.content());
            for (String p : data.parents()) {
                queue.addLast(p);
            }
        }
        return false;
    }

    public String findCommonAncestor(String owner, String repo, String first, String second) {
        Set<String> firstAncestors = collectAncestors(owner, repo, first);

        ArrayDeque<String> queue = new ArrayDeque<>();
        Set<String> seen = new HashSet<>();
        queue.add(second);

        while (!queue.isEmpty()) {
            String current = queue.removeFirst();

            if (current == null || current.isBlank() || seen.contains(current)) {
                continue;
            }

            seen.add(current);

            if (firstAncestors.contains(current)) {
                return current;
            }

            VicObjectFormat.CommitData data = readCommit(owner, repo, current);
            queue.addAll(data.parents());
        }

        throw new IllegalStateException("No common ancestor found");
    }

    private Set<String> collectAncestors(String owner, String repo, String start) {
        Set<String> result = new HashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(start);

        while (!queue.isEmpty()) {
            String current = queue.removeFirst();

            if (current == null || current.isBlank() || result.contains(current)) {
                continue;
            }

            result.add(current);

            VicObjectFormat.CommitData data = readCommit(owner, repo, current);
            queue.addAll(data.parents());
        }

        return result;
    }

    private VicObjectFormat.CommitData readCommit(String owner, String repo, String hash) {
        try {
            byte[] raw = minio.getObjectBytes(owner, repo, hash);
            VicObjectFormat.ParsedObject obj = VicObjectFormat.parseCompressed(raw);

            if (!"commit".equals(obj.type())) {
                throw new IllegalStateException("object is not commit: " + hash);
            }

            return VicObjectFormat.parseCommitContent(obj.content());
        } catch (Exception e) {
            throw new IllegalStateException("read commit failed: " + hash, e);
        }
    }
}

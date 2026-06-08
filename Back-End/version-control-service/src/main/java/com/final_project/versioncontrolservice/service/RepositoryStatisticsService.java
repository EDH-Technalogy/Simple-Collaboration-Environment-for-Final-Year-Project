package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.RepositoryStatisticsResponse;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.model.PullRequest;
import com.final_project.versioncontrolservice.model.PullRequestStatus;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.Milestone;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.model.TaskStatus;
import com.final_project.versioncontrolservice.repo.MilestoneRepository;
import com.final_project.versioncontrolservice.repo.PullRequestRepository;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.HashSet;

@Service
@AllArgsConstructor
public class RepositoryStatisticsService {
    private final RepositoryService repositoryService;
    private final PullRequestRepository pullRequestRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final MinioStorageService minioStorageService;

    public RepositoryStatisticsResponse getRepositoryStatistics(String owner, String repo) {
        RepositoryDocument meta = repositoryService.loadMeta(owner, repo);
        Map<String, RepositoryStatisticsResponse.ContributorStat> statsByUser =
                new LinkedHashMap<>();
        Map<String, String> aliasToUsername = new LinkedHashMap<>();

        registerOwner(meta, statsByUser, aliasToUsername);
        registerCollaborators(meta, statsByUser, aliasToUsername);

        List<PullRequest> pullRequests =
                pullRequestRepository.findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        meta.getOwner().getUsername(),
                        meta.getRepositoryName()
                );
        for (PullRequest pullRequest : pullRequests) {
            String authorUsername = normalizeKey(
                    pullRequest.getAuthor() == null ? null : pullRequest.getAuthor().getUsername()
            );
            RepositoryStatisticsResponse.ContributorStat stat = statsByUser.get(authorUsername);
            if (stat == null) {
                continue;
            }
            stat.setPullRequests(stat.getPullRequests() + 1);
            if (pullRequest.getStatus() == PullRequestStatus.MERGED) {
                stat.setMergedPullRequests(stat.getMergedPullRequests() + 1);
            }
        }

        List<Task> tasks = taskRepository.findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
                meta.getOwner().getUsername(),
                meta.getRepositoryName()
        );
        List<Milestone> milestones = milestoneRepository.findByRepoOwner_UserNameAndRepoNameOrderByNumberDesc(
                meta.getOwner().getUsername(),
                meta.getRepositoryName()
        );
        for (Task task : tasks) {
            String assigneeUsername = normalizeKey(
                    task.getAssignedTo() == null ? null : task.getAssignedTo().getUserName()
            );
            RepositoryStatisticsResponse.ContributorStat stat = statsByUser.get(assigneeUsername);
            if (stat == null) {
                continue;
            }
            stat.setAssignedTasks(stat.getAssignedTasks() + 1);
            stat.setAssignedMarks(stat.getAssignedMarks() + safeInt(task.getMaxScore()));
            stat.setEarnedMarks(stat.getEarnedMarks() + safeInt(task.getEarnedScore()));
            if (task.getStatus() == TaskStatus.COMPLETED) {
                stat.setCompletedTasks(stat.getCompletedTasks() + 1);
            }
        }

        collectCommitStatistics(meta, statsByUser, aliasToUsername);

        List<RepositoryStatisticsResponse.ContributorStat> contributors = new ArrayList<>(statsByUser.values());
        for (RepositoryStatisticsResponse.ContributorStat stat : contributors) {
            stat.setActivityScore(
                    stat.getCommits()
                            + stat.getPullRequests()
                            + stat.getMergedPullRequests()
                            + stat.getCompletedTasks()
            );
            stat.setMarksPercentage(calculatePercentage(stat.getEarnedMarks(), stat.getAssignedMarks()));
        }
        contributors.sort(
                Comparator.comparingInt(RepositoryStatisticsResponse.ContributorStat::getActivityScore)
                        .thenComparingInt(RepositoryStatisticsResponse.ContributorStat::getCommits)
                        .thenComparing(RepositoryStatisticsResponse.ContributorStat::getUsername, String.CASE_INSENSITIVE_ORDER)
                        .reversed()
        );

        int totalCommits = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getCommits).sum();
        int totalPushes = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getPushes).sum();
        int totalPulls = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getPullRequests).sum();
        int totalMergedPulls = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getMergedPullRequests).sum();
        int totalCompletedTasks = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getCompletedTasks).sum();
        int totalActivity = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getActivityScore).sum();
        int totalMilestoneMarks = milestones.stream().mapToInt(milestone -> safeInt(milestone.getMaxScore())).sum();
        int totalAllocatedTaskMarks = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getAssignedMarks).sum();
        int totalEarnedTaskMarks = contributors.stream().mapToInt(RepositoryStatisticsResponse.ContributorStat::getEarnedMarks).sum();

        return RepositoryStatisticsResponse.builder()
                .repositoryId(meta.getId())
                .owner(meta.getOwner().getUsername())
                .repositoryName(meta.getRepositoryName())
                .overview(
                        RepositoryStatisticsResponse.Overview.builder()
                                .totalContributors(contributors.size())
                                .totalCommits(totalCommits)
                                .totalPushes(totalPushes)
                                .totalPullRequests(totalPulls)
                                .totalMergedPullRequests(totalMergedPulls)
                                .totalTasks(tasks.size())
                                .totalCompletedTasks(totalCompletedTasks)
                                .totalActivityScore(totalActivity)
                                .totalMilestoneMarks(totalMilestoneMarks)
                                .totalAllocatedTaskMarks(totalAllocatedTaskMarks)
                                .totalEarnedTaskMarks(totalEarnedTaskMarks)
                                .marksCompletionPercentage(calculatePercentage(totalEarnedTaskMarks, totalAllocatedTaskMarks))
                                .build()
                )
                .contributors(contributors)
                .build();
    }

    private void registerOwner(
            RepositoryDocument meta,
            Map<String, RepositoryStatisticsResponse.ContributorStat> statsByUser,
            Map<String, String> aliasToUsername
    ) {
        UserDTO owner = meta.getOwner();
        String username = normalizeKey(owner.getUsername());
        RepositoryStatisticsResponse.ContributorStat stat = RepositoryStatisticsResponse.ContributorStat.builder()
                .userId(owner.getId())
                .username(owner.getUsername())
                .displayName(buildDisplayName(owner.getUsername(), owner.getFirstName(), owner.getLastName()))
                .email(owner.getEmail())
                .profile(owner.getProfile())
                .build();
        statsByUser.put(username, stat);
        registerAliases(aliasToUsername, username, owner.getUsername(), owner.getFirstName(), owner.getLastName());
    }

    private void registerCollaborators(
            RepositoryDocument meta,
            Map<String, RepositoryStatisticsResponse.ContributorStat> statsByUser,
            Map<String, String> aliasToUsername
    ) {
        if (meta.getCollaborators() == null) {
            return;
        }
        for (ContributorUser collaborator : meta.getCollaborators()) {
            if (collaborator == null || collaborator.getUsername() == null || collaborator.getUsername().isBlank()) {
                continue;
            }
            if (collaborator.getContributorStatus() != null
                    && collaborator.getContributorStatus().name().equalsIgnoreCase("PENDING")) {
                continue;
            }
            String username = normalizeKey(collaborator.getUsername());
            statsByUser.putIfAbsent(
                    username,
                    RepositoryStatisticsResponse.ContributorStat.builder()
                            .userId(collaborator.getId())
                            .username(collaborator.getUsername())
                            .displayName(buildDisplayName(
                                    collaborator.getUsername(),
                                    collaborator.getFirstName(),
                                    collaborator.getLastName()
                            ))
                            .email(collaborator.getEmail())
                            .profile(collaborator.getProfile())
                            .build()
            );
            registerAliases(
                    aliasToUsername,
                    username,
                    collaborator.getUsername(),
                    collaborator.getFirstName(),
                    collaborator.getLastName()
            );
        }
    }

    private void collectCommitStatistics(
            RepositoryDocument meta,
            Map<String, RepositoryStatisticsResponse.ContributorStat> statsByUser,
            Map<String, String> aliasToUsername
    ) {
        if (meta.getBranchHeads() == null || meta.getBranchHeads().isEmpty()) {
            return;
        }
        Deque<String> queue = new ArrayDeque<>();
        for (String hash : meta.getBranchHeads().values()) {
            if (hash != null && !hash.isBlank()) {
                queue.add(hash.trim());
            }
        }
        Set<String> visited = new HashSet<>();

        while (!queue.isEmpty()) {
            String commitHash = queue.removeFirst();
            if (!visited.add(commitHash)) {
                continue;
            }
            CommitSnapshot commit = readCommitSnapshot(meta.getOwner().getUsername(), meta.getRepositoryName(), commitHash);
            if (commit == null) {
                continue;
            }
            String matchedUsername = aliasToUsername.get(normalizeKey(commit.author()));
            if (matchedUsername != null) {
                RepositoryStatisticsResponse.ContributorStat stat = statsByUser.get(matchedUsername);
                if (stat != null) {
                    stat.setCommits(stat.getCommits() + 1);
                    // The repository does not store push events separately, so authored commits are used as the push proxy.
                    stat.setPushes(stat.getPushes() + 1);
                }
            }
            for (String parent : commit.parents()) {
                if (parent != null && !parent.isBlank()) {
                    queue.addLast(parent.trim());
                }
            }
        }
    }

    private CommitSnapshot readCommitSnapshot(String owner, String repo, String hash) {
        try {
            byte[] raw = minioStorageService.getObjectBytes(owner, repo, hash);
            VicObjectFormat.ParsedObject parsed = VicObjectFormat.parseCompressed(raw);
            if (!Objects.equals(parsed.type(), "commit")) {
                return null;
            }
            String commitText = new String(parsed.content(), StandardCharsets.UTF_8);
            String authorHeader = VicObjectFormat.headerValue(commitText, "author");
            String author = extractAuthorName(authorHeader);
            VicObjectFormat.CommitData commitData = VicObjectFormat.parseCommitContent(parsed.content());
            return new CommitSnapshot(author, commitData.parents());
        } catch (Exception ignored) {
            return null;
        }
    }

    private void registerAliases(
            Map<String, String> aliasToUsername,
            String canonicalUsername,
            String username,
            String firstName,
            String lastName
    ) {
        putAlias(aliasToUsername, username, canonicalUsername);
        if (firstName != null && !firstName.isBlank()) {
            putAlias(aliasToUsername, firstName, canonicalUsername);
        }
        String fullName = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim())).trim();
        if (!fullName.isBlank()) {
            putAlias(aliasToUsername, fullName, canonicalUsername);
        }
    }

    private void putAlias(Map<String, String> aliasToUsername, String alias, String username) {
        String normalized = normalizeKey(alias);
        if (!normalized.isBlank()) {
            aliasToUsername.putIfAbsent(normalized, username);
        }
    }

    private String buildDisplayName(String fallbackUsername, String firstName, String lastName) {
        String fullName = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim())).trim();
        return fullName.isBlank() ? fallbackUsername : fullName;
    }

    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
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

    private int safeInt(Integer value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private double calculatePercentage(int earned, int total) {
        if (total <= 0) {
            return 0.0;
        }
        return Math.round((((double) earned / total) * 100.0) * 100.0) / 100.0;
    }

    private record CommitSnapshot(String author, List<String> parents) {}
}

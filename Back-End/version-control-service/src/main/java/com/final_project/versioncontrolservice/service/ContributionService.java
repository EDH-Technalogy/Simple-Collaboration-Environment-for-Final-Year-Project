package com.final_project.versioncontrolservice.service;
import com.final_project.versioncontrolservice.dto.ContributorUser;
import com.final_project.versioncontrolservice.dto.UserDTO;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ContributionService {
    private final AuthService authService;
    private final RepositoryService repositoryService;
    private final PullRequestRepository prRepository;
    public ContributionStats getContributionStats(String owner, String repository, String  user) {

        ContributorUser contributorUser =  authService.getContributorUser(user);
        if (contributorUser==null){
            throw new NotFoundException("User not found");
        }

        UserDTO currentOwner = authService.getUserByUsername(owner);
        if (currentOwner==null){
            throw new  NotFoundException("User not found");
        }

        RepositoryDocument repo = repositoryService.loadMeta(currentOwner.getUsername(), repository);
        if (repo==null){
            throw new   NotFoundException("Repository not found");
        }

        List<PullRequest> mergedPRs = prRepository.findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(owner, repo.getRepositoryName())
                .stream()
                .filter(req -> req.getStatus().equals(PullRequestStatus.MERGED))
                .toList();

        Map<String, ContributorInfo> contributors = new HashMap<>();

        AtomicInteger totalCommits = new AtomicInteger();
        AtomicInteger totalAdditions = new AtomicInteger();
        AtomicInteger totalDeletions = new AtomicInteger();

        for (PullRequest pullRequest : mergedPRs) {
            String author =  pullRequest.getAuthor().getUsername();
            ContributorInfo info = contributors.getOrDefault(author, new ContributorInfo(author));
            info.addPR();
            info.addCommit();

            info.addAdditions(10); // Placeholder
            info.addDeletions(5);  // Placeholder
            totalCommits.getAndIncrement();
            totalAdditions.addAndGet(10);
            totalDeletions.addAndGet(5);
            contributors.put(author, info);

        }
        // Calculate percentages
        for (ContributorInfo info : contributors.values()) {
            info.calculatePercentages(totalAdditions.get(), totalDeletions.get());
        }


        List<ContributorInfo> sortedContributors = contributors
                .values()
                .stream()
                .sorted((a, b) -> Integer.compare(b.getTotalPRs(), a.getTotalPRs()))
                .collect(Collectors.toList());

        return new ContributionStats(
                sortedContributors,
                totalCommits.get(),
                totalAdditions.get(),
                totalDeletions.get(),
                mergedPRs.size()
        );
    }

    /**
     * Get contribution graph data (like GitHub's contribution heatmap)
     */
    public ContributionGraph getContributionGraph(String owner, String repo, String username) {

        UserDTO ownerUser = authService.getUserByUsername(owner);
        if (ownerUser==null){
            throw new  NotFoundException("User not found");
        }
        UserDTO repoUser = authService.getUserByUsername(username);
        if (repoUser==null){
            throw new NotFoundException("User not found");
        }

        RepositoryDocument repositoryDocument = repositoryService.loadMeta(ownerUser.getUsername(), repo);
        if (repositoryDocument==null){
            throw new  NotFoundException("Repository not found");
        }


        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(1);

        List<PullRequest> userPRs = prRepository
                .findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(owner, repo)
                .stream()
                .filter(pr -> pr.getAuthor().getUsername().equals(repoUser.getUsername()))
                .filter(pr -> pr.getCreatedAt() != null)
                .toList();

        Map<LocalDate, Integer> dailyContributions = new HashMap<>();
        for (PullRequest pr : userPRs) {

            LocalDate date = pr.getCreatedAt()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            dailyContributions.merge(date, 1, Integer::sum);

        }

        List<ContributionDay> days = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            int count = dailyContributions.getOrDefault(current, 0);
            days.add(new ContributionDay(current.toString(), count));
            current = current.plusDays(1);
        }
        return new ContributionGraph(repoUser.getUsername(), days);
    }

    /**
     * Get user activity feed
     */

    public List<ActivityEvent> getUserActivity(String username, int limit) {
        UserDTO currentUser = authService.getUserByUsername(username);
        if (currentUser==null){
            throw new NotFoundException("User not found");
        }

        List<PullRequest> userPRs = prRepository.findAll()
                .stream()
                .filter(pr -> pr.getAuthor() != null)
                .filter(pr -> pr.getAuthor().getUsername() != null)
                .filter(pr -> pr.getAuthor().getUsername().equalsIgnoreCase(currentUser.getUsername()))
                .toList();

        List<ActivityEvent> events = new ArrayList<>();
        for (PullRequest pr : userPRs) {
            if (pr.getCreatedAt() != null) {
                events.add(new ActivityEvent(
                        pr.getId(),
                        EventType.PULL_REQUEST,
                        pr.getStatus() == null ? "OPENED" : pr.getStatus().toString(),
                        pr.getTitle(),
                        repoSlug(pr),
                        pr.getCreatedAt()
                ));
            }
            if (pr.getStatus() == PullRequestStatus.MERGED && pr.getMergedAt() != null) {
                events.add(new ActivityEvent(
                        pr.getId() + "-merged",
                        EventType.PULL_REQUEST,
                        "MERGED",
                        pr.getTitle(),
                        repoSlug(pr),
                        pr.getMergedAt()
                ));
            }
        }

        return events.stream()
                .sorted(Comparator.comparing(ActivityEvent::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(Math.max(1, limit))
                .toList();
    }

    private String repoSlug(PullRequest pullRequest) {
        String owner = "";
        if (pullRequest.getRepoOwner() != null && pullRequest.getRepoOwner().getUsername() != null) {
            owner = pullRequest.getRepoOwner().getUsername().trim();
        }
        String repoName = pullRequest.getRepoName() == null ? "" : pullRequest.getRepoName().trim();
        return owner.isBlank() ? repoName : owner + "/" + repoName;
    }


    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ContributionStats {
        private List<ContributorInfo> contributors;
        private int totalCommits;
        private int totalAdditions;
        private int totalDeletions;
        private int totalPRs;

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ContributorInfo {
        private String username;
        private int totalPRs;
        private int totalCommits;
        private int additions;
        private int deletions;
        private double additionPercentage;
        private double deletionPercentage;

        public void calculatePercentages(int totalAdditions, int totalDeletions) {
            this.additionPercentage = totalAdditions > 0 ?
                    (double) additions / totalAdditions * 100 : 0;
            this.deletionPercentage = totalDeletions > 0 ?
                    (double) deletions / totalDeletions * 100 : 0;
        }
        public ContributorInfo(String username){
            this.username = username;
        }
        public void addPR() { this.totalPRs++; }
        public void addCommit() { this.totalCommits++; }
        public void addAdditions(int count) { this.additions += count; }
        public void addDeletions(int count) { this.deletions += count; }

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ContributionGraph {
        private String username;
        private List<ContributionDay> contributions;
    }

    @Builder
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ContributionDay {
        private String date;
        private int count;
    }


    @AllArgsConstructor
    @Data
    @NoArgsConstructor
    @Builder
    public static class ActivityEvent {
        private String id;
        private EventType type;
        private String  action;
        private String title;
        private String repo;
        private Instant timestamp;
    }
}

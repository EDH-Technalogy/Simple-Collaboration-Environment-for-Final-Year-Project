package com.final_project.versioncontrolservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryStatisticsResponse {
    private String repositoryId;
    private String owner;
    private String repositoryName;
    private Overview overview;

    @Builder.Default
    private List<ContributorStat> contributors = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overview {
        private int totalContributors;
        private int totalCommits;
        private int totalPushes;
        private int totalPullRequests;
        private int totalMergedPullRequests;
        private int totalTasks;
        private int totalCompletedTasks;
        private int totalActivityScore;
        private int totalMilestoneMarks;
        private int totalAllocatedTaskMarks;
        private int totalEarnedTaskMarks;
        private double marksCompletionPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContributorStat {
        private String userId;
        private String username;
        private String displayName;
        private String email;
        private String profile;
        private int commits;
        private int pushes;
        private int pullRequests;
        private int mergedPullRequests;
        private int assignedTasks;
        private int completedTasks;
        private int activityScore;
        private int assignedMarks;
        private int earnedMarks;
        private double marksPercentage;
    }
}

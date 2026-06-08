package com.final_project.versioncontrolservice.event;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.final_project.versioncontrolservice.model.RepositoryEventType;
import com.final_project.versioncontrolservice.model.RepositoryMemberRecipient;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RepositoryOperationEvent {

    private String eventId;
    private RepositoryEventType eventType;

    private String repositoryId;
    private String repositoryName;
    private String repositoryUrl;

    private String actorUserId;
    private String actorName;
    private String actorEmail;

    private String ownerUserId;
    private String ownerName;
    private String ownerEmail;

    private String branchName;
    private String sourceBranch;
    private String targetBranch;

    private String commitId;
    private String commitMessage;
    private Integer commitCount;

    private String pullRequestId;
    private String pullRequestTitle;
    private String pullRequestUrl;

    private String invitedUserId;
    private String invitedUserName;
    private String invitedUserEmail;

    private List<RepositoryMemberRecipient> recipients;

    private LocalDateTime occurredAt;

    private Map<String, Object> metadata;
}
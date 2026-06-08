package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.event.RepositoryOperationEvent;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.kafka.KafkaProducer;
import com.final_project.versioncontrolservice.model.*;
import com.final_project.versioncontrolservice.repo.PullRequestConflictRepository;
import com.final_project.versioncontrolservice.repo.PullRequestRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import com.final_project.versioncontrolservice.model.Task;
import com.final_project.versioncontrolservice.repo.TaskRepository;
import com.final_project.versioncontrolservice.service.TaskService;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PullRequestApplicationService {
    private final PullRequestMergeService pullRequestMergeService;
    private final DocumentExtractionService documentExtractionService;
    private final PullRequestConflictRepository pullRequestConflictRepository;

    private final PullRequestRepository pullRequestRepository;
    private final CommitGraphService commitGraphService;
    private final RepositoryService repositoryService;
    private final AuthService authService;
    private final KafkaProducer kafkaProducer;
    private final FacultyProjectService facultyProjectService;
        private final TaskService taskService;
        private final TaskRepository taskRepository;
    private final AppProperties appProperties;
    public PullRequestResponse create(
            String owner,
            String repo,
            CreatePullRequest request
    ) {
        ContributorUser authorContributor =  authService.getContributorUser(request.getAuthor());
        if (authorContributor == null) {
            throw new NotFoundException("Contributor Not Found");
        }
        UserDTO repoOwner = authService.getUserByUsername(owner);
        if (repoOwner == null) {
            throw new NotFoundException("User Not Found");
        }

        RepositoryDocument currentDocument = repositoryService.loadMeta(owner, repo);
        if (currentDocument == null) {
            throw new NotFoundException("The Current Repository does not exist");
        }

        String headSource = repositoryService.listBranchHash(currentDocument, request.getSourceBranch());
        if (headSource.isEmpty()) {
            throw new BadRequestException("source branch \"" + request.getSourceBranch() + "\" does not exist");
        }

        String headTarget = repositoryService.listBranchHash(currentDocument, request.getTargetBranch());
        if (headTarget.isEmpty()) {
            throw new BadRequestException("target branch \"" + request.getTargetBranch()  + "\" does not exist");
        }

       PullRequest pullRequest = PullRequest
               .builder()
               .repoName(repo)
               .sourceBranch(request.getSourceBranch())
               .sourceHash(headSource)
               .targetBranch(request.getTargetBranch())
               .targetHash(headTarget)
               .status(PullRequestStatus.OPENED)
               .author(
                       PullRequestUser
                               .builder()
                               .email(authorContributor.getEmail())
                               .firstName(authorContributor.getFirstName())
                               .username(authorContributor.getUsername())
                               .id(authorContributor.getId())
                               .profile(authorContributor.getProfile())
                               .build()
               )

               .createdAt(Instant.now())
               .description(request.getDescription())
               .title(request.getTitle())
               .repoOwner(
                       PullRequestUser
                               .builder()
                               .email(repoOwner.getEmail())
                               .firstName(repoOwner.getFirstName())
                               .username(repoOwner.getUsername())
                               .id(repoOwner.getId())
                               .profile(repoOwner.getProfile())
                               .build()
               )
               .build();
        PullRequest saved = pullRequestRepository.save(pullRequest);
        publishPullRequestOpenedEvent(saved, currentDocument);
        return PullRequestResponse.from(saved);
    }

    public List<PullRequestResponse> list(String owner, String repo) {

        RepositoryDocument document = repositoryService.loadMeta(owner, repo);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }
        List<PullRequest> list =  pullRequestRepository
                .findByRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(document.getOwner().getUsername(), document.getRepositoryName());

        return list
                .stream()
                .map(PullRequestResponse::from).collect(Collectors.toList());
    }

    public PullRequestResponse find(String id, String owner, String repo) {
        RepositoryDocument document = repositoryService.loadMeta(owner, repo);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }

        PullRequest result =  pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(id, document.getOwner().getUsername(), document.getRepositoryName())
                .orElseThrow(() -> new NotFoundException("pull request not found"));
        return PullRequestResponse.from(result);
    }



    public List<PullRequestMergeService.FileChange> listChangedFiles(String pullId, String owner, String repoName) {
        PullRequestDiffContext context = diffContext(pullId, owner, repoName);
        return pullRequestMergeService.compareFilesBetweenCommits(
                context.document().getOwner().getUsername(),
                context.document().getRepositoryName(),
                context.targetHash(),
                context.sourceHash()
        );
    }

    public PullRequestMergeService.FileChange getChangedFileDiff(String pullId, String owner, String repoName, int fileIndex) {
        List<PullRequestMergeService.FileChange> files = listChangedFiles(pullId, owner, repoName);
        if (fileIndex < 0 || fileIndex >= files.size()) {
            throw new NotFoundException("Pull request file not found");
        }
        return files.get(fileIndex);
    }

    private PullRequestDiffContext diffContext(String pullId, String owner, String repoName) {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullId,
                        document.getOwner().getUsername(),
                        document.getRepositoryName()
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        String sourceHash = repositoryService.listBranchHash(document, pullRequest.getSourceBranch());
        if (sourceHash == null || sourceHash.isBlank()) {
            sourceHash = pullRequest.getSourceHash();
        }

        String targetHash = repositoryService.listBranchHash(document, pullRequest.getTargetBranch());
        if (targetHash == null || targetHash.isBlank()) {
            targetHash = pullRequest.getTargetHash();
        }

        if (sourceHash == null || sourceHash.isBlank() || targetHash == null || targetHash.isBlank()) {
            throw new NotFoundException("Pull request branch ref not found");
        }

        return new PullRequestDiffContext(document, sourceHash, targetHash);
    }

    private record PullRequestDiffContext(
            RepositoryDocument document,
            String sourceHash,
            String targetHash
    ) {}

    public MergeResponse merge(String pullId, String owner, String repoName) throws IOException {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);
        if (document == null) {
            throw new  NotFoundException("The Current Repository does not exist");
        }
        PullRequest pullRequest = pullRequestRepository.findById(pullId)
                .orElseThrow(() -> new NotFoundException("Pull Request not found"));

        if (!pullRequest.getStatus().equals(PullRequestStatus.OPENED)){
            throw new  BadRequestException("Pull Request Status Not Opened");
        }

        String sourceHash = repositoryService.listBranchHash(document, pullRequest.getSourceBranch());

        if (sourceHash.isEmpty()) {
            throw new BadRequestException("source branch does not exist");
        }

        String targetHash = repositoryService.listBranchHash(document, pullRequest.getTargetBranch());

        if (targetHash.isEmpty()) {
            throw new BadRequestException("target branch does not exist");
        }

        if (sourceHash.equals(targetHash)) {
            markMerged(pullRequest.getId());

            return MergeResponse.builder()
                    .mergedAt(Instant.now())
                    .pullRequestId(pullRequest.getId())
                    .status(PullRequestStatus.MERGED)
                    .targetBranch(pullRequest.getTargetBranch())
                    .sourceBranch(pullRequest.getSourceBranch())
                    .newHead(targetHash)
                    .message("Already up to date")
                    .build();
        }

        boolean canFf;

        try {
            canFf = commitGraphService.isAncestorInRepo(
                    document.getOwner().getUsername(),
                    document.getRepositoryName(),
                    targetHash,
                    sourceHash
            );
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }

        if (canFf) {
            RepositoryDocument mergedRepository = repositoryService.loadMeta(
                    document.getOwner().getUsername(),
                    document.getRepositoryName()
            );

            repositoryService.updateBranchRef(
                    mergedRepository,
                    pullRequest.getTargetBranch(),
                    sourceHash
            );

            pullRequest.setStatus(PullRequestStatus.MERGED);
            pullRequest.setMergedAt(Instant.now());
            pullRequest.setTargetHash(sourceHash);
            PullRequest saved = pullRequestRepository.save(pullRequest);

            publishPullRequestMergedEvent(saved, mergedRepository);

                        // Auto-complete any tasks linked to this pull request (best-effort)
                        try {
                                List<Task> linkedTasks = taskRepository.findByLinkedPrId(saved.getId());
                                for (Task task : linkedTasks) {
                                        try {
                                                TaskService.CompleteTaskRequest req = TaskService.CompleteTaskRequest.builder()
                                                                .pullRequestId(saved.getId())
                                                                .feedback("Auto-completed on PR merge")
                                                                .score(null)
                                                                .build();
                                                taskService.completeTask(mergedRepository.getOwner().getUsername(), mergedRepository.getRepositoryName(), task.getNumber(), req, mergedRepository.getOwner().getUsername());
                                        } catch (Exception ex) {
                                                log.warn("Failed to auto-complete task #{} for PR {}: {}", task.getNumber(), saved.getId(), ex.getMessage());
                                        }
                                }
                        } catch (Exception ignored) {
                        }

            return MergeResponse.builder()
                    .mergedAt(saved.getMergedAt())
                    .pullRequestId(saved.getId())
                    .status(PullRequestStatus.MERGED)
                    .targetBranch(saved.getTargetBranch())
                    .sourceBranch(saved.getSourceBranch())
                    .newHead(sourceHash)
                    .message("Fast-forward merge")
                    .build();
        }


        //  NON FAST-FORWARD → REAL MERGE
        String baseHash = commitGraphService.findCommonAncestor(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                targetHash,
                sourceHash
        );

        PullRequestMergeService.MergeAnalysis analysis =
                pullRequestMergeService.analyze(
                        document.getOwner().getUsername(),
                        document.getRepositoryName(),
                        baseHash,
                        targetHash,
                        sourceHash
                );

        //  IF CONFLICT → STORE IN DB
        if (analysis.isHasConflicts()) {

            pullRequestConflictRepository.deleteByPullRequestId(pullRequest.getId());

            var conflict = com.final_project.versioncontrolservice.model.PullRequestConflict.builder()
                    .pullRequestId(pullRequest.getId())
                    .owner(document.getOwner().getUsername())
                    .repoName(document.getRepositoryName())
                    .sourceBranch(pullRequest.getSourceBranch())
                    .targetBranch(pullRequest.getTargetBranch())
                    .baseHash(baseHash)
                    .sourceHash(sourceHash)
                    .targetHash(targetHash)
                    .files(
                            analysis.getConflicts().stream()
                                    .map(c -> PullRequestConflict.ConflictFile.builder()
                                            .path(c.getPath())
                                            .binary(c.isBinary())
                                            .baseHash(c.getBaseHash())
                                            .sourceHash(c.getSourceHash())
                                            .targetHash(c.getTargetHash())
                                            .segments(
                                                    c.getSegments().stream()
                                                            .map(segment -> PullRequestConflict.FileSegment.builder()
                                                                    .id(segment.getId())
                                                                    .orderIndex(segment.getOrderIndex())
                                                                    .type(segment.getType())
                                                                    .content(segment.getContent())
                                                                    .baseStartLine(segment.getBaseStartLine())
                                                                    .baseEndLine(segment.getBaseEndLine())
                                                                    .sourceStartLine(segment.getSourceStartLine())
                                                                    .sourceEndLine(segment.getSourceEndLine())
                                                                    .targetStartLine(segment.getTargetStartLine())
                                                                    .targetEndLine(segment.getTargetEndLine())
                                                                    .baseChunk(segment.getBaseChunk())
                                                                    .sourceChunk(segment.getSourceChunk())
                                                                    .targetChunk(segment.getTargetChunk())
                                                                    .resolved(false)
                                                                    .build())
                                                            .toList()
                                            )
                                            .resolved(false)
                                            .build()
                                    )
                                    .toList()
                    )

                    .resolved(false)
                    .createdAt(Instant.now())
                    .build();

            pullRequestConflictRepository.save(conflict);

            pullRequest.setStatus(PullRequestStatus.CONFLICTING);
            PullRequest saved =  pullRequestRepository.save(pullRequest);
            throw new BadRequestException("Merge conflict detected. Resolve conflicts first.");
        }

        //  NO CONFLICT → CREATE MERGE COMMIT
        String mergeCommitHash = pullRequestMergeService.createMergeCommit(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                analysis.getMergedTreeHash(),
                targetHash,
                sourceHash,
                "Merge branch '" + pullRequest.getSourceBranch() +
                        "' into '" + pullRequest.getTargetBranch() + "'",
                pullRequest.getAuthor().getUsername()
        );

        // UPDATE BRANCH
        RepositoryDocument mergedRepository = repositoryService.loadMeta(
                document.getOwner().getUsername(),
                document.getRepositoryName()
        );

        repositoryService.updateBranchRef(
                mergedRepository,
                pullRequest.getTargetBranch(),
                mergeCommitHash
        );

        pullRequest.setStatus(PullRequestStatus.MERGED);
        pullRequest.setMergedAt(Instant.now());
        pullRequest.setTargetHash(mergeCommitHash);
        PullRequest saved = pullRequestRepository.save(pullRequest);
        publishPullRequestMergedEvent(saved, mergedRepository);
                // Auto-complete any tasks linked to this pull request (best-effort)
                try {
                        List<Task> linkedTasks = taskRepository.findByLinkedPrId(saved.getId());
                        for (Task task : linkedTasks) {
                                try {
                                        TaskService.CompleteTaskRequest req = TaskService.CompleteTaskRequest.builder()
                                                        .pullRequestId(saved.getId())
                                                        .feedback("Auto-completed on PR merge")
                                                        .score(null)
                                                        .build();
                                        taskService.completeTask(mergedRepository.getOwner().getUsername(), mergedRepository.getRepositoryName(), task.getNumber(), req, mergedRepository.getOwner().getUsername());
                                } catch (Exception ex) {
                                        log.warn("Failed to auto-complete task #{} for PR {}: {}", task.getNumber(), saved.getId(), ex.getMessage());
                                }
                        }
                } catch (Exception ignored) {
                }



        return MergeResponse.builder()
                .mergedAt(Instant.now())
                .pullRequestId(pullRequest.getId())
                .status(PullRequestStatus.MERGED)
                .targetBranch(pullRequest.getTargetBranch())
                .sourceBranch(pullRequest.getSourceBranch())
                .newHead(mergeCommitHash)
                .message("Merged successfully")
                .build();
    }

    public MergeConflictResponse getConflicts(String pullId, String owner, String repoName) {
        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullId,
                        document.getOwner().getUsername(),
                        document.getRepositoryName()
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        PullRequestConflict conflict = pullRequestConflictRepository
                .findByPullRequestIdAndResolvedFalse(pullRequest.getId())
                .orElseThrow(() -> new NotFoundException("No active conflicts found for this pull request"));

        return MergeConflictResponse.builder()
                .pullRequestId(pullRequest.getId())
                .status(pullRequest.getStatus().name())
                .conflicts(
                        conflict.getFiles().stream()
                                .map(file -> MergeConflictResponse.ConflictFileDTO.builder()
                                        .path(file.getPath())
                                        .binary(file.isBinary())
                                        .baseHash(file.getBaseHash())
                                        .sourceHash(file.getSourceHash())
                                        .targetHash(file.getTargetHash())
                                        .segments(
                                                file.getSegments().stream()
                                                        .map(segment -> MergeConflictResponse.SegmentDTO.builder()
                                                                .id(segment.getId())
                                                                .orderIndex(segment.getOrderIndex())
                                                                .type(segment.getType().name())
                                                                .content(segment.getContent())
                                                                .sourceStartLine(segment.getSourceStartLine())
                                                                .sourceEndLine(segment.getSourceEndLine())
                                                                .targetStartLine(segment.getTargetStartLine())
                                                                .targetEndLine(segment.getTargetEndLine())
                                                                .baseChunk(file.isBinary() ? null : segment.getBaseChunk())
                                                                .sourceChunk(file.isBinary() ? null : segment.getSourceChunk())
                                                                .targetChunk(file.isBinary() ? null : segment.getTargetChunk())
                                                                .resolved(segment.isResolved())
                                                                .resolvedChunk(file.isBinary() ? null : segment.getResolvedChunk())
                                                                .resolution(segment.getResolution() == null ? null : segment.getResolution().name())
                                                                .build())
                                                        .toList()
                                        )
                                        .build())
                                .toList()
                )
                .build();
    }

    public MergeResponse resolveConflicts(
            String pullId,
            String owner,
            String repoName,
            ResolveConflictRequest request
    ) throws IOException {
        if (request == null || request.getFiles() == null || request.getFiles().isEmpty()) {
            throw new BadRequestException("Conflict resolutions are required");
        }

        RepositoryDocument document = repositoryService.loadMeta(owner, repoName);

        PullRequest pullRequest = pullRequestRepository
                .findByIdAndRepoOwner_UsernameIgnoreCaseAndRepoNameIgnoreCase(
                        pullId,
                        document.getOwner().getUsername(),
                        document.getRepositoryName()
                )
                .orElseThrow(() -> new NotFoundException("Pull request not found"));

        PullRequestConflict conflict = pullRequestConflictRepository
                .findByPullRequestIdAndResolvedFalse(pullRequest.getId())
                .orElseThrow(() -> new NotFoundException("No active conflicts found for this pull request"));

        Map<String, ResolveConflictRequest.FileResolution> fileResolutions =
                request.getFiles()
                        .stream()
                        .collect(Collectors.toMap(
                                ResolveConflictRequest.FileResolution::getPath,
                                Function.identity()
                        ));

        PullRequestMergeService.MergeAnalysis analysis = pullRequestMergeService.analyze(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                conflict.getBaseHash(),
                conflict.getTargetHash(),
                conflict.getSourceHash()
        );

        Map<String, PullRequestMergeService.TreeEntry> resolvedEntriesByPath = new HashMap<>();

        for (PullRequestConflict.ConflictFile file : conflict.getFiles()) {
            ResolveConflictRequest.FileResolution fileResolution = fileResolutions.get(file.getPath());

            if (fileResolution == null) {
                throw new BadRequestException("Missing resolution for file: " + file.getPath());
            }

            if (fileResolution.getBlocks() == null || fileResolution.getBlocks().isEmpty()) {
                throw new BadRequestException("Missing block resolutions for file: " + file.getPath());
            }


            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions =
                    fileResolution.getBlocks()
                            .stream()
                            .collect(Collectors.toMap(
                                    ResolveConflictRequest.BlockResolution::getBlockId,
                                    Function.identity()
                            ));

            PullRequestMergeService.TreeEntry resolvedEntry =
                    documentExtractionService.supportsEditableMerge(file.getPath())
                    ? buildResolvedDocumentEntry(
                            document.getOwner().getUsername(),
                            document.getRepositoryName(),
                            file,
                            blockResolutions
                    )
                    : file.isBinary()
                    ? buildResolvedBinaryEntry(file, blockResolutions)
                    : buildResolvedTextEntry(
                            document.getOwner().getUsername(),
                            document.getRepositoryName(),
                            file,
                            blockResolutions
                    );

            resolvedEntriesByPath.put(file.getPath(), resolvedEntry);
            file.setResolved(true);
        }

        String mergedTreeHash = pullRequestMergeService.writeMergedTreeFromResolvedEntries(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                analysis.getMergedEntries(),
                resolvedEntriesByPath
        );

        String mergeCommitHash = pullRequestMergeService.createMergeCommit(
                document.getOwner().getUsername(),
                document.getRepositoryName(),
                mergedTreeHash,
                conflict.getTargetHash(),
                conflict.getSourceHash(),
                "Merge branch '" + pullRequest.getSourceBranch() +
                        "' into '" + pullRequest.getTargetBranch() + "'",
                pullRequest.getAuthor().getUsername()
        );

        repositoryService.updateBranchRef(
                document,
                pullRequest.getTargetBranch(),
                mergeCommitHash
        );

        conflict.setResolved(true);
        conflict.setResolvedAt(Instant.now());
        pullRequestConflictRepository.save(conflict);

        pullRequest.setStatus(PullRequestStatus.MERGED);
        pullRequest.setMergedAt(Instant.now());
        pullRequest.setTargetHash(mergeCommitHash);
        PullRequest saved = pullRequestRepository.save(pullRequest);
        publishPullRequestMergedEvent(saved, document);


        return MergeResponse.builder()
                .mergedAt(pullRequest.getMergedAt())
                .pullRequestId(pullRequest.getId())
                .status(PullRequestStatus.MERGED)
                .targetBranch(pullRequest.getTargetBranch())
                .sourceBranch(pullRequest.getSourceBranch())
                .newHead(mergeCommitHash)
                .message("Conflicts resolved and pull request merged")
                .build();
    }

    private String buildResolvedFileContent(
            PullRequestConflict.ConflictFile file,
            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions
    ) {
        StringBuilder out = new StringBuilder();

        for (PullRequestConflict.FileSegment segment : file.getSegments()) {
            if (segment.getType() == PullRequestConflict.SegmentType.PLAIN) {
                out.append(segment.getContent() == null ? "" : segment.getContent());
                continue;
            }

            ResolveConflictRequest.BlockResolution blockResolution =
                    blockResolutions.get(segment.getId());

            if (blockResolution == null) {
                throw new BadRequestException(
                        "Missing resolution for conflict block: " + segment.getId()
                );
            }

            String selectedContent = resolveBlockContent(segment, blockResolution);

            segment.setResolution(blockResolution.getResolution());
            segment.setResolvedChunk(selectedContent);
            segment.setResolved(true);

            out.append(selectedContent == null ? "" : selectedContent);
        }

        return out.toString();
    }

    private PullRequestMergeService.TreeEntry buildResolvedTextEntry(
            String owner,
            String repo,
            PullRequestConflict.ConflictFile file,
            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions
    ) {
        String resolvedContent = buildResolvedFileContent(file, blockResolutions);
        return pullRequestMergeService.createBlobEntry(
                owner,
                repo,
                file.getPath(),
                resolvedContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }

    private PullRequestMergeService.TreeEntry buildResolvedDocumentEntry(
            String owner,
            String repo,
            PullRequestConflict.ConflictFile file,
            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions
    ) {
        PullRequestConflict.ConflictResolution uniformResolution = null;
        boolean hasConflictBlock = false;

        for (PullRequestConflict.FileSegment segment : file.getSegments()) {
            if (segment.getType() == PullRequestConflict.SegmentType.PLAIN) {
                continue;
            }
            hasConflictBlock = true;

            ResolveConflictRequest.BlockResolution blockResolution = blockResolutions.get(segment.getId());
            if (blockResolution == null) {
                throw new BadRequestException("Missing resolution for conflict block: " + segment.getId());
            }

            PullRequestConflict.ConflictResolution resolution = blockResolution.getResolution();
            if (resolution == PullRequestConflict.ConflictResolution.CUSTOM ||
                    resolution == PullRequestConflict.ConflictResolution.BOTH) {
                uniformResolution = null;
                break;
            }

            if (uniformResolution == null) {
                uniformResolution = resolution;
            } else if (uniformResolution != resolution) {
                uniformResolution = null;
                break;
            }
        }

        if (hasConflictBlock &&
                uniformResolution == PullRequestConflict.ConflictResolution.SOURCE &&
                file.getSourceHash() != null &&
                !file.getSourceHash().isBlank()) {
            markDocumentSegmentsResolved(file, blockResolutions, uniformResolution, file.getSourceHash());
            return existingBlobEntry(file.getPath(), file.getSourceHash());
        }

        if (hasConflictBlock &&
                uniformResolution == PullRequestConflict.ConflictResolution.TARGET &&
                file.getTargetHash() != null &&
                !file.getTargetHash().isBlank()) {
            markDocumentSegmentsResolved(file, blockResolutions, uniformResolution, file.getTargetHash());
            return existingBlobEntry(file.getPath(), file.getTargetHash());
        }

        String resolvedContent = buildResolvedFileContent(file, blockResolutions);
        byte[] mergedDocument = documentExtractionService.buildSimpleDocument(file.getPath(), resolvedContent);
        return pullRequestMergeService.createBlobEntry(owner, repo, file.getPath(), mergedDocument);
    }

    private void markDocumentSegmentsResolved(
            PullRequestConflict.ConflictFile file,
            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions,
            PullRequestConflict.ConflictResolution resolution,
            String selectedHash
    ) {
        for (PullRequestConflict.FileSegment segment : file.getSegments()) {
            if (segment.getType() == PullRequestConflict.SegmentType.PLAIN) {
                segment.setResolved(true);
                continue;
            }
            ResolveConflictRequest.BlockResolution blockResolution = blockResolutions.get(segment.getId());
            if (blockResolution == null) {
                throw new BadRequestException("Missing resolution for conflict block: " + segment.getId());
            }
            segment.setResolution(resolution);
            segment.setResolved(true);
            segment.setResolvedChunk(selectedHash);
        }
    }

    private PullRequestMergeService.TreeEntry existingBlobEntry(String path, String hash) {
        return PullRequestMergeService.TreeEntry.builder()
                .path(path)
                .name(leafName(path))
                .mode("100644")
                .type("blob")
                .hash(hash)
                .build();
    }

    private PullRequestMergeService.TreeEntry buildResolvedBinaryEntry(
            PullRequestConflict.ConflictFile file,
            Map<String, ResolveConflictRequest.BlockResolution> blockResolutions
    ) {
        PullRequestConflict.FileSegment segment = file.getSegments()
                .stream()
                .filter(item -> item.getType() == PullRequestConflict.SegmentType.CONFLICT)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Binary conflict block is missing"));

        ResolveConflictRequest.BlockResolution blockResolution = blockResolutions.get(segment.getId());
        if (blockResolution == null) {
            throw new BadRequestException("Missing resolution for binary conflict block: " + segment.getId());
        }

        String selectedHash = switch (blockResolution.getResolution()) {
            case SOURCE -> file.getSourceHash();
            case TARGET -> file.getTargetHash();
            case BOTH, CUSTOM ->
                    throw new BadRequestException("Binary conflicts only support SOURCE or TARGET resolution");
        };

        if (selectedHash == null || selectedHash.isBlank()) {
            throw new BadRequestException("Selected binary revision is missing for file: " + file.getPath());
        }

        segment.setResolution(blockResolution.getResolution());
        segment.setResolved(true);
        segment.setResolvedChunk(selectedHash);

        return PullRequestMergeService.TreeEntry.builder()
                .path(file.getPath())
                .name(leafName(file.getPath()))
                .mode("100644")
                .type("blob")
                .hash(selectedHash)
                .build();
    }

    private String resolveBlockContent(
            PullRequestConflict.FileSegment segment,
            ResolveConflictRequest.BlockResolution blockResolution
    ) {
        return switch (blockResolution.getResolution()) {
            case SOURCE -> segment.getSourceChunk() == null ? "" : segment.getSourceChunk();

            case TARGET -> segment.getTargetChunk() == null ? "" : segment.getTargetChunk();

            case BOTH -> {
                String target = segment.getTargetChunk() == null ? "" : segment.getTargetChunk();
                String source = segment.getSourceChunk() == null ? "" : segment.getSourceChunk();
                yield target + System.lineSeparator() + source;
            }

            case CUSTOM -> {
                if (blockResolution.getCustomContent() == null) {
                    throw new BadRequestException(
                            "Custom content is required for block: " + segment.getId()
                    );
                }
                yield blockResolution.getCustomContent();
            }
            };
    }

    private String leafName(String path) {
        String normalized = path == null ? "" : path.trim().replace("\\", "/");
        int idx = normalized.lastIndexOf('/');
        return idx < 0 ? normalized : normalized.substring(idx + 1);
    }

    private void markMerged(String  id) {
        PullRequest pr = pullRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("pull request not found"));
        pr.setStatus(PullRequestStatus.MERGED);
        pr.setMergedAt(Instant.now());
        pullRequestRepository.save(pr);
    }

    private boolean isBinaryContent(String content) {
        if (content == null || content.isEmpty()) return false;

        return content.contains("\u0000") || !content.chars().allMatch(c -> c >= 32 || c == '\n' || c == '\r' || c == '\t');
    }


    private void publishPullRequestOpenedEvent(
            PullRequest pullRequest,
            RepositoryDocument repository
    ) {
        RepositoryOperationEvent event = RepositoryOperationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.PULL_REQUEST_OPENED)

                .repositoryId(repository.getId())
                .repositoryName(repository.getRepositoryName())
                .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/pulls/" + pullRequest.getId()))

                .actorUserId(pullRequest.getAuthor().getId())
                .actorName(pullRequest.getAuthor().getUsername())
                .actorEmail(pullRequest.getAuthor().getEmail())

                .ownerUserId(pullRequest.getRepoOwner().getId())
                .ownerName(pullRequest.getRepoOwner().getUsername())
                .ownerEmail(pullRequest.getRepoOwner().getEmail())

                .sourceBranch(pullRequest.getSourceBranch())
                .targetBranch(pullRequest.getTargetBranch())
                .pullRequestId(pullRequest.getId())
                .pullRequestTitle(pullRequest.getTitle())
                .pullRequestUrl(buildGatewayUrl("/api/v1/repos/" + repository.getOwner().getUsername()
                        + "/" + repository.getRepositoryName()
                        + "/pulls/" + pullRequest.getId()))
                .recipients(buildNotificationRecipients(repository))
                .occurredAt(LocalDateTime.now())
                .metadata(Map.of(
                        "actionUrl", buildGatewayUrl("/api/v1/repos/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/pulls/" + pullRequest.getId()),
                        "uiPath", "/student/repository/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/pull-requests",
                        "senderUserId", pullRequest.getAuthor().getId(),
                        "senderName", pullRequest.getAuthor().getUsername(),
                        "senderEmail", pullRequest.getAuthor().getEmail(),
                        "displayType", "PULL_REQUEST_OPENED",
                        "description", pullRequest.getDescription() == null ? "" : pullRequest.getDescription(),
                        "message", pullRequest.getAuthor().getUsername()
                                + " opened a pull request: "
                                + pullRequest.getTitle()
                ))
                .build();

        kafkaProducer.produce(event);
    }

    private void publishPullRequestMergedEvent(
            PullRequest pullRequest,
            RepositoryDocument repository
    ) {
        RepositoryOperationEvent event = RepositoryOperationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(RepositoryEventType.PULL_REQUEST_MERGED)

                .repositoryId(repository.getId())
                .repositoryName(repository.getRepositoryName())
                .repositoryUrl(buildGatewayUrl("/api/v1/repos/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/contents?ref=main"))
                .actorUserId(pullRequest.getAuthor().getId())
                .actorName(pullRequest.getAuthor().getUsername())
                .actorEmail(pullRequest.getAuthor().getEmail())

                .ownerUserId(pullRequest.getRepoOwner().getId())
                .ownerName(pullRequest.getRepoOwner().getUsername())
                .ownerEmail(pullRequest.getRepoOwner().getEmail())

                .sourceBranch(pullRequest.getSourceBranch())
                .targetBranch(pullRequest.getTargetBranch())

                .pullRequestId(pullRequest.getId())
                .pullRequestTitle(pullRequest.getTitle())
                .pullRequestUrl(buildGatewayUrl("/api/v1/repos/"+repository.getOwner().getUsername()+"/"+repository.getRepositoryName()+"/pulls/"+pullRequest.getId()))
                .recipients(buildNotificationRecipients(repository))
                .occurredAt(LocalDateTime.now())
                .metadata(Map.of(
                        "actionUrl", buildGatewayUrl("/api/v1/repos/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/pulls/" + pullRequest.getId()),
                        "uiPath", "/student/repository/" + repository.getOwner().getUsername() + "/" + repository.getRepositoryName() + "/pull-requests",
                        "senderUserId", pullRequest.getAuthor().getId(),
                        "senderName", pullRequest.getAuthor().getUsername(),
                        "senderEmail", pullRequest.getAuthor().getEmail(),
                        "displayType", "PULL_REQUEST_MERGED",
                        "message", pullRequest.getAuthor().getUsername()
                                + " merged pull request: "
                                + pullRequest.getTitle()
                ))
                .build();

        kafkaProducer.produce(event);
    }

    private List<RepositoryMemberRecipient> buildNotificationRecipients(RepositoryDocument repository) {
        Map<String, RepositoryMemberRecipient> recipientsByUserId = new LinkedHashMap<>();

        if (repository.getOwner() != null && repository.getOwner().getId() != null) {
            recipientsByUserId.put(
                    repository.getOwner().getId(),
                    RepositoryMemberRecipient.builder()
                            .userId(repository.getOwner().getId())
                            .name(repository.getOwner().getUsername())
                            .email(repository.getOwner().getEmail())
                            .role("OWNER")
                            .build()
            );
        }

        if (repository.getCollaborators() != null) {
            for (ContributorUser collaborator : repository.getCollaborators()) {
                if (collaborator.getId() == null || collaborator.getId().isBlank()) {
                    continue;
                }
                recipientsByUserId.put(
                        collaborator.getId(),
                        RepositoryMemberRecipient.builder()
                                .userId(collaborator.getId())
                                .name(collaborator.getUsername())
                                .email(collaborator.getEmail())
                                .role(collaborator.getRole())
                                .build()
                );
            }
        }

        FacultyProjectDTO project = facultyProjectService.findByRepositoryId(repository.getId());
        if (project != null && project.getTeacher() != null) {
            FacultyTeacherDTO teacher = project.getTeacher();
            String recipientUserId = teacher.getKeycloakId();
            if (recipientUserId != null && !recipientUserId.isBlank()) {
                String teacherName = String.join(
                        " ",
                        teacher.getFirstName() == null ? "" : teacher.getFirstName(),
                        teacher.getLastName() == null ? "" : teacher.getLastName()
                ).trim();
                recipientsByUserId.put(
                        recipientUserId,
                        RepositoryMemberRecipient.builder()
                                .userId(recipientUserId)
                                .name(teacherName.isBlank() ? teacher.getEmail() : teacherName)
                                .email(teacher.getEmail())
                                .role("TEACHER")
                                .build()
                );
            }
        }

        return new ArrayList<>(recipientsByUserId.values());
    }

    private String buildGatewayUrl(String path) {
        String base = appProperties.getGatewayBaseUrl() == null
                ? "http://localhost:8080"
                : appProperties.getGatewayBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (path == null || path.isBlank()) {
            return base;
        }
        return path.startsWith("/") ? base + path : base + "/" + path;
    }
}

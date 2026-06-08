package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.*;
import com.final_project.versioncontrolservice.config.AppProperties;
import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.exception.NotFoundException;
import com.final_project.versioncontrolservice.model.ContributorStatus;
import com.final_project.versioncontrolservice.model.Invitation;
import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import com.final_project.versioncontrolservice.repo.InvitationRepository;
import com.final_project.versioncontrolservice.repo.RepositoryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@AllArgsConstructor
@Slf4j
public class RepositoryService {
    private final RepositoryRepository repositoryRepository;
    private final MinioStorageService minio;
    private final AuthService authService;
    private final InvitationRepository invitationRepository;
    private final RepositoryFileIndexService fileIndex;
    private final AppProperties appProperties;
    public RepositoryDocument loadMeta(String userName, String repo) {
        return repositoryRepository
            .findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(userName.trim(), repo.trim())
            .orElseThrow(() -> new NotFoundException("read repo metadata"));
    }

    public List<RepositoryResponse> searchRepositories(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        List<RepositoryDocument> results =  repositoryRepository.searchRepositories(keyword.trim());
        return results.stream().map(this::toRepositoryResponse).toList();
    }
    public RepositoryResponse createRepo(CreateRepositoryRequest request) {
        UserDTO user = authService.getUserByUsername(request.getUserName());
        if (user == null) {
            throw new NotFoundException("User not found");
        }
        if (repositoryRepository.existsByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(user.getUsername(), request.getRepositoryName().trim())) {
            throw new BadRequestException("repo already exists");
        }
       RepositoryDocument repo =  RepositoryDocument
                .builder()
                .repositoryName(request.getRepositoryName())
                .cloneUrl(buildCloneUrl(user.getUsername(), request.getRepositoryName()))
                .description(request.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .emailVerified(user.getEmailVerified())
                                .username(user.getUsername())
                                .status(user.getStatus())
                                .build()
                )
                .visibility(request.getVisibility())
                .symbolicHead("refs/heads/main")
                .branchHeads(Map.of("main", ""))
                                                                .build();
       RepositoryDocument saved = repositoryRepository.save(repo);


        minio.ensureBuckets();
        minio.writeLayoutHead(saved.getOwner().getUsername(), saved.getRepositoryName());
        minio.writeLayoutBranchRef(saved.getOwner().getUsername(), saved.getRepositoryName(), "main", "");

        return toRepositoryResponse(saved);
    }

    public Map<String, Object> listRefs(RepositoryDocument meta) {
        Map<String, String> refs = new LinkedHashMap<>();
        for (var e : meta.getBranchHeads().entrySet()) {
            refs.put("refs/heads/" + e.getKey(), e.getValue() == null ? "" : e.getValue().trim());
        }
        return Map.of("HEAD", meta.getSymbolicHead(), "refs", refs);
    }

    public byte[] readObjectRaw(RepositoryDocument meta, String hash) {
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        try {
            return minio.getObjectBytes(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim());
        } catch (MinioStorageService.StorageException e) {
            throw new NotFoundException("object not found");
        }
    }

    public byte[] archiveRepository(RepositoryDocument meta, String ref) {
        if (meta == null) {
            throw new NotFoundException("Repository not found");
        }
        String refName = ref == null || ref.isBlank() ? "main" : ref.trim();
        String resolvedRef = resolveRef(meta, refName);
        if (resolvedRef.isBlank()) {
            throw new NotFoundException("ref not found: " + refName);
        }
        try {
            byte[] commitData = minio.getObjectBytes(
                    meta.getOwner().getUsername(),
                    meta.getRepositoryName(),
                    resolvedRef
            );
            VicObjectFormat.ParsedObject commitObj = VicObjectFormat.parseCompressed(commitData);
            VicObjectFormat.CommitData commitInfo = VicObjectFormat.parseCommitContent(commitObj.content());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(out)) {
                addTreeToZip(meta, commitInfo.tree(), "", zip);
            }
            return out.toByteArray();
        } catch (IOException | MinioStorageService.StorageException e) {
            throw new NotFoundException("archive could not be created");
        }
    }

    public void writeObject(RepositoryDocument meta, String hash, byte[] data) {
        if (data == null || data.length == 0) {
            throw new BadRequestException("empty object body");
        }
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        minio.ensureBuckets();
        minio.putObjectIfAbsent(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim(), data);
    }

    private String resolveRef(RepositoryDocument meta, String ref) {
        String requested = ref == null ? "" : ref.trim();
        if (meta.getBranchHeads() != null) {
            String branch = meta.getBranchHeads().get(requested);
            if (branch != null && !branch.isBlank()) {
                return branch.trim();
            }
        }
        if (ObjectHash.isValidSha1Hex(requested)) {
            return requested;
        }
        String fallbackBranch = defaultBranchName(meta);
        if (meta.getBranchHeads() != null) {
            String fallbackHash = meta.getBranchHeads().get(fallbackBranch);
            if (fallbackHash != null && !fallbackHash.isBlank()) {
                return fallbackHash.trim();
            }
            for (String hash : meta.getBranchHeads().values()) {
                if (hash != null && !hash.isBlank()) {
                    return hash.trim();
                }
            }
        }
        return "";
    }

    private void addTreeToZip(
            RepositoryDocument meta,
            String treeHash,
            String prefix,
            ZipOutputStream zip
    ) throws IOException {
        byte[] treeData = minio.getObjectBytes(
                meta.getOwner().getUsername(),
                meta.getRepositoryName(),
                treeHash
        );
        VicObjectFormat.ParsedObject treeObj = VicObjectFormat.parseCompressed(treeData);
        String[] lines = new String(treeObj.content(), StandardCharsets.UTF_8).split("\n");
        for (String line : lines) {
            if (line == null || line.isBlank()) {
                continue;
            }
            String[] parts = line.split("\t");
            if (parts.length < 4) {
                continue;
            }
            String type = parts[1];
            String hash = parts[2];
            String name = safeArchiveSegment(parts[3]);
            if (name.isBlank()) {
                continue;
            }
            String path = prefix.isBlank() ? name : prefix + "/" + name;
            if ("tree".equalsIgnoreCase(type)) {
                addTreeToZip(meta, hash, path, zip);
                continue;
            }
            byte[] blobData = minio.getObjectBytes(
                    meta.getOwner().getUsername(),
                    meta.getRepositoryName(),
                    hash
            );
            VicObjectFormat.ParsedObject blobObj = VicObjectFormat.parseCompressed(blobData);
            zip.putNextEntry(new ZipEntry(path));
            zip.write(blobObj.content());
            zip.closeEntry();
        }
    }

    private String safeArchiveSegment(String segment) {
        return String.valueOf(segment == null ? "" : segment)
                .replace("\\", "/")
                .replace("../", "")
                .replace("/", "-")
                .trim();
    }

    public void updateBranchRef(RepositoryDocument meta, String branch, String hash) throws IOException {
        branch = branch.trim();
        if (branch.isEmpty()) {
            throw new BadRequestException("owner, repo, branch and hash are required");
        }
        for (char c : branch.toCharArray()) {
            if ("\\/:*?\"<>|".indexOf(c) >= 0) {
                throw new BadRequestException("invalid branch name");
            }
        }
        if (!ObjectHash.isValidSha1Hex(hash)) {
            throw new BadRequestException("invalid object hash");
        }
        if (!minio.objectExists(meta.getOwner().getUsername(), meta.getRepositoryName(), hash.trim())) {
            throw new BadRequestException("object does not exist on server");
        }
        meta.getBranchHeads().put(branch, hash.trim());
        repositoryRepository.save(meta);
        minio.writeLayoutBranchRef(meta.getOwner().getUsername(), meta.getRepositoryName(), branch, hash.trim());
        fileIndex.rebuildIndex(meta, branch, hash.trim());
    }

//    public String listBranchHash(RepositoryDocument meta, String branch) {
//        String h = meta.getBranchHeads().get(branch.trim());
//        if (h == null) {
//            return "";
//        }
//        return h.trim();
//    }
    public String listBranchHash(RepositoryDocument meta, String branch) {

        if (meta == null) {
            throw new NotFoundException("Repository not found");
        }

        if (branch == null || branch.trim().isEmpty()) {
            throw new BadRequestException("Branch is required");
        }

        String branchName = branch.trim();

        if (meta.getBranchHeads() == null || !meta.getBranchHeads().containsKey(branchName)) {
            throw new BadRequestException("Branch does not exist: " + branchName);
        }

        String hash = meta.getBranchHeads().get(branchName);

        if (hash == null || hash.trim().isEmpty()) {
            throw new BadRequestException("Branch has no commits yet: " + branchName);
        }

        return hash.trim();
    }

    @Transactional
    public void addCollaborator(String owner, String repo, ContributorRequest request) {
        RepositoryDocument meta = loadMeta(owner, repo);
        ContributorUser contributorUser = authService.getContributorUser(request.getId());
        if (contributorUser == null){
            throw new BadRequestException("There is No such User");
        }

        if (meta.getCollaborators() == null) {
            meta.setCollaborators(new java.util.ArrayList<>());
        }
        if (meta.getCollaborators().stream()
                .anyMatch(col ->
                        col.getId().
                                equals(contributorUser.getId()))

        ) {
            throw new BadRequestException("User Already Contribute to this repository");
        }
        contributorUser.setContributorStatus(ContributorStatus.ACCEPTED);
        meta.getCollaborators().add(contributorUser);
        repositoryRepository.save(meta);
    }

    public RepositoryDTO getRepositoryById(String id){
        RepositoryDocument repo = repositoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("The Repository doesn't exist"));
        return RepositoryDTO
                .builder()
                .owner(repo.getOwner().getUsername())
                .visibility(repo.getVisibility())
                .collaborators(repo.getCollaborators())
                .description(repo.getDescription())
                .repositoryName(repo.getRepositoryName())
                .cloneUrl(resolveCloneUrl(repo))
                .build();
    }

    public RepositoryDTO repositoryByOwnerAndRepoName(String ownerName, String repositoryName){

        RepositoryDocument repo = repositoryRepository.findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(ownerName, repositoryName)
                .orElseThrow(() -> new NotFoundException("with this detail, there is no such user"));
        return RepositoryDTO
                .builder()
                .owner(repo.getOwner().getUsername())
                .repositoryName(repo.getRepositoryName())
                .cloneUrl(resolveCloneUrl(repo))
                .visibility(repo.getVisibility())
                .build();
    }

    public RepositoryResponse repositoryResponseByOwnerAndRepoName(String ownerName, String repositoryName) {
        RepositoryDocument repo = repositoryRepository.findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(ownerName, repositoryName)
                .orElseThrow(() -> new NotFoundException("with this detail, there is no such repository"));
        return toRepositoryResponse(repo);
    }

    public RepositoryDTO removeBlockUserFromRepository(String ownerId, String gustUser, String repositoryName){
        ContributorUser owner = authService.getContributorUser(ownerId);
        if (owner == null){
            throw new NotFoundException("The Usr owner not found");
        }

        RepositoryDocument repo = repositoryRepository.findByOwner_UsernameIgnoreCaseAndRepositoryNameIgnoreCase(owner.getUsername(),repositoryName)
                .orElseThrow(() -> new NotFoundException("There is no such repo"));
        List<ContributorUser> currentContributor =  repo.getCollaborators().stream().filter((cont) -> !cont.getId().equals(gustUser)).toList();
        repo.setCollaborators(currentContributor);
        RepositoryDocument saved =  repositoryRepository.save(repo);
        removeInvitation(owner.getUsername(), gustUser,repositoryName);
        return RepositoryDTO
                .builder()
                .owner(saved.getOwner().getUsername())
                .cloneUrl(resolveCloneUrl(saved))
                .visibility(saved.getVisibility())
                .repositoryName(saved.getRepositoryName())
                .id(saved.getId())
                .collaborators(saved.getCollaborators())
                .description(saved.getDescription())
                .build();
    }
    public void removeInvitation(String owner, String guestUser, String repo){

        Invitation invitation =  invitationRepository.findByHostUser_UsernameIgnoreCaseAndRepository_UserNameIgnoreCaseAndRepository_RepositoryNameIgnoreCase(owner,guestUser,repo)
                .orElseThrow(() -> new NotFoundException("Not Found"));
        invitationRepository.delete(invitation);
    }

    public  List<RepositoryResponse> getOwnerRepos(String ownerId) {
       ContributorUser contributorUser =  authService.getContributorUser(ownerId);
       if (contributorUser == null) {
           throw new NotFoundException("User not found");
       }
        List<RepositoryDocument> repos = repositoryRepository.findAllByOwner_Username(contributorUser.getUsername());
        return repos.stream().map(this::toRepositoryResponse).collect(Collectors.toList());
    }

    public List<RepositoryResponse> getAccessibleRepos(String userId) {
        ContributorUser viewer = authService.getContributorUser(userId);
        if (viewer == null) {
            throw new NotFoundException("User not found");
        }

        String username = String.valueOf(viewer.getUsername()).trim();
        if (username.isEmpty()) {
            return List.of();
        }

        List<RepositoryDocument> ownedRepos = repositoryRepository.findAllByOwner_Username(username);
        List<RepositoryDocument> collaboratorRepos =
                repositoryRepository.findByCollaborators_UsernameIgnoreCase(username);

        Map<String, RepositoryDocument> unique = new LinkedHashMap<>();
        for (RepositoryDocument repo : ownedRepos) {
            if (repo == null) {
                continue;
            }
            unique.put(repositoryKey(repo), repo);
        }
        for (RepositoryDocument repo : collaboratorRepos) {
            if (repo == null || !hasAcceptedCollaborator(repo, viewer)) {
                continue;
            }
            unique.putIfAbsent(repositoryKey(repo), repo);
        }

        return new ArrayList<>(unique.values()).stream()
                .map(this::toRepositoryResponse)
                .collect(Collectors.toList());
    }

    private boolean hasAcceptedCollaborator(RepositoryDocument repo, ContributorUser viewer) {
        if (repo == null || viewer == null || repo.getCollaborators() == null) {
            return false;
        }
        String viewerId = String.valueOf(viewer.getId()).trim();
        String viewerUsername = String.valueOf(viewer.getUsername()).trim().toLowerCase(Locale.ROOT);
        return repo.getCollaborators().stream().anyMatch(collaborator -> {
            if (collaborator == null) {
                return false;
            }
            String collaboratorId = String.valueOf(collaborator.getId()).trim();
            String collaboratorUsername =
                    String.valueOf(collaborator.getUsername()).trim().toLowerCase(Locale.ROOT);
            boolean matchesViewer =
                    (!viewerId.isEmpty() && Objects.equals(collaboratorId, viewerId)) ||
                    (!viewerUsername.isEmpty() && Objects.equals(collaboratorUsername, viewerUsername));
            if (!matchesViewer) {
                return false;
            }
            ContributorStatus status = collaborator.getContributorStatus();
            return status == null || status == ContributorStatus.ACCEPTED;
        });
    }

    private String repositoryKey(RepositoryDocument repo) {
        String owner = repo.getOwner() == null ? "" : String.valueOf(repo.getOwner().getUsername()).trim();
        String name = String.valueOf(repo.getRepositoryName()).trim();
        return owner.toLowerCase(Locale.ROOT) + "/" + name.toLowerCase(Locale.ROOT);
    }

    private RepositoryResponse toRepositoryResponse(RepositoryDocument saved) {
        return RepositoryResponse
                .builder()
                .id(saved.getId())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .branchHeads(saved.getBranchHeads())
                .symbolicHead(saved.getSymbolicHead())
                .defaultBranch(defaultBranchName(saved))
                .repositoryName(saved.getRepositoryName())
                .cloneUrl(resolveCloneUrl(saved))
                .collaborators(saved.getCollaborators())
                .description(saved.getDescription())
                .owner(
                        UserDTO.builder()
                                .id(saved.getOwner().getId())
                                .email(saved.getOwner().getEmail())
                                .emailVerified(saved.getOwner().getEmailVerified())
                                .username(saved.getOwner().getUsername())
                                .status(saved.getOwner().getStatus())
                                .build()
                )
                .build();
    }

    private String defaultBranchName(RepositoryDocument repo) {
        String symbolic = repo == null ? "" : String.valueOf(repo.getSymbolicHead() == null ? "" : repo.getSymbolicHead()).trim();
        String symbolicBranch = symbolic.replaceFirst("^refs/heads/", "").trim();
        Map<String, String> heads = repo == null ? null : repo.getBranchHeads();
        if (heads != null && !heads.isEmpty()) {
            if (!symbolicBranch.isBlank()) {
                String hash = heads.get(symbolicBranch);
                if (hash != null && !hash.isBlank()) {
                    return symbolicBranch;
                }
            }
            for (Map.Entry<String, String> entry : heads.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isBlank()) {
                    return entry.getKey();
                }
            }
            if (!symbolicBranch.isBlank()) {
                return symbolicBranch;
            }
            return heads.keySet().iterator().next();
        }
        return symbolicBranch.isBlank() ? "main" : symbolicBranch;
    }

    public @Nullable List<ContributorUser> getContributors(String owner, String repo) {
        RepositoryDocument document = loadMeta(owner, repo);
        return document.getCollaborators();
    }

    private String resolveCloneUrl(RepositoryDocument repo) {
        if (repo == null || repo.getOwner() == null) {
            return "";
        }
        return buildCloneUrl(repo.getOwner().getUsername(), repo.getRepositoryName());
    }

    private String buildCloneUrl(String owner, String repo) {
        return buildGatewayUrl("/api/v1/repos/" + owner + "/" + repo);
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

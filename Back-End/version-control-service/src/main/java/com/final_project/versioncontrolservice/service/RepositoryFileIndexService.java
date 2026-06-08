package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.model.RepositoryDocument;
import com.final_project.versioncontrolservice.model.RepositoryFileIndex;
import com.final_project.versioncontrolservice.model.DerivedDocumentIndex;
import com.final_project.versioncontrolservice.repo.DerivedDocumentIndexRepository;
import com.final_project.versioncontrolservice.repo.RepositoryFileIndexRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
@AllArgsConstructor
public class RepositoryFileIndexService {

    private final RepositoryFileIndexRepository fileIndexRepository;
    private final DerivedDocumentIndexRepository derivedDocumentIndexRepository;
    private final MinioStorageService minioStorageService;
    private final DocumentExtractionService documentExtractionService;

    public void rebuildIndex(RepositoryDocument repo, String branch, String commitHash) throws IOException {
        fileIndexRepository.deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                branch
        );
        derivedDocumentIndexRepository.deleteByOwnerUsernameIgnoreCaseAndRepositoryNameIgnoreCaseAndBranch(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                branch
        );

        byte[] commitData = minioStorageService.getObjectBytes(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                commitHash
        );

        VicObjectFormat.ParsedObject commitObj =
                VicObjectFormat.parseCompressed(commitData);

        VicObjectFormat.CommitData commit =
                VicObjectFormat.parseCommitContent(commitObj.content());

        walkTree(repo, branch, commitHash, commit.tree(), "");
    }

    private void walkTree(
            RepositoryDocument repo,
            String branch,
            String commitHash,
            String treeHash,
            String currentPath
    ) throws IOException {
        byte[] treeData = minioStorageService.getObjectBytes(
                repo.getOwner().getUsername(),
                repo.getRepositoryName(),
                treeHash
        );

        VicObjectFormat.ParsedObject treeObj =
                VicObjectFormat.parseCompressed(treeData);

        String treeText = new String(treeObj.content(), StandardCharsets.UTF_8);

        for (String line : treeText.split("\n")) {
            if (line.isBlank()) continue;

            String[] parts = line.split("\t");
            if (parts.length < 4) continue;

            String mode = parts[0];
            String type = parts[1];
            String hash = parts[2];
            String name = parts[3];

            String path = currentPath.isEmpty() ? name : currentPath + "/" + name;

            if ("tree".equals(type)) {
                walkTree(repo, branch, commitHash, hash, path);
            }

            if ("blob".equals(type)) {
                byte[] blobData = minioStorageService.getObjectBytes(
                        repo.getOwner().getUsername(),
                        repo.getRepositoryName(),
                        hash
                );

                VicObjectFormat.ParsedObject blobObj =
                        VicObjectFormat.parseCompressed(blobData);

                byte[] contentBytes = blobObj.content();
                boolean binary = documentExtractionService.isBinary(path, contentBytes);
                String fileKind = binary ? documentExtractionService.detectFileType(path) : "text";
                String derivedDocumentId = null;

                if (documentExtractionService.supports(path)) {
                    DocumentExtractionService.ExtractionResult extraction =
                            documentExtractionService.extract(path, contentBytes);

                    DerivedDocumentIndex derivedDocumentIndex = DerivedDocumentIndex.builder()
                            .ownerUsername(repo.getOwner().getUsername())
                            .repositoryName(repo.getRepositoryName())
                            .branch(branch)
                            .path(path)
                            .fileName(name)
                            .blobHash(hash)
                            .commitHash(commitHash)
                            .fileType(extraction.getFileType())
                            .extractionVersion(DocumentExtractionService.EXTRACTION_VERSION)
                            .indexedAt(Instant.now())
                            .segments(extraction.getSegments())
                            .build();

                    derivedDocumentId = derivedDocumentIndexRepository.save(derivedDocumentIndex).getId();
                    fileKind = extraction.getFileType();
                    binary = true;
                }

                RepositoryFileIndex index = RepositoryFileIndex.builder()
                        .repositoryId(repo.getId())
                        .ownerUsername(repo.getOwner().getUsername())
                        .repositoryName(repo.getRepositoryName())
                        .branch(branch)
                        .path(path)
                        .fileName(name)
                        .blobHash(hash)
                        .commitHash(commitHash)
                        .size((long) contentBytes.length)
                        .language(detectLanguage(name))
                        .fileKind(fileKind)
                        .binary(binary)
                        .derivedDocumentId(derivedDocumentId)
                        .deleted(false)
                        .indexedAt(Instant.now())
                        .build();

                fileIndexRepository.save(index);
            }
        }
    }

    private String detectLanguage(String fileName) {
        if (fileName.endsWith(".java")) return "java";
        if (fileName.endsWith(".go")) return "go";
        if (fileName.endsWith(".js")) return "javascript";
        if (fileName.endsWith(".ts")) return "typescript";
        if (fileName.endsWith(".json")) return "json";
        if (fileName.endsWith(".md")) return "markdown";
        if (fileName.endsWith(".pdf")) return "pdf";
        if (fileName.endsWith(".docx")) return "docx";
        return "text";
    }
}

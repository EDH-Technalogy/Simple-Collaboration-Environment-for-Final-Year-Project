package com.final_project.file_service.api.controller;

import com.final_project.file_service.api.dto.FileUploadResponse;
import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;

@RestController
@AllArgsConstructor
@RequestMapping("/file/cli-application")
public class CliApplicationController {
    private static final String CLI_OWNER_ID = "cli-application";
    private static final String LATEST_FOLDER = "latest";
    private static final String CLI_BUCKET = "cli-applications";

    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FileUploadResponse uploadCliApplication(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "version", required = false, defaultValue = LATEST_FOLDER) String version
    ) throws IOException {
        return uploadCliApplicationFile(file, version, file.getOriginalFilename());
    }

    @PostMapping(value = "/vic.exe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FileUploadResponse uploadVicExecutable(@RequestPart("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "vic.exe file is required");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().trim();
        if (!originalName.toLowerCase().endsWith(".exe")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only Windows .exe files are accepted");
        }
        return uploadCliApplicationFile(file, LATEST_FOLDER, "vic.exe");
    }

    private FileUploadResponse uploadCliApplicationFile(
            MultipartFile file,
            String version,
            String storedFileName
    ) throws IOException {
        FileMetadata metadata = new FileMetadata(
                storedFileName,
                file.getContentType() == null
                        ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                        : file.getContentType(),
                CLI_OWNER_ID,
                OwnerType.PUBLIC,
                FileCategory.CLI_APPLICATION,
                version
        );
        FileRecord currentFile = fileService.uploadRecord(metadata, file.getInputStream());
        String url = fileStoragePort.generatePresignedUrl(currentFile.getBucket(), currentFile.getObjectKey());
        return FileUploadResponse
                .builder()
                .fileId(currentFile.getId())
                .cdnUrl(url)
                .originalFilename(currentFile.getFileName())
                .build();
    }

    @GetMapping("/latest/download")
    public ResponseEntity<byte[]> downloadLatestCliApplication() throws IOException {
        FileRecord file = fileRecordService.findLatestByOwnerIdAndCategory(CLI_OWNER_ID, FileCategory.CLI_APPLICATION);
        return downloadRecord(file);
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<byte[]> downloadCliApplicationByFileName(@PathVariable String fileName) throws IOException {
        FileRecord file = fileRecordService.findFileByNameAndOwnerId(fileName, CLI_OWNER_ID);
        return downloadRecord(file);
    }

    @GetMapping("/raw/{fileName:.+}")
    public ResponseEntity<byte[]> downloadRawLatestCliApplication(@PathVariable String fileName) throws IOException {
        InputStream stream = fileStoragePort.download(CLI_BUCKET, LATEST_FOLDER + "/" + sanitize(fileName));
        byte[] bytes = stream.readAllBytes();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + sanitize(fileName) + "\"")
                .body(bytes);
    }

    private ResponseEntity<byte[]> downloadRecord(FileRecord file) throws IOException {
        InputStream stream = fileStoragePort.download(file.getBucket(), file.getObjectKey());
        byte[] bytes = stream.readAllBytes();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .body(bytes);
    }

    private String sanitize(String fileName) {
        return fileName == null || fileName.isBlank()
                ? "cli-application"
                : fileName.replace("\\", "-").replace("/", "-");
    }
}

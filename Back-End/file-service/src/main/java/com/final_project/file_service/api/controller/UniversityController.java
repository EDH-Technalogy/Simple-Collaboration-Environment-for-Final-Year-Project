package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@RestController
@AllArgsConstructor
@RequestMapping("/file/university")
public class UniversityController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/logo/{id}")
    public ResponseEntity<String> uploadLogo(@RequestParam MultipartFile file, @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.UNIVERSITY,
                FileCategory.LOGO,
                null
        );
        return new  ResponseEntity<>(fileService.upload(fileMetadata, file.getInputStream()), HttpStatus.CREATED);
    }

    @GetMapping("/logo/{id}")
    public ResponseEntity<String> getLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        return new ResponseEntity<>(fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey()), HttpStatus.OK);
    }
    @DeleteMapping("/logo/{id}")
    public ResponseEntity<Void>   deleteLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        fileStoragePort.delete(file.getBucket(), file.getObjectKey());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    @GetMapping("/logo/{id}/download")
    public ResponseEntity<byte[]> downloadLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);

        InputStream stream = fileStoragePort.download(file.getBucket(), file.getObjectKey());
        byte[] content = stream.readAllBytes();
        return ResponseEntity
                .ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(content);
    }
}

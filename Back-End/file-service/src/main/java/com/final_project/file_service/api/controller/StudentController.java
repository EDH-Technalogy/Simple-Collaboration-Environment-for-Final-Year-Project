package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;

@RestController
@AllArgsConstructor
@RequestMapping("/file/student")
public class StudentController {
    private final FileService fileService;
    private final FileRecordService  fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/profile/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata metadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.STUDENT,
                FileCategory.PROFILE,
                null
        );

        return fileService.upload(metadata, file.getInputStream());
    }

    @GetMapping("/profile/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.PROFILE);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}

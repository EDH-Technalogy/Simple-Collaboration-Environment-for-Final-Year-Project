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

@RestController
@RequestMapping("/file/employee")
@AllArgsConstructor
public class EmployeeController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/profile")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.EMPLOYEE,
                FileCategory.PROFILE,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/profile/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.PROFILE);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}

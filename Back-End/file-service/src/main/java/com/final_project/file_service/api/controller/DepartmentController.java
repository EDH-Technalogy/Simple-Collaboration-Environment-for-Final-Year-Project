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
@AllArgsConstructor
@RequestMapping("/file/department")
public class DepartmentController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/logo/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.FACULTY,
                FileCategory.LOGO,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/logo/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}

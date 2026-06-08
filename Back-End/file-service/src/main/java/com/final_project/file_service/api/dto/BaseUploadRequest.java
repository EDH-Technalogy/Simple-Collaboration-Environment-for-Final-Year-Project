package com.final_project.file_service.api.dto;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.OwnerType;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class BaseUploadRequest {
    private MultipartFile file;
    private String ownerId;
    private OwnerType ownerType;
    private FileCategory fileCategory;
    private String subFolder;
}

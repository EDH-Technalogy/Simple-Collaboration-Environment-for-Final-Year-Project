package com.final_project.file_service.api.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class Blog {
    public MultipartFile file;
    private String userId;
    private String blogId;
}


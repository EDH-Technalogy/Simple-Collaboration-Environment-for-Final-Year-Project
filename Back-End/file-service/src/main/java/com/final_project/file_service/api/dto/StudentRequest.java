package com.final_project.file_service.api.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class StudentRequest {
    private MultipartFile file;
    private String studentId;
    private String eventId;
}

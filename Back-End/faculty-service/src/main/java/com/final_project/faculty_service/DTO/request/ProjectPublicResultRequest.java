package com.final_project.faculty_service.DTO.request;

import lombok.Data;

@Data
public class ProjectPublicResultRequest {
    private String abstractText;
    private String finalFileName;
    private String finalFileDownloadUrl;
}

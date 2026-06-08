package com.final_project.file_service.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder

public class FileCdnUrlResponse {

    private String fileId;

    private String cdnUrl;


    private String thumbnailUrl;
    private LocalDateTime expiresAt;
}
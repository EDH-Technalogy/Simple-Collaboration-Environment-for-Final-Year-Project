package com.final_project.blog_service.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public  class EditHistory {
    private Integer version;
    private LocalDateTime updatedAt;
    private String editorId;
    private String summary;
}
package com.final_project.blog_service.model;

import com.final_project.blog_service.dto.ContentBlock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Content {

    @Builder.Default
    private List<ContentBlock> blocks = new ArrayList<>();

    @Builder.Default
    private Integer estimatedReadTime = 1;  // in minutes
}
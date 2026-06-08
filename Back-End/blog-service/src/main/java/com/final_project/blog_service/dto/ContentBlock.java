package com.final_project.blog_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;


@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class ContentBlock {
    private ArticleBlockType type;
    private Integer order;
    private Map<String, Object> data;
}

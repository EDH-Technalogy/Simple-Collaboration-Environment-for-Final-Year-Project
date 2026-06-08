package com.final_project.blog_service.dto.response;

import com.final_project.blog_service.dto.ArticleBlockType;

import java.util.Map;

public class ArticleBlockResponse {
    private ArticleBlockType type;
    private Integer order;
    private Map<String, Object> data;
}

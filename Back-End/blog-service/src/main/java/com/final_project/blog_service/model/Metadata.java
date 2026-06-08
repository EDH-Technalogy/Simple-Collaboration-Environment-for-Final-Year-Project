package com.final_project.blog_service.model;

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
public  class Metadata {

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private String category;

    private String description;  // SEO meta description

    @Builder.Default
    private List<String> keywords = new ArrayList<>();  // SEO keywords

    private String coverImageUrl;  // from file service
}
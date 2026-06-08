package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Stats {

    @Builder.Default
    private Long views = 0L;  // page views

    @Builder.Default
    private Long reads = 0L;  // engaged reads (2+ minutes)

    @Builder.Default
    private Long likes = 0L;

    @Builder.Default
    private Long commentCount = 0L;

    @Builder.Default
    private Long shareCount = 0L;

    private LocalDateTime lastEngagedAt;
}
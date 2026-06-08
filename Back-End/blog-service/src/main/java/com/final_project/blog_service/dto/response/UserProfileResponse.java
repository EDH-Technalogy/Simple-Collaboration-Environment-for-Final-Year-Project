package com.final_project.blog_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String profile;
    private String bio;
    private Long totalArticles;
    private LocalDateTime createdAt;
}

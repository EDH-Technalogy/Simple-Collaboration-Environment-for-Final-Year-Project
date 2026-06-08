package com.final_project.blog_service.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExistsResponse {
    private String userId;
    private boolean exists;
}
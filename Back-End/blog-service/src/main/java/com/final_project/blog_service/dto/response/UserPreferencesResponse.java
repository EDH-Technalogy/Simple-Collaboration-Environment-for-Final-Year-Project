package com.final_project.blog_service.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferencesResponse {
    private String userId;
    private Boolean emailNotifications;
    private Boolean allowComments;
    private String defaultPublishStatus;
}
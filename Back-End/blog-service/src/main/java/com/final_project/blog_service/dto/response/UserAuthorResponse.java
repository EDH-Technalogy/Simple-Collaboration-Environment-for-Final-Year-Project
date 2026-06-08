package com.final_project.blog_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserAuthorResponse  {
    private String id;
    private String userName;
    private String email;
    private String profile;
}

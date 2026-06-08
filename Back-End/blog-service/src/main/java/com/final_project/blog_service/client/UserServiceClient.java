package com.final_project.blog_service.client;

import com.final_project.blog_service.config.UserServiceFeignConfig;
import com.final_project.blog_service.dto.*;
import com.final_project.blog_service.dto.response.UserAuthorResponse;
import com.final_project.blog_service.dto.response.UserExistsResponse;
import com.final_project.blog_service.dto.response.UserPreferencesResponse;
import com.final_project.blog_service.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(
        name = "AUTH-SERVICE",
        url = "http://localhost:8085",
        configuration = UserServiceFeignConfig.class
)
public interface UserServiceClient {

    /**
     * Get user profile by ID
     * Called when article author info is needed
     */
    @GetMapping("/api/v1/users/{userId}")
    UserProfileResponse getUserProfile(@PathVariable String userId);

    @GetMapping("/api/v1/users/{id}/{roleName}")
    UserDTO getUserByIdAndRoleName(@PathVariable String id, @PathVariable String roleName);

    /**
     * Get author by id
     * Called for cross-service validation
     */
    @GetMapping("/api/v1/users/public/author/{id}")
    UserAuthorResponse getUserAuthor(@PathVariable String id);

    /**
     * Get user by email
     * Called for cross-service validation
     */
    @GetMapping("/api/v1/users/email/{email}")
    UserProfileResponse getUserByEmail(@PathVariable String email);

    /**
     * Verify user exists
     * Called before creating article or comment
     */
    @GetMapping("/api/v1/users/{userId}/exists")
    UserExistsResponse checkUserExists(@PathVariable String userId);

    /**
     * Get multiple user profiles
     * Called for bulk author info retrieval
     */
    @PostMapping("/api/v1/users/batch")
    List<UserProfileResponse> getMultipleUsers(@RequestBody List<String> userIds);

    /**
     * Get user preferences
     * Called for personalization
     */
    @GetMapping("/api/v1/users/{userId}/preferences")
    UserPreferencesResponse getUserPreferences(@PathVariable String userId);
}







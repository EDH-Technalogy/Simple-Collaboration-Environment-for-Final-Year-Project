package com.final_project.blog_service.service;
import com.final_project.blog_service.client.UserServiceClient;
import com.final_project.blog_service.dto.response.UserProfileResponse;
import com.final_project.blog_service.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserCacheService {
    private final UserServiceClient userServiceClient;
    private final RedisTemplate<String, UserProfileResponse> redisTemplate;

    private static final String USER_CACHE_KEY = "user:";
    private static final String USER_EMAIL_CACHE_KEY = "user:email:";
    private static final int CACHE_TTL_MINUTES = 30;

    /**
     * Get user profile with caching
     * Tries cache first, then calls User Service, falls back to empty profile
     */
    public UserProfileResponse getUserProfile(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        String cacheKey = USER_CACHE_KEY + userId;

        // Try cache first
        try {
            UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("User cache hit: {}", userId);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Cache read error for user {}: {}", userId, e.getMessage());
        }

        // Cache miss - call User Service
        try {
            log.debug("Fetching user profile from User Service: {}", userId);
            UserProfileResponse profile = userServiceClient.getUserProfile(userId);

            // Cache the result
            cacheUserProfile(userId, profile);

            return profile;
        } catch (UserNotFoundException e) {
            log.error("User not found in User Service: {}", userId);
            throw e;
        } catch (Exception e) {
            log.error("User Service call failed for user {}: {}", userId, e.getMessage());

            // Try fallback: return user ID as profile
            return createFallbackProfile(userId);
        }
    }

    /**
     * Get user by email
     */
    public UserProfileResponse getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null");
        }

        String cacheKey = USER_EMAIL_CACHE_KEY + email.toLowerCase();

        try {
            UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("User cache hit by email: {}", email);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Cache read error for email {}: {}", email, e.getMessage());
        }

        try {
            UserProfileResponse profile = userServiceClient.getUserByEmail(email);
            cacheUserProfile(profile.getId(), profile);
            return profile;
        } catch (Exception e) {
            log.error("User Service call failed for email {}: {}", email, e.getMessage());
            throw new UserNotFoundException("User not found: " + email);
        }
    }

    /**
     * Get multiple user profiles efficiently with caching
     */
    public Map<String, UserProfileResponse> getUserProfiles(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, UserProfileResponse> result = new HashMap<>();
        List<String> uncachedUserIds = new ArrayList<>();

        // Check cache for each user
        for (String userId : userIds) {
            String cacheKey = USER_CACHE_KEY + userId;
            try {
                UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    result.put(userId, cached);
                } else {
                    uncachedUserIds.add(userId);
                }
            } catch (Exception e) {
                uncachedUserIds.add(userId);
            }
        }

        // Batch fetch uncached users
        if (!uncachedUserIds.isEmpty()) {
            try {
                log.debug("Batch fetching {} users from User Service", uncachedUserIds.size());
                List<UserProfileResponse> profiles = userServiceClient.getMultipleUsers(uncachedUserIds);

                for (UserProfileResponse profile : profiles) {
                    result.put(profile.getId(), profile);
                    cacheUserProfile(profile.getId(), profile);
                }

                // Add fallback profiles for missing users
                Set<String> fetchedIds = profiles.stream()
                        .map(UserProfileResponse::getId)
                        .collect(Collectors.toSet());

                uncachedUserIds.stream()
                        .filter(id -> !fetchedIds.contains(id))
                        .forEach(id -> result.put(id, createFallbackProfile(id)));

            } catch (Exception e) {
                log.error("Batch fetch failed: {}", e.getMessage());

                // Fallback: return all as fallback profiles
                uncachedUserIds.forEach(id -> result.put(id, createFallbackProfile(id)));
            }
        }

        return result;
    }

    /**
     * Invalidate user cache (call when user updates profile)
     */
    public void invalidateUserCache(String userId) {
        if (userId == null) return;

        String cacheKey = USER_CACHE_KEY + userId;
        try {
            redisTemplate.delete(cacheKey);
            log.debug("User cache invalidated: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Invalidate user cache by email
     */
    public void invalidateUserCacheByEmail(String email) {
        if (email == null) return;

        String cacheKey = USER_EMAIL_CACHE_KEY + email.toLowerCase();
        try {
            redisTemplate.delete(cacheKey);
            log.debug("User cache invalidated by email: {}", email);
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for email {}: {}", email, e.getMessage());
        }
    }

    private void cacheUserProfile(String userId, UserProfileResponse profile) {
        String cacheKey = USER_CACHE_KEY + userId;
        try {
            redisTemplate.opsForValue().set(
                    cacheKey,
                    profile,
                    CACHE_TTL_MINUTES,
                    TimeUnit.MINUTES
            );
            log.debug("User profile cached: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to cache user profile: {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Create fallback profile when User Service is unavailable
     */
    private UserProfileResponse createFallbackProfile(String userId) {
        log.warn("Creating fallback profile for user: {}", userId);

        return UserProfileResponse.builder()
                .id(userId)
                .displayName("[User Service Unavailable]")
                .username("user_" + userId.substring(0, Math.min(8, userId.length())))
                .email(null)
                .profile(null)
                .bio(null)
                .totalArticles(0L)
                .createdAt(null)
                .build();
    }
}


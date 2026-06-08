package com.final_project.notification_service.service;

import com.final_project.notification_service.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Sliding-window rate limiter that prevents notification spam per user.
 * Uses Redis INCR + EXPIRE to implement a fixed 1-hour window counter.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private static final String KEY_PREFIX = "notif:ratelimit:";

    private final RedisTemplate<String, String> redisTemplate;
    private final AppProperties appProperties;

    /**
     * @return {@code true} if the user is within their hourly notification quota.
     */
    public boolean isAllowed(String userId) {
        int max    = appProperties.getNotification().getRateLimit().getMaxPerUserPerHour();
        String key = KEY_PREFIX + userId;

        Long current = redisTemplate.opsForValue().increment(key);
        if (current == null) return true;

        if (current == 1L) {
            // First hit in the window — set TTL for 1 hour
            redisTemplate.expire(key, Duration.ofHours(1));
        }

        if (current > max) {
            log.warn("Rate limit exceeded for user={}. Count={} Max={}", userId, current, max);
            return false;
        }

        return true;
    }

    /**
     * Returns how many notifications the user has sent in the current window.
     */
    public long currentCount(String userId) {
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + userId);
        return value != null ? Long.parseLong(value) : 0L;
    }

    /**
     * Resets the counter for a user (admin use).
     */
    public void reset(String userId) {
        redisTemplate.delete(KEY_PREFIX + userId);
        log.info("Rate limit counter reset for user={}", userId);
    }
}
package com.final_project.notification_service.service;
import com.final_project.notification_service.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Provides Redis-backed idempotency checks so that duplicate Kafka events
 * (e.g. from consumer restarts or at-least-once delivery) never trigger
 * duplicate notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private static final String KEY_PREFIX = "notif:idempotency:";

    private final RedisTemplate<String, String> redisTemplate;
    private final AppProperties appProperties;

    /**
     * Attempts to claim an idempotency key.
     *
     * @return {@code true} if this is the first time this key is seen (proceed);
     *         {@code false} if the key already exists (skip — duplicate).
     */
    public boolean tryAcquire(String idempotencyKey) {
        String redisKey = KEY_PREFIX + idempotencyKey;
        long ttlHours   = appProperties.getNotification().getIdempotencyTtlHours();

        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(redisKey, "1", Duration.ofHours(ttlHours));

        if (Boolean.TRUE.equals(acquired)) {
            log.debug("Idempotency key acquired. Key={}", idempotencyKey);
            return true;
        }

        log.warn("Duplicate event detected — skipping. Key={}", idempotencyKey);
        return false;
    }

    /**
     * Explicitly releases a key (e.g. after a processing failure so it can be retried).
     */
    public void release(String idempotencyKey) {
        String redisKey = KEY_PREFIX + idempotencyKey;
        redisTemplate.delete(redisKey);
        log.debug("Idempotency key released. Key={}", idempotencyKey);
    }

    /**
     * Checks whether a key exists without claiming it.
     */
    public boolean exists(String idempotencyKey) {
        return redisTemplate.hasKey(KEY_PREFIX + idempotencyKey);
    }

    /**
     * Returns remaining TTL in seconds, or -1 if not found.
     */
    public long remainingTtlSeconds(String idempotencyKey) {
        Long ttl = redisTemplate.getExpire(KEY_PREFIX + idempotencyKey, TimeUnit.SECONDS);
        return ttl != null ? ttl : -1L;
    }
}
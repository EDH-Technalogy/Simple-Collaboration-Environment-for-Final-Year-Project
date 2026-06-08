package com.final_project.notification_service.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Comprehensive configuration for async processing, Redis, and serialization.
 *
 * Provides:
 * - Thread pool executor for async operations
 * - RedisConnectionFactory (Lettuce-based)
 * - RedisTemplate for cache operations
 * - ObjectMapper with Java time module support
 */
@Configuration
@EnableAsync
@RequiredArgsConstructor
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

    private final RedisProperties redisProperties;

    // ── Async Thread Pool ────────────────────────────────────────────────────

    /**
     * Configure thread pool executor for @Async methods.
     * Used for email sending and other background tasks.
     */
    @Override
    @Bean(name = "notificationExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);           // Minimum threads
        executor.setMaxPoolSize(20);           // Maximum threads
        executor.setQueueCapacity(200);        // Task queue size
        executor.setThreadNamePrefix("notif-async-");
        executor.setKeepAliveSeconds(60);      // Thread idle timeout
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        log.info("Async executor configured: corePoolSize=5, maxPoolSize=20");
        return executor;
    }

    // ── Redis Connection Factory ────────────────────────────────────────────

    /**
     * Create RedisConnectionFactory using Lettuce driver.
     * Used for idempotency and rate limiting.
     *
     * @return RedisConnectionFactory configured from properties
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        LettuceConnectionFactory factory = new LettuceConnectionFactory();
        log.info("Redis connection factory created: host={}, port={}",
                redisProperties.getHost(), redisProperties.getPort());
        return factory;
    }

    // ── Redis Template ──────────────────────────────────────────────────────

    /**
     * Configure RedisTemplate with String serialization.
     * Used for all Redis operations (idempotency, rate limiting).
     *
     * @param connectionFactory Redis connection factory
     * @return Configured RedisTemplate
     */
    @Bean
    public RedisTemplate<String, String> redisTemplate(
            RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serialization for keys and values
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(stringSerializer);

        template.afterPropertiesSet();
        log.info("RedisTemplate configured with string serialization");
        return template;
    }

    // ── ObjectMapper ─────────────────────────────────────────────────────────

    /**
     *
     * @return Configured ObjectMapper
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register Java time module (LocalDateTime, Instant, etc)
        mapper.registerModule(new JavaTimeModule());

        // Don't serialize dates as timestamps, use ISO-8601 format
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Other useful settings
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        log.info("ObjectMapper configured with JavaTimeModule support");
        return mapper;
    }
}
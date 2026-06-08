package com.final_project.gatewayservice;


import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;

@Configuration
public class CustomRouteConfig {

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(10, 20, 1);
    }

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
                exchange.getRequest().getRemoteAddress() != null
                        ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                        : "unknown"
        );
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r
                        .path(
                                "/api/v1/auth/**",
                                "/api/v1/users/**",
                                "/api/v1/roles/**",
                                "/api/v1/permissions/**"
                        )
                        .filters(f -> f
                                .retry(config -> config
                                        .setRetries(3)
                                        .setMethods(HttpMethod.GET))
                                .requestRateLimiter(config -> config
                                        .setRateLimiter(redisRateLimiter())
                                        .setKeyResolver(ipKeyResolver()))
                        )
                        .uri("lb://AUTH-SERVICE"))

                .route("blog-service", r -> r
                        .path("/api/v1/articles/**", "/api/v1/files/**")
                        .uri("lb://blog-service"))

                .route("notification-service", r -> r
                        .path("/api/v1/notifications/**")
                        .uri("lb://notification-service"))

                .route("file-service", r -> r
                        .path("/file/**")
                        .uri("lb://FILE-SERVICE"))

                .route("version-control-service", r -> r
                        .path(
                                "/auth/**",
                                "/repos/**",
                                "/api/v1/repos/**",
                                "/api/v1/milestone/**",
                                "/api/v1/task/**"
                        )
                        .uri("lb://VERSION-CONTROL-SERVICE"))

                .route("faculty-service", r -> r
                        .path("/api/**")
                        .uri("lb://FACULTY-SERVICE"))
                .route("notification-service", f -> f
                        .path("api/v1/notifications/**")
                        .uri("lb://NOTIFICATION-SERVICE")
                )
                .build();
    }
}
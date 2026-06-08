package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private final WebClient authServiceClient;

    public AuthService(@Qualifier("userWebClient") WebClient authServiceClient) {
        this.authServiceClient = authServiceClient;
    }
    public AuthResponse signup(SignupRequest request) {
        return authServiceClient.post()
                .uri("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                ).bodyToMono(AuthResponse.class)
                .block();
    }
    public AuthResponse login(LoginRequest request) {
        return authServiceClient
                .post()
                .uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                ).bodyToMono(AuthResponse.class)
                .block();

    }

    public ContributorUser getContributorUser(String userId) {
        return authServiceClient
                .get()
                .uri("/api/v1/users/contributor/{id}", userId)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(ContributorUser.class)
                .block();
    }

    public AuthResponse refresh(RefreshTokenRequest refresh) {
        return authServiceClient
                .post()
                .uri("/api/v1/auth/refresh-token")
                .bodyValue(refresh)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(AuthResponse.class)
                .block();
    }

    public UserDTO getUserByUsername(String username) {
        return authServiceClient
                .get()
                .uri("/api/v1/users//by-username/{username}", username)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Auth service server error: " + body)
                                ))
                )
                .bodyToMono(UserDTO.class)
                .block();
    }
}

package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.RoleDTO;
import com.final_project.faculty_service.DTO.UserDto;
import com.final_project.faculty_service.DTO.request.SignupRequest;

import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@AllArgsConstructor
public class AuthService {
    @Qualifier("authServiceClient")
    private final WebClient authServiceClient;
    public UserDto createUser(SignupRequest request) {
        return authServiceClient.post()
                .uri("/api/v1/users")
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
                )
                .bodyToMono(UserDto.class)
                .block();
    }
    public List<RoleDTO> getRoles(){
        return authServiceClient.get()
                .uri("/api/v1/roles")
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
                .bodyToFlux(RoleDTO.class)
                .collectList()
                .block();
    }

    public List<UserDto> getAdminUsers() {
        return authServiceClient.get()
                .uri("/api/v1/users/admins")
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
                .bodyToFlux(UserDto.class)
                .collectList()
                .block();
    }

    public void  assignRoleToUser(String userId, String roleId){
         authServiceClient.post()
                .uri("/api/v1/roles/{roleName}/assign-to-user/{userId}",roleId, userId )
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
                .toBodilessEntity()
                .block();
    }
    public RoleDTO getRole(String roleId){
        return authServiceClient.get()
                .uri("/api/v1/roles/{roleId}",roleId )
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
                .bodyToMono(RoleDTO.class)
                .block();
    }
    public @Nullable ResponseEntity<Void> updateProfile(String id, String url){
        return authServiceClient.post()
                .uri("/api/v1/users/{id}/profile",id)
                .bodyValue(url)
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
                ).toBodilessEntity().block();
    }
    public ResponseEntity<Void> deleteUser(String id){
        return authServiceClient.delete()
                .uri("/api/v1/users/{id}",id)
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
                ).toBodilessEntity().block();
    }
}

package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.RepositoryDTO;
import com.final_project.faculty_service.DTO.UserDto;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@AllArgsConstructor
public class VersionContolService {
    @Qualifier("versionControlWebClient")
    private final WebClient versionControlWebClient;

    public RepositoryDTO getRpoById(String id){
        return versionControlWebClient.get()
                .uri("/api/v1/repos/{id}", id)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Rep service client error: " + body)
                                ))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(
                                        new RuntimeException("Repo service server error: " + body)
                                ))
                )
                .bodyToMono(RepositoryDTO.class)
                .block();
    }
}

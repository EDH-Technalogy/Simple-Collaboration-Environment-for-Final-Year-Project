package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.dto.FacultyProjectDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class FacultyProjectService {
    private final WebClient facultyWebClient;
    public FacultyProjectService( @Qualifier("facultyWebClient") WebClient   facultyWebClient){
        this.facultyWebClient = facultyWebClient;
    }

    public FacultyProjectDTO findByRepositoryId(String repositoryId) {
        try {
            return facultyWebClient
                    .get()
                    .uri("/api/project/repo/{repoId}", repositoryId)
                    .exchangeToMono(response -> {
                        if (response.statusCode().value() == 404) {
                            return Mono.empty();
                        }
                        if (response.statusCode().is4xxClientError() || response.statusCode().is5xxServerError()) {
                            return response.bodyToMono(String.class)
                                    .flatMap(body -> Mono.error(new RuntimeException("Faculty service error: " + body)));
                        }
                        return response.bodyToMono(FacultyProjectDTO.class);
                    })
                    .block();
        } catch (Exception ignored) {
            return null;
        }
    }
}

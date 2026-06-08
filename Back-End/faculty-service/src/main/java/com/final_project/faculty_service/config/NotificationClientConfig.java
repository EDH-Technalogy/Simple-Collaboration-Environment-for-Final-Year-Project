package com.final_project.faculty_service.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.oauth2.server.resource.web.reactive.function.client.ServletBearerExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class NotificationClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder notificationWebClientBuilder() {
        return WebClient.builder();
    }

    @Bean(name = "notificationServiceClient")
    public WebClient notificationServiceClient(WebClient.Builder notificationWebClientBuilder) {
        ServletBearerExchangeFilterFunction oauth2 = new ServletBearerExchangeFilterFunction();
        return notificationWebClientBuilder
                .baseUrl("http://notification-service")
                .filter(oauth2)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(5))
                ))
                .build();
    }
}

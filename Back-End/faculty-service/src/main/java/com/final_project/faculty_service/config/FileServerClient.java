package com.final_project.faculty_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.oauth2.server.resource.web.reactive.function.client.ServletBearerExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class FileServerClient {
    @Bean
    @LoadBalanced
    public WebClient.Builder webFileClientBuilder(){
        return WebClient.builder();
    }

    @Bean(name = "fileServiceClient")
    public WebClient fileServiceClient ( WebClient.Builder webFileClientBuilder ){
        return webFileClientBuilder
                .baseUrl("http://file-service")
                .exchangeStrategies(ExchangeStrategies.builder().build())
                .codecs( configure -> configure
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024) )
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(5))
                ))
                .build();
    }

}

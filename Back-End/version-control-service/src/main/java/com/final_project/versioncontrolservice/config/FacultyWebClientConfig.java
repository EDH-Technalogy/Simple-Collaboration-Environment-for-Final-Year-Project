package com.final_project.versioncontrolservice.config;

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
public class FacultyWebClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder facultWebClientBuilder () {
        return WebClient.builder();
    }

    @Bean(name = "facultyWebClient")
    public WebClient facultyWebClient(WebClient.Builder facultWebClientBuilder) {
        ServletBearerExchangeFilterFunction oauth = new ServletBearerExchangeFilterFunction();
        return facultWebClientBuilder
                .baseUrl("http://faculty-service")
                .exchangeStrategies(ExchangeStrategies.builder().build())
                .filter(oauth)
                .codecs(configure ->
                        configure
                                .defaultCodecs()
                                .maxInMemorySize(10 * 1024 * 1024)

                )
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(5))
                ))
                .build();
    }
}

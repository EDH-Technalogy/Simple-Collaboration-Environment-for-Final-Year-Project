package com.final_project.faculty_service.config;

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
public class VersionControlClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder versionControlWebClientBuilder(){
        return WebClient.builder();
    }
    @Bean(name = "versionControlWebClient")
    public WebClient versionControlWebClient (WebClient.Builder versionControlWebClientBuilder ){
        ServletBearerExchangeFilterFunction outh2 = new ServletBearerExchangeFilterFunction();
        return versionControlWebClientBuilder
                .baseUrl("http://version-control-service")
                .exchangeStrategies(ExchangeStrategies.builder().build())
                .filter(outh2)
                .codecs( configure -> configure
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024) )
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(5))
                ))
                .build();
    }
}

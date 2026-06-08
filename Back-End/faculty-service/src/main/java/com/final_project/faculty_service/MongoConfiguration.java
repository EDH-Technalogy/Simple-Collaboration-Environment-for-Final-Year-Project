package com.final_project.faculty_service;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import java.util.Optional;

@Configuration
@EnableMongoAuditing(auditorAwareRef = "auditorProvider")
public class MongoConfiguration {

    @Bean
    public AuditorAware<String> auditorProvider(){
        return () -> Optional.of("System");
    }

}

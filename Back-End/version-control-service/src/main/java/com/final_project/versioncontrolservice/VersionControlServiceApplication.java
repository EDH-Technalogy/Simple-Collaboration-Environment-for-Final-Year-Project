package com.final_project.versioncontrolservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VersionControlServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VersionControlServiceApplication.class, args);
    }

}

package com.final_project.notification_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI notificationServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Notification Service API")
                        .description(" Microservice responsible for delivering all system notifications.\n" +
                                     "\n" +
                                     "**Supported notification types:**\n" +
                                     "- User registration welcome emails\n" +
                                     "- Password change / reset security alerts\n" +
                                     "- System and repository invitations\n" +
                                     "- Blog post new comment alerts\n" +
                                     "- Comment reply alerts\n" +
                                     "\n" +
                                     "**Communication:** Async via Apache Kafka; sync via REST for admin/ops.\n" +
                                     "**Delivery channel:** Email (SMTP / Thymeleaf HTML templates).\n")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Platform Team")
                                .email("platform@app.com"))
                        .license(new License()
                                .name("Internal — All Rights Reserved")))
                .externalDocs(new ExternalDocumentation()
                        .description("Notification Service Confluence")
                        .url("https://wiki.app.com/notification-service"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token issued by the auth-service")));
    }
}
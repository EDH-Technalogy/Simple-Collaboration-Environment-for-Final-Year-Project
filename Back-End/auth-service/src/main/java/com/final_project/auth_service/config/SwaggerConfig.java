package com.final_project.auth_service.config;


import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for API documentation.
 *
 * Provides:
 * - API information and metadata
 * - OAuth 2.0 security scheme
 * - Contact and license information
 */
@Configuration
public class SwaggerConfig {

    /**
     * Configures OpenAPI documentation with OAuth 2.0 security scheme.
     *
     * @return Configured OpenAPI instance
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("User Microservice API")
                        .version("1.0.0")
                        .description("Comprehensive user management service with authentication, authorization, and Keycloak integration")
                        .contact(new Contact()
                                .name("Microservices Team")
                                .email("support@example.com")
                                .url("https://example.com")
                        )
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList("Bearer Token"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Bearer Token", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token")
                        )
                );
    }
}
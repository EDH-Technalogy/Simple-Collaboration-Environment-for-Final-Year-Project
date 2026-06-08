package com.final_project.blog_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI Configuration
 *
 * Configures Swagger/OpenAPI documentation for the Article Service
 *
 * Access at: http://localhost:8081/swagger-ui.html
 * API Docs JSON: http://localhost:8081/v3/api-docs
 * API Docs YAML: http://localhost:8081/v3/api-docs.yaml
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(getApiInfo())
                .components(getComponents())
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    /**
     * API Information
     */
    private Info getApiInfo() {
        return new Info()
                .title("Article Service API")
                .version("1.0.0")
                .description("""
                **Medium-Like Blogging Platform - Article Service**
                
                A production-grade Spring Boot microservice for managing blog articles,
                comments, engagement, and user interactions.
                
                ## Features
                - ✅ Create, read, update, and publish articles
                - ✅ Block-based flexible content (text, images, videos, code, quotes, embeds)
                - ✅ Hierarchical threaded comments and replies
                - ✅ Engagement tracking (likes, shares, read metrics)
                - ✅ JWT authentication with User Service integration
                - ✅ User profile caching with fallback mechanism
                - ✅ MongoDB for flexible document storage
                - ✅ Redis caching for performance
                - ✅ Full-text search capabilities
                
                ## Security
                - All write operations require JWT authentication
                - JWT tokens obtained from User Service
                - Only article authors can edit/delete their articles
                - Only comment authors can delete their comments
                - Input validation on all endpoints
                
                ## API Structure
                - **Base Path**: `/api/v1`
                - **Articles**: `/articles` - CRUD operations on blog posts
                - **Comments**: `/articles/{id}/comments` - Threaded discussions
                - **Engagement**: `/articles/{id}/like`, `/articles/{id}/share` - User interactions
                
                ## Content Blocks
                Articles support flexible content blocks:
                - `text` - Rich text content
                - `heading` - Headers with levels 1-6
                - `image` - Images with captions
                - `video` - Video embeds
                - `code` - Code snippets with syntax highlighting
                - `quote` - Quoted text with attribution
                - `embed` - External embeds (YouTube, Twitter, etc.)
                - `divider` - Visual separator
                
                ## Authentication
                All protected endpoints require JWT Bearer token in Authorization header:
                ```
                Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
                ```
                
                ## Response Format
                - Successful responses include status code and data
                - Error responses include error code, message, and timestamp
                - Paginated responses include pagination metadata
                
                ## Pagination
                List endpoints support pagination with:
                - `page` - Zero-indexed page number (default: 0)
                - `pageSize` - Items per page (default: 20, max: 100)
                
                ## Rate Limiting
                - Read operations: 100 requests/minute per user
                - Write operations: 20 requests/minute per user
                - Publish operations: 5 requests/minute per user
                """)
                .contact(new Contact()
                        .name("Backend Team")
                        .email("backend@blog.com")
                        .url("https://blog.com/support"))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"))
                .termsOfService("https://blog.com/terms");
    }


    /**
     * Security Schemes and Components
     */
    private Components getComponents() {
        return new Components()
                .addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("""
                        JWT Bearer Token obtained from User Service.
                        
                        **How to get a token:**
                        1. Call User Service login endpoint: POST /api/v1/auth/login
                        2. Provide email and password
                        3. Receive JWT token in response
                        4. Include token in Authorization header for all requests
                        
                        **Token Format:**
                        ```
                        Authorization: Bearer <your_jwt_token_here>
                        ```
                        
                        **Token Claims:**
                        - `sub` (subject) - User ID
                        - `email` - User email
                        - `iat` (issued at) - Token creation timestamp
                        - `exp` (expiration) - Token expiration timestamp (24 hours)
                        """)
                );
    }
}


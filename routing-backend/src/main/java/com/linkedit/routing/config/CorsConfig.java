package com.linkedit.routing.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Production-ready CORS configuration mapping /api/** endpoints.
 * Allowed origins are driven by 'cors.allowed-origins' (or environment variable 'CORS_ALLOWED_ORIGINS').
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public CorsConfig(
        @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:4173}") String[] allowedOrigins
    ) {
        this.allowedOrigins = Arrays.stream(allowedOrigins)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type", "Accept")
            .maxAge(3600);
    }
}

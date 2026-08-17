package com.linkedit.routing.controller;

import com.linkedit.routing.exception.InvalidOptimizationRequestException;
import com.linkedit.routing.exception.OptimizationException;
import com.linkedit.routing.exception.RoutingProviderException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidOptimizationRequestException.class)
    public ResponseEntity<ApiError> invalidRequest(InvalidOptimizationRequestException exception) {
        return ResponseEntity.badRequest().body(new ApiError("INVALID_REQUEST", exception.getErrors()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformedJson() {
        return ResponseEntity.badRequest().body(new ApiError("INVALID_JSON", List.of("Request JSON is malformed or has invalid field types")));
    }

    @ExceptionHandler(OptimizationException.class)
    public ResponseEntity<ApiError> optimizationFailure(OptimizationException exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiError("OPTIMIZATION_FAILED", List.of(exception.getMessage())));
    }

    @ExceptionHandler(RoutingProviderException.class)
    public ResponseEntity<ApiError> routingFailure(RoutingProviderException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ApiError("ROUTING_PROVIDER_FAILED", List.of(exception.getMessage())));
    }

    public record ApiError(String code, List<String> errors) {
    }
}

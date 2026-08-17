package com.linkedit.routing.exception;

import java.util.List;

public class InvalidOptimizationRequestException extends RuntimeException {

    private final List<String> errors;

    public InvalidOptimizationRequestException(List<String> errors) {
        super("Optimization request is invalid: " + String.join("; ", errors));
        this.errors = List.copyOf(errors);
    }

    public List<String> getErrors() {
        return errors;
    }
}

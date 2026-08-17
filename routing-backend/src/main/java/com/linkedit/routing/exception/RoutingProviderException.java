package com.linkedit.routing.exception;

public class RoutingProviderException extends OptimizationException {

    public RoutingProviderException(String message) {
        super(message);
    }

    public RoutingProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}

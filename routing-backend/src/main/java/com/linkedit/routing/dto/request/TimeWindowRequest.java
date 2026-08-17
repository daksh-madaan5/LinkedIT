package com.linkedit.routing.dto.request;

/** Start and end are seconds from the beginning of the route day. */
public record TimeWindowRequest(Double start, Double end) {
}

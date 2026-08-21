package com.linkedit.routing.cache;

/**
 * Thread-safe container for an in-memory cache entry with an expiration timestamp.
 *
 * @param <T> the type of cached value
 */
public record CacheEntry<T>(T value, long expiresAtMillis) {

    public boolean isExpired() {
        return System.currentTimeMillis() >= expiresAtMillis;
    }
}

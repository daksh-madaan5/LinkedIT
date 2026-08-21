package com.linkedit.routing.cache;

import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight, thread-safe in-memory cache backed by ConcurrentHashMap with TTL and size protection.
 *
 * @param <K> the key type
 * @param <V> the value type
 */
public class InMemoryCache<K, V> {

    private final ConcurrentHashMap<K, CacheEntry<V>> storage = new ConcurrentHashMap<>();

    public Optional<V> get(K key) {
        if (key == null) {
            return Optional.empty();
        }
        CacheEntry<V> entry = storage.get(key);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            storage.remove(key, entry);
            return Optional.empty();
        }
        return Optional.of(entry.value());
    }

    public void put(K key, V value, Duration ttl, int maxEntries) {
        if (key == null || value == null || ttl == null || ttl.isNegative() || ttl.isZero()) {
            return;
        }

        if (storage.size() >= maxEntries) {
            evictOne(maxEntries);
        }

        long expiresAt = System.currentTimeMillis() + ttl.toMillis();
        storage.put(key, new CacheEntry<>(value, expiresAt));
    }

    public void clear() {
        storage.clear();
    }

    public int size() {
        return storage.size();
    }

    public boolean containsKey(K key) {
        return get(key).isPresent();
    }

    private void evictOne(int maxEntries) {
        // First try to find and remove any expired entry
        Iterator<Map.Entry<K, CacheEntry<V>>> iterator = storage.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<K, CacheEntry<V>> next = iterator.next();
            if (next.getValue().isExpired()) {
                iterator.remove();
                return;
            }
        }
        // If no expired entries, evict an arbitrary entry
        Iterator<K> keyIterator = storage.keySet().iterator();
        if (keyIterator.hasNext()) {
            storage.remove(keyIterator.next());
        }
    }
}

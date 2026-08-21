package com.linkedit.routing.config;

import com.linkedit.routing.cache.RoutingCacheProperties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConcurrencyConfig {

    @Bean(destroyMethod = "shutdown")
    public ExecutorService geometryExecutor(RoutingCacheProperties properties) {
        int parallelism = properties.getGeometry().getParallelism();
        if (parallelism <= 0) {
            parallelism = 5;
        }

        ThreadFactory threadFactory = new ThreadFactory() {
            private final AtomicInteger count = new AtomicInteger(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "geometry-enrichment-" + count.getAndIncrement());
                thread.setDaemon(true);
                return thread;
            }
        };

        return Executors.newFixedThreadPool(parallelism, threadFactory);
    }
}

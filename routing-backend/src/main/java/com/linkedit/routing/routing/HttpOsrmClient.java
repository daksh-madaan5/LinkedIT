package com.linkedit.routing.routing;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedit.routing.cache.CacheKeyGenerator;
import com.linkedit.routing.cache.InMemoryCache;
import com.linkedit.routing.cache.RoutingCacheProperties;
import com.linkedit.routing.dto.response.RouteGeometry;
import com.linkedit.routing.exception.RoutingProviderException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class HttpOsrmClient implements OsrmClient {

    private static final Logger log = LoggerFactory.getLogger(HttpOsrmClient.class);

    private final OsrmProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final RoutingCacheProperties cacheProperties;

    private final InMemoryCache<String, RoutingMatrix> matrixCache = new InMemoryCache<>();
    private final InMemoryCache<String, RouteGeometry> geometryCache = new InMemoryCache<>();

    @Autowired
    public HttpOsrmClient(OsrmProperties properties, ObjectMapper objectMapper, RoutingCacheProperties cacheProperties) {
        this(properties, objectMapper, HttpClient.newBuilder()
                .connectTimeout(properties.getConnectTimeout())
                .build(), cacheProperties);
    }

    public HttpOsrmClient(OsrmProperties properties, ObjectMapper objectMapper) {
        this(properties, objectMapper, HttpClient.newBuilder()
                .connectTimeout(properties.getConnectTimeout())
                .build(), new RoutingCacheProperties());
    }

    HttpOsrmClient(
            OsrmProperties properties,
            ObjectMapper objectMapper,
            HttpClient httpClient) {
        this(properties, objectMapper, httpClient, new RoutingCacheProperties());
    }

    HttpOsrmClient(
            OsrmProperties properties,
            ObjectMapper objectMapper,
            HttpClient httpClient,
            RoutingCacheProperties cacheProperties) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.cacheProperties = cacheProperties != null ? cacheProperties : new RoutingCacheProperties();
    }

    public InMemoryCache<String, RoutingMatrix> getMatrixCache() {
        return matrixCache;
    }

    public InMemoryCache<String, RouteGeometry> getGeometryCache() {
        return geometryCache;
    }

    @Override
    public RoutingMatrix table(RoutingLocations locations) {
        int size = locations.uniqueLocations().size();
        if (size == 0) throw new RoutingProviderException("At least one routing location is required");
        if (size > properties.getMaxLocations()) {
            throw new RoutingProviderException(
                "Optimization has " + size + " unique locations; routing.osrm.max-locations is "
                    + properties.getMaxLocations()
            );
        }

        boolean cachingEnabled = cacheProperties.getCache().isEnabled();
        String cacheKey = cachingEnabled ? CacheKeyGenerator.forMatrix(locations.uniqueLocations(), properties.getBaseUrl()) : null;
        if (cachingEnabled) {
            Optional<RoutingMatrix> cached = matrixCache.get(cacheKey);
            if (cached.isPresent()) {
                log.info("OSRM matrix cache HIT");
                return cached.get();
            }
            log.info("OSRM matrix cache MISS");
        }

        HttpRequest request = HttpRequest.newBuilder(buildTableUri(locations.uniqueLocations()))
            .timeout(properties.getRequestTimeout())
            .header("Accept", "application/json")
            .GET()
            .build();
        HttpResponse<String> response = sendWithRetry(request, "table");
        RoutingMatrix matrix = toMatrix(response.body(), locations, size);

        if (cachingEnabled) {
            matrixCache.put(cacheKey, matrix, cacheProperties.getCache().getTtl(), cacheProperties.getCache().getMaxEntries());
        }
        return matrix;
    }

    @Override
    public RouteGeometry route(List<RoutingLocation> orderedLocations) {
        if (orderedLocations == null || orderedLocations.size() < 2) {
            throw new RoutingProviderException("At least two ordered locations are required for route geometry");
        }

        boolean cachingEnabled = cacheProperties.getCache().isEnabled();
        String cacheKey = cachingEnabled ? CacheKeyGenerator.forGeometry(orderedLocations, properties.getBaseUrl()) : null;
        if (cachingEnabled) {
            Optional<RouteGeometry> cached = geometryCache.get(cacheKey);
            if (cached.isPresent()) {
                log.info("Geometry cache HIT");
                return cached.get();
            }
            log.info("Geometry cache MISS");
        }

        HttpRequest request = HttpRequest.newBuilder(buildRouteUri(orderedLocations))
            .timeout(properties.getRequestTimeout())
            .header("Accept", "application/json")
            .GET()
            .build();
        HttpResponse<String> response = sendWithRetry(request, "route");
        RouteGeometry geometry = toGeometry(response.body());

        if (cachingEnabled) {
            geometryCache.put(cacheKey, geometry, cacheProperties.getCache().getTtl(), cacheProperties.getCache().getMaxEntries());
        }
        return geometry;
    }

    private HttpResponse<String> sendWithRetry(HttpRequest request, String operationName) {
        int maxAttempts = 2;
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    return response;
                }
                if (response.statusCode() == 429 || response.statusCode() >= 500) {
                    if (attempt < maxAttempts) {
                        try {
                            Thread.sleep(600);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RoutingProviderException("OSRM request was interrupted during retry", ie);
                        }
                        continue;
                    }
                }
                throw new RoutingProviderException("OSRM " + operationName + " request failed with HTTP " + response.statusCode());
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new RoutingProviderException("OSRM " + operationName + " request was interrupted", exception);
            } catch (IOException exception) {
                lastException = exception;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(600);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RoutingProviderException("OSRM request was interrupted during retry", ie);
                    }
                    continue;
                }
            }
        }
        throw new RoutingProviderException("OSRM " + operationName + " request failed: " + safeMessage(lastException), lastException);
    }

    URI buildTableUri(List<RoutingLocation> locations) {
        String baseUrl = properties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new RoutingProviderException("routing.osrm.base-url must be configured");
        }
        String normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String coordinates = OsrmCoordinateFormatter.format(locations);
        try {
            return URI.create(normalizedBaseUrl + "/table/v1/driving/" + coordinates
                + "?annotations=distance,duration");
        } catch (IllegalArgumentException exception) {
            throw new RoutingProviderException("routing.osrm.base-url is invalid", exception);
        }
    }

    URI buildRouteUri(List<RoutingLocation> orderedLocations) {
        String baseUrl = properties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new RoutingProviderException("routing.osrm.base-url must be configured");
        }
        String normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        try {
            return URI.create(normalizedBaseUrl + "/route/v1/driving/"
                + OsrmCoordinateFormatter.format(orderedLocations)
                + "?overview=full&geometries=geojson");
        } catch (IllegalArgumentException exception) {
            throw new RoutingProviderException("routing.osrm.base-url is invalid", exception);
        }
    }

    private RoutingMatrix toMatrix(String body, RoutingLocations locations, int expectedSize) {
        try {
            TableResponse response = objectMapper.readValue(body, TableResponse.class);
            if (!"Ok".equals(response.code())) {
                String detail = response.message() == null ? "unknown OSRM error" : response.message();
                throw new RoutingProviderException("OSRM table request was rejected: " + detail);
            }
            double[][] distances = convert("distance", response.distances(), expectedSize, locations);
            double[][] durations = convert("duration", response.durations(), expectedSize, locations);
            return new RoutingMatrix(locations.indexById(), distances, durations);
        } catch (JsonProcessingException exception) {
            throw new RoutingProviderException("OSRM returned invalid JSON", exception);
        }
    }

    private double[][] convert(
        String name, List<List<Double>> values, int expectedSize, RoutingLocations locations
    ) {
        if (values == null || values.size() != expectedSize) {
            throw new RoutingProviderException("OSRM " + name + " matrix has invalid dimensions");
        }
        double[][] matrix = new double[expectedSize][expectedSize];
        for (int row = 0; row < expectedSize; row++) {
            List<Double> sourceRow = values.get(row);
            if (sourceRow == null || sourceRow.size() != expectedSize) {
                throw new RoutingProviderException("OSRM " + name + " matrix has invalid dimensions");
            }
            for (int column = 0; column < expectedSize; column++) {
                Double value = sourceRow.get(column);
                if (value == null) {
                    throw new RoutingProviderException(
                        "OSRM cannot route " + locations.uniqueLocations().get(row).id() + " -> "
                            + locations.uniqueLocations().get(column).id()
                    );
                }
                matrix[row][column] = value;
            }
        }
        return matrix;
    }

    RouteGeometry toGeometry(String body) {
        try {
            RouteResponse response = objectMapper.readValue(body, RouteResponse.class);
            if (!"Ok".equals(response.code())) {
                String detail = response.message() == null ? "unknown OSRM error" : response.message();
                throw new RoutingProviderException("OSRM route request was rejected: " + detail);
            }
            if (response.routes() == null || response.routes().isEmpty()) {
                throw new RoutingProviderException("OSRM route response contains no routes");
            }
            RouteGeometry geometry = response.routes().getFirst().geometry();
            validateGeometry(geometry);
            return geometry;
        } catch (JsonProcessingException exception) {
            throw new RoutingProviderException("OSRM returned invalid JSON for route geometry", exception);
        }
    }

    private void validateGeometry(RouteGeometry geometry) {
        if (geometry == null || !"LineString".equals(geometry.type())
            || geometry.coordinates() == null || geometry.coordinates().size() < 2) {
            throw new RoutingProviderException("OSRM route response contains invalid geometry");
        }
        for (List<Double> coordinate : geometry.coordinates()) {
            if (coordinate == null || coordinate.size() != 2
                || coordinate.get(0) == null || !Double.isFinite(coordinate.get(0))
                || coordinate.get(1) == null || !Double.isFinite(coordinate.get(1))
                || coordinate.get(0) < -180 || coordinate.get(0) > 180
                || coordinate.get(1) < -90 || coordinate.get(1) > 90) {
                throw new RoutingProviderException("OSRM route response contains invalid geometry coordinates");
            }
        }
    }

    private String safeMessage(Exception exception) {
        if (exception == null) return "unknown network error";
        return exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage();
    }

    private record TableResponse(
        String code,
        String message,
        List<List<Double>> distances,
        List<List<Double>> durations
    ) {
    }

    private record RouteResponse(String code, String message, List<OsrmRoute> routes) {
    }

    private record OsrmRoute(RouteGeometry geometry) {
    }
}

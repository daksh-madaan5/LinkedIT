package com.linkedit.routing.routing;

import com.linkedit.routing.dto.response.RouteGeometry;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Offline display geometry matching crow-fly optimization semantics. */
@Component
@ConditionalOnProperty(name = "routing.provider", havingValue = "crowfly", matchIfMissing = true)
public class CrowFlyRouteGeometryProvider implements RouteGeometryProvider {

    @Override
    public RouteGeometry getGeometry(List<RoutingLocation> orderedLocations) {
        List<List<Double>> coordinates = orderedLocations.stream()
            .map(location -> List.of(location.longitude(), location.latitude()))
            .toList();
        return new RouteGeometry("LineString", coordinates);
    }
}

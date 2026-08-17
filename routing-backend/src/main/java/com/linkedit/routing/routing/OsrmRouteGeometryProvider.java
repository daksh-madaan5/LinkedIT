package com.linkedit.routing.routing;

import com.linkedit.routing.dto.response.RouteGeometry;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "routing.provider", havingValue = "osrm")
public class OsrmRouteGeometryProvider implements RouteGeometryProvider {

    private final OsrmClient osrmClient;

    public OsrmRouteGeometryProvider(OsrmClient osrmClient) {
        this.osrmClient = osrmClient;
    }

    @Override
    public RouteGeometry getGeometry(List<RoutingLocation> orderedLocations) {
        return osrmClient.route(orderedLocations);
    }
}

package com.linkedit.routing.routing;

import com.linkedit.routing.dto.response.RouteGeometry;
import com.linkedit.routing.exception.RoutingProviderException;
import java.util.List;

public interface OsrmClient {

    RoutingMatrix table(RoutingLocations locations);

    default RouteGeometry route(List<RoutingLocation> orderedLocations) {
        throw new RoutingProviderException("OSRM Route API is not implemented by this client");
    }
}

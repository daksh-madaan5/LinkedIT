package com.linkedit.routing.routing;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedit.routing.dto.response.RouteGeometry;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HttpOsrmClientTest {

    @Test
    void constructsCoordinatesAsLongitudeThenLatitude() {
        OsrmProperties properties = new OsrmProperties();
        properties.setBaseUrl("http://localhost:5000/");
        HttpOsrmClient client = new HttpOsrmClient(properties, new ObjectMapper(), null);
        RoutingLocations locations = new RoutingLocations(
            List.of(
                new RoutingLocation("DEPOT-1", 20.2961, 85.8245),
                new RoutingLocation("D1", 20.305, 85.817)
            ),
            Map.of("DEPOT-1", 0, "D1", 1)
        );

        URI uri = client.buildTableUri(locations.uniqueLocations());

        assertEquals(
            "http://localhost:5000/table/v1/driving/85.8245,20.2961;85.817,20.305?annotations=distance,duration",
            uri.toString()
        );
    }

    @Test
    void constructsFinalRouteCoordinatesInExactLongitudeLatitudeOrder() {
        OsrmProperties properties = new OsrmProperties();
        properties.setBaseUrl("http://localhost:5000/");
        HttpOsrmClient client = new HttpOsrmClient(properties, new ObjectMapper(), null);
        List<RoutingLocation> route = List.of(
            new RoutingLocation("DEPOT", 20.2961, 85.8245),
            new RoutingLocation("D1", 20.305, 85.817),
            new RoutingLocation("D2", 20.31, 85.83),
            new RoutingLocation("DEPOT", 20.2961, 85.8245)
        );

        URI uri = client.buildRouteUri(route);

        assertEquals(
            "http://localhost:5000/route/v1/driving/85.8245,20.2961;85.817,20.305;"
                + "85.83,20.31;85.8245,20.2961?overview=full&geometries=geojson",
            uri.toString()
        );
    }

    @Test
    void parsesGeoJsonLineStringFromOsrmRouteResponse() {
        HttpOsrmClient client = new HttpOsrmClient(new OsrmProperties(), new ObjectMapper(), null);
        String body = """
            {
              "code": "Ok",
              "routes": [{
                "geometry": {
                  "type": "LineString",
                  "coordinates": [[85.82, 20.29], [85.83, 20.30]]
                }
              }]
            }
            """;

        RouteGeometry geometry = client.toGeometry(body);

        assertEquals("LineString", geometry.type());
        assertEquals(List.of(List.of(85.82, 20.29), List.of(85.83, 20.30)), geometry.coordinates());
    }
}

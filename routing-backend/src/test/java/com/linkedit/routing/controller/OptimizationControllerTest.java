package com.linkedit.routing.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.OptimizationSummary;
import com.linkedit.routing.dto.response.RouteGeometry;
import com.linkedit.routing.dto.response.RouteResponse;
import com.linkedit.routing.dto.response.StopResponse;
import com.linkedit.routing.service.OptimizationService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(OptimizationController.class)
class OptimizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OptimizationService optimizationService;

    @Test
    void optimizeResponseIncludesTypedGeoJsonGeometry() throws Exception {
        RouteResponse route = new RouteResponse(
            "V1",
            List.of(new StopResponse("D1", 1, 20.30, 85.83, 100, 160, 0)),
            14_320.5,
            2_340.2,
            1,
            1,
            new RouteGeometry("LineString", List.of(List.of(85.8245, 20.2961), List.of(85.83, 20.30)))
        );
        when(optimizationService.optimize(any())).thenReturn(new OptimizationResponse(
            List.of(route),
            List.of(),
            new OptimizationSummary(14_320.5, 2_340.2, 1, 1, 1, 0, 14.3205)
        ));

        mockMvc.perform(post("/api/optimize")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "depot": {"id":"DEPOT","latitude":20.2961,"longitude":85.8245},
                      "vehicles": [{"id":"V1","capacity":1}],
                      "jobs": [{"id":"D1","latitude":20.30,"longitude":85.83,"demand":1,"serviceDuration":0}]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.routes[0].geometry.type").value("LineString"))
            .andExpect(jsonPath("$.routes[0].geometry.coordinates[0][0]").value(85.8245))
            .andExpect(jsonPath("$.routes[0].geometry.coordinates[0][1]").value(20.2961));
    }
}

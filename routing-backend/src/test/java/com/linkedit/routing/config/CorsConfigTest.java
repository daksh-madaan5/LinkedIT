package com.linkedit.routing.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "cors.allowed-origins=http://localhost:5173,http://localhost:4173"
})
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void optionsPreflightRequestIsAcceptedForAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/optimize")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
            .andExpect(header().string("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"));
    }

    @Test
    void postOptimizeIsAcceptedWithCorsHeaderForAllowedOrigin() throws Exception {
        mockMvc.perform(post("/api/optimize")
                .header("Origin", "http://localhost:5173")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "depot": {"id":"DEPOT","latitude":20.2961,"longitude":85.8245},
                      "vehicles": [{"id":"V1","capacity":50}],
                      "jobs": [{"id":"D1","latitude":20.30,"longitude":85.83,"demand":10,"serviceDuration":120}]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void preflightRequestIsForbiddenForUnallowedOrigin() throws Exception {
        mockMvc.perform(options("/api/optimize")
                .header("Origin", "http://unauthorized-domain.com")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden());
    }

    @Test
    void postRequestLacksCorsHeaderForUnallowedOrigin() throws Exception {
        mockMvc.perform(post("/api/optimize")
                .header("Origin", "http://unauthorized-domain.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "depot": {"id":"DEPOT","latitude":20.2961,"longitude":85.8245},
                      "vehicles": [{"id":"V1","capacity":50}],
                      "jobs": [{"id":"D1","latitude":20.30,"longitude":85.83,"demand":10,"serviceDuration":120}]
                    }
                    """))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}

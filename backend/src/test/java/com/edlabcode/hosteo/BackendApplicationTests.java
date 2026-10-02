package com.edlabcode.hosteo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BackendApplicationTests {

	@LocalServerPort
	private int port;

	@Test
	void openApiAndSwaggerAreAvailable() throws Exception {
		var api = get("/v3/api-docs");
		assertEquals(200, api.statusCode());
		assertTrue(api.body().contains("\"openapi\""));
		assertTrue(api.body().contains("Hosteo API"));

		var ui = get("/swagger-ui/index.html");
		assertEquals(200, ui.statusCode());
		assertTrue(ui.body().contains("Swagger UI"));
		assertEquals(302, get("/swagger-ui.html").statusCode());
	}

	@Test
	void healthIsAvailableWithoutDetails() throws Exception {
		var health = get("/actuator/health");
		assertEquals(200, health.statusCode());
		assertTrue(health.body().contains("\"status\":\"UP\""));
		assertFalse(health.body().contains("\"details\""));
		assertFalse(health.body().contains("\"components\""));
	}

	private HttpResponse<String> get(String path) throws Exception {
		try (var client = HttpClient.newHttpClient()) {
			return client.send(HttpRequest.newBuilder()
					.uri(URI.create("http://localhost:" + port + path))
					.GET().build(), HttpResponse.BodyHandlers.ofString());
		}
	}

}

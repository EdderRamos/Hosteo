package com.edlabcode.hosteo;

import com.edlabcode.hosteo.config.JwtProperties;
import com.edlabcode.hosteo.entity.Role;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.repository.RoleRepository;
import com.edlabcode.hosteo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(AuthIntegrationTests.TestRoutes.class)
class AuthIntegrationTests {
    @LocalServerPort
    private int port;
    @Autowired
    private UserRepository users;
    @Autowired
    private RoleRepository roles;
    @Autowired
    private PasswordEncoder passwords;
    @Autowired
    private JwtEncoder encoder;
    @Autowired
    private JwtProperties properties;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void prepareRoles() {
        users.deleteAll();
        for (RoleCode code : RoleCode.values()) {
            if (roles.findByCode(code).isEmpty()) {
                var role = new Role();
                role.setCode(code);
                roles.save(role);
            }
        }
    }

    @Test
    void everyRoleCanLoginAndAccessItsOwnIdentity() throws Exception {
        for (RoleCode role : RoleCode.values()) {
            var user = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            var response = login(user.getEmail().toUpperCase(), "ValidPassword123!");
            assertEquals(200, response.statusCode());
            assertEquals(2, json(response).size());
            assertEquals(user.getId().longValue(), json(response).get("user").get("id").asLong());
            assertFalse(json(response).get("user").has("role"));
            assertEquals(user.getRole().getId().longValue(), json(response).get("user").get("roleId").asLong());
            assertTrue(json(response).has("accessToken"));
            String token = json(response).get("accessToken").asText();
            var me = request("GET", "/api/v1/auth/me", null, token);
            assertEquals(200, me.statusCode());
            assertEquals(user.getId().longValue(), json(me).get("id").asLong());
            assertFalse(me.body().contains("password"));
            assertEquals(user.getRole().getId().longValue(), json(me).get("roleId").asLong());
            assertFalse(json(me).has("role"));
            assertNotNull(users.findById(user.getId()).orElseThrow().getLastLoginAt());
            assertEquals("no-store", response.headers().firstValue("cache-control").orElseThrow());
        }
    }

    @Test
    void invalidCredentialsAndInactiveAccountsHaveTheSameResponse() throws Exception {
        createUser("active@hosteo.test", RoleCode.GUEST, true);
        createUser("inactive@hosteo.test", RoleCode.GUEST, false);
        for (var credentials : new String[][] {
                {"active@hosteo.test", "WrongPassword"},
                {"missing@hosteo.test", "ValidPassword123!"},
                {"inactive@hosteo.test", "ValidPassword123!"}}) {
            var response = login(credentials[0], credentials[1]);
            assertEquals(401, response.statusCode());
            assertEquals("INVALID_CREDENTIALS", json(response).get("code").asText());
            assertEquals("Invalid email or password", json(response).get("message").asText());
            assertFalse(response.body().contains("accessToken"));
        }
    }

    @Test
    void invalidAndMalformedInputIsRejected() throws Exception {
        assertEquals(400, login("invalid", "").statusCode());
        assertEquals(400, request("POST", "/api/v1/auth/login", "{", null).statusCode());
        assertEquals(400, request("POST", "/api/v1/auth/login", "{}", null).statusCode());
    }

    @Test
    void missingTamperedAndExpiredTokensAreRejected() throws Exception {
        var user = createUser("guest@hosteo.test", RoleCode.GUEST, true);
        assertEquals(401, request("GET", "/api/v1/auth/me", null, null).statusCode());
        String valid = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String[] parts = valid.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "." + (parts[2].startsWith("A") ? "B" : "A") + parts[2].substring(1);
        assertEquals(401, request("GET", "/api/v1/auth/me", null, tampered).statusCode());
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject(user.getId().toString())
                .issuer(properties.issuer()).issuedAt(now.minusSeconds(120))
                .expiresAt(now.minusSeconds(60)).claim("roleId", user.getRole().getId()).build();
        String expired = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        assertEquals(401, request("GET", "/api/v1/auth/me", null, expired).statusCode());
    }

    @Test
    void supportCannotAccessAdministrativeRoutes() throws Exception {
        createUser("support@hosteo.test", RoleCode.SUPPORT, true);
        createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        String support = json(login("support@hosteo.test", "ValidPassword123!")).get("accessToken").asText();
        String admin = json(login("admin@hosteo.test", "ValidPassword123!")).get("accessToken").asText();
        assertEquals(403, request("GET", "/api/v1/admin/test", null, support).statusCode());
        assertEquals(200, request("GET", "/api/v1/admin/test", null, admin).statusCode());
    }

    @Test
    void deactivationAndRoleChangesInvalidateExistingTokens() throws Exception {
        var user = createUser("guest@hosteo.test", RoleCode.GUEST, true);
        String token = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        user = users.findById(user.getId()).orElseThrow();
        user.setActive(false);
        users.saveAndFlush(user);
        assertEquals(401, request("GET", "/api/v1/auth/me", null, token).statusCode());
        user = users.findById(user.getId()).orElseThrow();
        user.setActive(true);
        user.setRole(roles.findByCode(RoleCode.SUPPORT).orElseThrow());
        users.saveAndFlush(user);
        assertEquals(401, request("GET", "/api/v1/auth/me", null, token).statusCode());
    }

    @Test
    void profileUpdatesPreserveExistingPhotoWhilePhotoEditingIsDisabled() throws Exception {
        var user = createUser("profile@hosteo.test", RoleCode.GUEST, true);
        user.setAvatarUrl("https://example.com/original.jpg");
        users.saveAndFlush(user);
        String token = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        var profile = json(request("GET", "/api/v1/customer/profile", null, token));
        var payload = new java.util.HashMap<String, Object>();
        payload.put("firstName", "Updated");
        payload.put("lastName", "User");
        payload.put("email", user.getEmail());
        payload.put("languages", java.util.List.of());
        payload.put("interests", java.util.List.of());
        payload.put("version", profile.get("version").asLong());
        var updated = request("PUT", "/api/v1/customer/profile", mapper.writeValueAsString(payload), token);
        assertEquals(200, updated.statusCode());
        assertEquals("https://example.com/original.jpg", json(updated).get("avatarUrl").asText());
        payload.put("version", json(updated).get("version").asLong());
        payload.put("avatarUrl", "https://example.com/replacement.jpg");
        var attemptedPhoto = request("PUT", "/api/v1/customer/profile", mapper.writeValueAsString(payload), token);
        assertTrue(attemptedPhoto.statusCode() == 200 || attemptedPhoto.statusCode() == 400);
        assertEquals("https://example.com/original.jpg", users.findById(user.getId()).orElseThrow().getAvatarUrl());
    }

    private User createUser(String email, RoleCode code, boolean active) {
        var user = new User();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(roles.findByCode(code).orElseThrow());
        user.setPasswordHash(passwords.encode("ValidPassword123!"));
        user.setActive(active);
        return users.saveAndFlush(user);
    }

    private HttpResponse<String> login(String email, String password) throws Exception {
        return request("POST", "/api/v1/auth/login", mapper.writeValueAsString(
                Map.of("email", email, "password", password)), null);
    }

    private JsonNode json(HttpResponse<String> response) {
        return mapper.readTree(response.body());
    }

    private HttpResponse<String> request(String method, String path, String body, String token) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            builder.header("Content-Type", "application/json");
        }
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        try (var client = HttpClient.newHttpClient()) {
            return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        }
    }

    @TestConfiguration
    static class TestRoutes {
        @Bean
        AdminTestController adminTestController() {
            return new AdminTestController();
        }
    }

    @RestController
    static class AdminTestController {
        @GetMapping("/api/v1/admin/test")
        public String index() {
            return "ok";
        }
    }
}

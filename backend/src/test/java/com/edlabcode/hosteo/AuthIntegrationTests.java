package com.edlabcode.hosteo;

import com.edlabcode.hosteo.config.JwtProperties;
import com.edlabcode.hosteo.entity.Role;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.repository.RoleRepository;
import com.edlabcode.hosteo.repository.UserRepository;
import com.edlabcode.hosteo.repository.PropertyRepository;
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
    private PropertyRepository registeredProperties;
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
        registeredProperties.deleteAll();
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
            assertEquals(role.name(), json(me).get("roleCode").asText());
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
        var profile = json(request("GET", "/api/v1/profile", null, token));
        var payload = new java.util.HashMap<String, Object>();
        payload.put("firstName", "Updated");
        payload.put("lastName", "User");
        payload.put("email", user.getEmail());
        payload.put("languages", java.util.List.of());
        payload.put("interests", java.util.List.of());
        payload.put("version", profile.get("version").asLong());
        var updated = request("PUT", "/api/v1/profile", mapper.writeValueAsString(payload), token);
        assertEquals(200, updated.statusCode());
        assertEquals("https://example.com/original.jpg", json(updated).get("avatarUrl").asText());
        payload.put("version", json(updated).get("version").asLong());
        payload.put("avatarUrl", "https://example.com/replacement.jpg");
        var attemptedPhoto = request("PUT", "/api/v1/profile", mapper.writeValueAsString(payload), token);
        assertTrue(attemptedPhoto.statusCode() == 200 || attemptedPhoto.statusCode() == 400);
        assertEquals("https://example.com/original.jpg", users.findById(user.getId()).orElseThrow().getAvatarUrl());
    }

    @Test
    void staffPortalIsRestrictedAndOnlyAdministratorCanAssignRoles() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        var guest = createUser("target@hosteo.test", RoleCode.GUEST, true);
        String adminToken = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        var target = users.findById(guest.getId()).orElseThrow();
        String payload = mapper.writeValueAsString(Map.of("roleCode", "SUPPORT", "version", target.getVersion()));
        for (RoleCode role : RoleCode.values()) {
            var account = createUser(role.name().toLowerCase() + "-staff@hosteo.test", role, true);
            String token = json(login(account.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            boolean staff = role == RoleCode.ADMINISTRATOR || role == RoleCode.SUPPORT;
            assertEquals(staff ? 200 : 403, request("GET", "/api/v1/hosteo/users", null, token).statusCode());
            assertEquals(staff ? 200 : 403, request("GET", "/api/v1/hosteo/summary", null, token).statusCode());
            if (role != RoleCode.ADMINISTRATOR) assertEquals(403, request("PATCH", "/api/v1/hosteo/users/" + target.getId() + "/role", payload, token).statusCode());
        }
        assertEquals(401, request("GET", "/api/v1/hosteo/users", null, null).statusCode());
        assertEquals(400, request("GET", "/api/v1/hosteo/users?page=-1", null, adminToken).statusCode());
        var page = request("GET", "/api/v1/hosteo/users?query=target", null, adminToken);
        assertEquals(200, page.statusCode());
        assertEquals(1, json(page).get("total").asInt());
        assertFalse(page.body().contains("password"));
        assertEquals(200, request("GET", "/api/v1/hosteo/roles", null, adminToken).statusCode());
        assertEquals(200, request("PATCH", "/api/v1/hosteo/users/" + target.getId() + "/role", payload, adminToken).statusCode());
        assertEquals(RoleCode.SUPPORT, users.findById(target.getId()).orElseThrow().getRole().getCode());
        assertEquals(409, request("PATCH", "/api/v1/hosteo/users/" + target.getId() + "/role", payload, adminToken).statusCode());
    }

    @Test
    void assignmentInvalidatesTokensEvenWhenRoleIsRestoredAndRejectsUnsafeRequests() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        var target = createUser("target@hosteo.test", RoleCode.GUEST, true);
        String adminToken = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String oldToken = json(login(target.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String path = "/api/v1/hosteo/users/" + target.getId() + "/role";
        for (RoleCode role : new RoleCode[] {RoleCode.HOST, RoleCode.SUPPORT, RoleCode.ADMINISTRATOR, RoleCode.GUEST}) {
            var account = users.findById(target.getId()).orElseThrow();
            var response = request("PATCH", path, mapper.writeValueAsString(Map.of("roleCode", role, "version", account.getVersion())), adminToken);
            assertEquals(200, response.statusCode());
            assertEquals(role.name(), json(response).get("roleCode").asText());
            assertEquals(401, request("GET", "/api/v1/auth/me", null, oldToken).statusCode());
        }
        assertEquals(200, login(target.getEmail(), "ValidPassword123!").statusCode());
        var self = users.findById(admin.getId()).orElseThrow();
        assertEquals(400, request("PATCH", "/api/v1/hosteo/users/" + admin.getId() + "/role", mapper.writeValueAsString(Map.of("roleCode", "GUEST", "version", self.getVersion())), adminToken).statusCode());
        assertEquals(400, request("PATCH", path, "{\"roleCode\":\"SUPERADMIN\",\"version\":0}", adminToken).statusCode());
        assertEquals(400, request("PATCH", path, "{}", adminToken).statusCode());
        assertEquals(404, request("PATCH", "/api/v1/hosteo/users/999999/role", "{\"roleCode\":\"GUEST\",\"version\":0}", adminToken).statusCode());
    }

    @Test
    void administratorCanDisableAndEnableEveryRoleWithoutRevivingOldSessions() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        String adminToken = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        for (RoleCode role : RoleCode.values()) {
            var target = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String oldToken = json(login(target.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            target = users.findById(target.getId()).orElseThrow();
            String hash = target.getPasswordHash();
            String path = "/api/v1/hosteo/users/" + target.getId() + "/status";
            String disable = mapper.writeValueAsString(Map.of("active", false, "version", target.getVersion()));
            var disabled = request("PATCH", path, disable, adminToken);
            assertEquals(200, disabled.statusCode());
            assertFalse(json(disabled).get("active").asBoolean());
            assertEquals("no-store", disabled.headers().firstValue("cache-control").orElseThrow());
            assertEquals(401, login(target.getEmail(), "ValidPassword123!").statusCode());
            assertEquals(401, request("GET", "/api/v1/auth/me", null, oldToken).statusCode());
            assertEquals(409, request("PATCH", path, disable, adminToken).statusCode());
            var preserved = users.findById(target.getId()).orElseThrow();
            assertEquals(hash, preserved.getPasswordHash());
            assertEquals(role, preserved.getRole().getCode());
            long version = preserved.getVersion();
            long revision = preserved.getRoleRevision();
            var noop = request("PATCH", path, mapper.writeValueAsString(Map.of("active", false, "version", version)), adminToken);
            assertEquals(200, noop.statusCode());
            assertEquals(version, json(noop).get("version").asLong());
            assertEquals(revision, users.findById(target.getId()).orElseThrow().getRoleRevision());
            var enabled = request("PATCH", path, mapper.writeValueAsString(Map.of("active", true, "version", version)), adminToken);
            assertEquals(200, enabled.statusCode());
            assertTrue(json(enabled).get("active").asBoolean());
            assertEquals(401, request("GET", "/api/v1/auth/me", null, oldToken).statusCode());
            var freshLogin = login(target.getEmail(), "ValidPassword123!");
            assertEquals(200, freshLogin.statusCode());
            assertEquals(200, request("GET", "/api/v1/auth/me", null, json(freshLogin).get("accessToken").asText()).statusCode());
        }
    }

    @Test
    void accountStatusRequiresAdministratorAndRejectsSelfAndInvalidRequests() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        var target = createUser("target@hosteo.test", RoleCode.GUEST, true);
        String path = "/api/v1/hosteo/users/" + target.getId() + "/status";
        String payload = mapper.writeValueAsString(Map.of("active", false, "version", target.getVersion()));
        assertEquals(401, request("PATCH", path, payload, null).statusCode());
        for (RoleCode role : new RoleCode[] {RoleCode.GUEST, RoleCode.HOST, RoleCode.SUPPORT}) {
            var actor = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String token = json(login(actor.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            assertEquals(403, request("PATCH", path, payload, token).statusCode());
        }
        String token = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        long version = users.findById(admin.getId()).orElseThrow().getVersion();
        assertEquals(400, request("PATCH", "/api/v1/hosteo/users/" + admin.getId() + "/status", mapper.writeValueAsString(Map.of("active", false, "version", version)), token).statusCode());
        for (String invalid : new String[] {"{}", "{\"active\":null,\"version\":0}", "{\"active\":false}", "{\"active\":false,\"version\":-1}", "{\"active\":\"invalid\",\"version\":0}"})
            assertEquals(400, request("PATCH", path, invalid, token).statusCode());
        assertEquals(404, request("PATCH", "/api/v1/hosteo/users/999999/status", payload, token).statusCode());
        assertTrue(users.findById(target.getId()).orElseThrow().isActive());
        assertTrue(users.findById(admin.getId()).orElseThrow().isActive());
    }

    @Test
    void concurrentRoleAndStatusChangesCannotOverwriteEachOther() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        var target = createUser("target@hosteo.test", RoleCode.GUEST, true);
        String token = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String statusBody = mapper.writeValueAsString(Map.of("active", false, "version", target.getVersion()));
        String roleBody = mapper.writeValueAsString(Map.of("roleCode", "HOST", "version", target.getVersion()));
        String path = "/api/v1/hosteo/users/" + target.getId();
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            var start = new java.util.concurrent.CountDownLatch(1);
            var status = executor.submit(() -> { start.await(); return request("PATCH", path + "/status", statusBody, token).statusCode(); });
            var role = executor.submit(() -> { start.await(); return request("PATCH", path + "/role", roleBody, token).statusCode(); });
            start.countDown();
            var responses = java.util.stream.Stream.of(status.get(), role.get()).sorted().toList();
            assertEquals(java.util.List.of(200, 409), responses);
            var account = users.findById(target.getId()).orElseThrow();
            assertTrue((!account.isActive() && account.getRole().getCode() == RoleCode.GUEST)
                    || (account.isActive() && account.getRole().getCode() == RoleCode.HOST));
        }
    }

    @Test
    void allFourRolesManageOnlyTheirOwnPersonalProfile() throws Exception {
        assertEquals(401, request("GET", "/api/v1/profile", null, null).statusCode());
        for (RoleCode role : RoleCode.values()) {
            var account = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String token = json(login(account.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            var loaded = request("GET", "/api/v1/profile", null, token);
            assertEquals(200, loaded.statusCode());
            assertEquals(account.getId().longValue(), json(loaded).get("id").asLong());
            assertEquals(role.name(), json(loaded).get("roleCode").asText());
            var payload = new java.util.HashMap<String, Object>();
            payload.put("firstName", "Updated");
            payload.put("lastName", "Profile");
            payload.put("email", account.getEmail());
            payload.put("languages", java.util.List.of());
            payload.put("interests", java.util.List.of());
            payload.put("version", json(loaded).get("version").asLong());
            var saved = request("PUT", "/api/v1/profile", mapper.writeValueAsString(payload), token);
            assertEquals(200, saved.statusCode());
            assertEquals("Updated", json(saved).get("firstName").asText());
            assertEquals(role.name(), json(saved).get("roleCode").asText());
            assertEquals(account.getId().longValue(), json(saved).get("id").asLong());
        }
    }

    @Test
    void staffSummaryReportsFourRolesSeparately() throws Exception {
        var admin = createUser("admin@hosteo.test", RoleCode.ADMINISTRATOR, true);
        createUser("guest@hosteo.test", RoleCode.GUEST, true);
        createUser("host@hosteo.test", RoleCode.HOST, true);
        createUser("support@hosteo.test", RoleCode.SUPPORT, false);
        String token = json(login(admin.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        var response = request("GET", "/api/v1/hosteo/summary", null, token);
        assertEquals(200, response.statusCode());
        assertEquals(4, json(response).size());
        for (String field : new String[] {"guests", "hosts", "support", "administrators"})
            assertEquals(1, json(response).get(field).asInt());
    }

    private Map<String, Object> propertyPayload() {
        var payload = new java.util.HashMap<String, Object>();
        payload.put("title", "  Departamento Miraflores  ");
        payload.put("description", "Alojamiento luminoso cerca del parque.");
        payload.put("type", "APARTMENT"); payload.put("address", "Calle de Prueba 123");
        payload.put("city", "Lima"); payload.put("district", "Miraflores");
        payload.put("capacity", 4); payload.put("bedrooms", 2); payload.put("beds", 3); payload.put("bathrooms", 1);
        payload.put("nightlyRate", new java.math.BigDecimal("180.50")); payload.put("currency", "PEN");
        return payload;
    }

    @Test
    void hostRegistersDraftWithServerOwnershipAndCanReloadItsConfirmation() throws Exception {
        var host = createUser("host@hosteo.test", RoleCode.HOST, true);
        var other = createUser("other@hosteo.test", RoleCode.HOST, true);
        String token = json(login(host.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        var payload = propertyPayload();
        payload.put("hostId", other.getId()); payload.put("status", "PUBLISHED");
        var response = request("POST", "/api/v1/host/properties", mapper.writeValueAsString(payload), token, java.util.UUID.randomUUID().toString());
        assertEquals(201, response.statusCode());
        var property = json(response);
        assertEquals(host.getId().longValue(), property.get("hostId").asLong());
        assertEquals("DRAFT", property.get("status").asText());
        assertEquals("Departamento Miraflores", property.get("title").asText());
        assertEquals("PEN", property.get("currency").asText());
        assertNotNull(property.get("createdAt"));
        assertEquals("no-store", response.headers().firstValue("cache-control").orElseThrow());
        String location = response.headers().firstValue("location").orElseThrow();
        assertEquals("/api/v1/host/properties/" + property.get("id").asLong(), location);
        var read = request("GET", location, null, token);
        assertEquals(200, read.statusCode());
        assertEquals(property.get("id").asLong(), json(read).get("id").asLong());
        String otherToken = json(login(other.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        assertEquals(404, request("GET", location, null, otherToken).statusCode());
        assertEquals(404, request("GET", "/api/v1/host/properties/999999", null, token).statusCode());
    }

    @Test
    void registrationRequiresActiveHostAndValidPrincipalInformation() throws Exception {
        String body = mapper.writeValueAsString(propertyPayload());
        String key = java.util.UUID.randomUUID().toString();
        assertEquals(401, request("POST", "/api/v1/host/properties", body, null, key).statusCode());
        for (RoleCode role : new RoleCode[] {RoleCode.GUEST, RoleCode.SUPPORT, RoleCode.ADMINISTRATOR}) {
            var user = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String token = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            assertEquals(403, request("POST", "/api/v1/host/properties", body, token, key).statusCode());
            assertEquals(403, request("GET", "/api/v1/host/properties/1", null, token).statusCode());
        }
        var host = createUser("host@hosteo.test", RoleCode.HOST, true);
        String token = json(login(host.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        assertEquals(400, request("POST", "/api/v1/host/properties", body, token).statusCode());
        assertEquals(400, request("POST", "/api/v1/host/properties", body, token, "invalid").statusCode());
        assertEquals(400, request("POST", "/api/v1/host/properties", "{}", token, key).statusCode());
        for (var invalid : Map.<String, Object>of("title", " ", "description", "", "address", " ", "city", "", "district", "", "capacity", 0, "beds", 0, "bedrooms", -1, "bathrooms", -1).entrySet()) {
            var payload = propertyPayload(); payload.put(invalid.getKey(), invalid.getValue());
            assertEquals(400, request("POST", "/api/v1/host/properties", mapper.writeValueAsString(payload), token, key).statusCode(), invalid.getKey());
        }
        for (var invalid : Map.<String, Object>of("type", "PALACE", "currency", "EUR", "nightlyRate", new java.math.BigDecimal("0.001")).entrySet()) {
            var payload = propertyPayload(); payload.put(invalid.getKey(), invalid.getValue());
            assertEquals(400, request("POST", "/api/v1/host/properties", mapper.writeValueAsString(payload), token, key).statusCode(), invalid.getKey());
        }
        assertEquals(0, registeredProperties.count());
        host = users.findById(host.getId()).orElseThrow(); host.setActive(false); users.saveAndFlush(host);
        assertEquals(401, request("POST", "/api/v1/host/properties", body, token, key).statusCode());
    }

    @Test
    void retryKeyPreventsDuplicatePropertiesAndRejectsChangedData() throws Exception {
        var host = createUser("host@hosteo.test", RoleCode.HOST, true);
        String token = json(login(host.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String key = java.util.UUID.randomUUID().toString();
        String body = mapper.writeValueAsString(propertyPayload());
        var created = request("POST", "/api/v1/host/properties", body, token, key);
        var retried = request("POST", "/api/v1/host/properties", body, token, key);
        assertEquals(201, created.statusCode()); assertEquals(200, retried.statusCode());
        assertEquals(json(created).get("id").asLong(), json(retried).get("id").asLong());
        assertEquals(1, registeredProperties.count());
        var changed = propertyPayload(); changed.put("title", "Different property");
        assertEquals(409, request("POST", "/api/v1/host/properties", mapper.writeValueAsString(changed), token, key).statusCode());
        assertEquals(1, registeredProperties.count());
        var zeros = propertyPayload(); zeros.put("bedrooms", 0); zeros.put("bathrooms", 0); zeros.put("type", "ROOM"); zeros.put("currency", "USD");
        assertEquals(201, request("POST", "/api/v1/host/properties", mapper.writeValueAsString(zeros), token, java.util.UUID.randomUUID().toString()).statusCode());
    }

    @Test
    void hostListingIsOwnedPaginatedAndReturnsCurrentStates() throws Exception {
        var host = createUser("host@hosteo.test", RoleCode.HOST, true);
        var other = createUser("other@hosteo.test", RoleCode.HOST, true);
        String token = json(login(host.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String otherToken = json(login(other.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        assertEquals(0, json(request("GET", "/api/v1/host/properties", null, token)).get("total").asInt());
        for (int i = 0; i < 11; i++) {
            var payload = propertyPayload(); payload.put("title", "Property " + i);
            var response = request("POST", "/api/v1/host/properties", mapper.writeValueAsString(payload), token, java.util.UUID.randomUUID().toString());
            assertEquals(201, response.statusCode());
            var property = registeredProperties.findById(json(response).get("id").asLong()).orElseThrow();
            property.setStatus(com.edlabcode.hosteo.entity.PropertyStatus.values()[i % 4]);
            registeredProperties.saveAndFlush(property);
        }
        request("POST", "/api/v1/host/properties", mapper.writeValueAsString(propertyPayload()), otherToken, java.util.UUID.randomUUID().toString());
        var response = request("GET", "/api/v1/host/properties", null, token);
        assertEquals(200, response.statusCode());
        assertEquals("no-store", response.headers().firstValue("cache-control").orElseThrow());
        var first = json(response);
        assertEquals(11, first.get("total").asInt()); assertEquals(2, first.get("pages").asInt());
        assertEquals(10, first.get("items").size()); assertEquals("Property 10", first.get("items").get(0).get("title").asText());
        for (var property : first.get("items")) { assertEquals(host.getId().longValue(), property.get("hostId").asLong()); assertNotNull(property.get("status")); }
        var second = json(request("GET", "/api/v1/host/properties?page=1", null, token));
        assertEquals(1, second.get("items").size()); assertEquals("Property 0", second.get("items").get(0).get("title").asText());
        assertEquals(0, json(request("GET", "/api/v1/host/properties?page=2", null, token)).get("items").size());
        assertEquals(400, request("GET", "/api/v1/host/properties?page=-1", null, token).statusCode());
        assertEquals(400, request("GET", "/api/v1/host/properties?page=abc", null, token).statusCode());
        assertEquals(401, request("GET", "/api/v1/host/properties", null, null).statusCode());
        for (RoleCode role : new RoleCode[] { RoleCode.GUEST, RoleCode.SUPPORT, RoleCode.ADMINISTRATOR }) {
            var user = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String rejected = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            assertEquals(403, request("GET", "/api/v1/host/properties", null, rejected).statusCode());
        }
        host = users.findById(host.getId()).orElseThrow(); host.setActive(false); users.saveAndFlush(host);
        assertEquals(401, request("GET", "/api/v1/host/properties", null, token).statusCode());
    }

    @Test
    void editingPreservesOwnershipAndStateAndRejectsStaleVersions() throws Exception {
        var host = createUser("host@hosteo.test", RoleCode.HOST, true);
        var other = createUser("other@hosteo.test", RoleCode.HOST, true);
        String token = json(login(host.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        String otherToken = json(login(other.getEmail(), "ValidPassword123!")).get("accessToken").asText();
        var created = json(request("POST", "/api/v1/host/properties", mapper.writeValueAsString(propertyPayload()), token, java.util.UUID.randomUUID().toString()));
        String path = "/api/v1/host/properties/" + created.get("id").asLong();
        var payload = propertyPayload(); payload.put("version", created.get("version").asLong());
        assertEquals(200, request("PUT", path, mapper.writeValueAsString(payload), token).statusCode());
        assertEquals(created.get("version").asLong(), json(request("GET", path, null, token)).get("version").asLong());
        payload.put("title", "  Updated title  "); payload.put("district", "Barranco"); payload.put("capacity", 6);
        payload.put("nightlyRate", 250); payload.put("currency", "USD"); payload.put("hostId", other.getId()); payload.put("status", "PUBLISHED");
        assertEquals(404, request("PUT", path, mapper.writeValueAsString(payload), otherToken).statusCode());
        var savedResponse = request("PUT", path, mapper.writeValueAsString(payload), token);
        assertEquals(200, savedResponse.statusCode()); assertEquals("no-store", savedResponse.headers().firstValue("cache-control").orElseThrow());
        var saved = json(savedResponse); assertEquals("Updated title", saved.get("title").asText());
        assertEquals("DRAFT", saved.get("status").asText()); assertEquals(host.getId().longValue(), saved.get("hostId").asLong());
        assertEquals(6, saved.get("capacity").asInt()); assertEquals("USD", saved.get("currency").asText());
        assertEquals(created.get("createdAt").asText(), saved.get("createdAt").asText());
        assertTrue(saved.get("version").asLong() > created.get("version").asLong());
        assertEquals(409, request("PUT", path, mapper.writeValueAsString(payload), token).statusCode());
        assertEquals("Updated title", json(request("GET", path, null, token)).get("title").asText());
        payload.put("version", saved.get("version").asLong()); payload.put("capacity", 0);
        assertEquals(400, request("PUT", path, mapper.writeValueAsString(payload), token).statusCode());
        payload.put("capacity", 6); payload.remove("version");
        assertEquals(400, request("PUT", path, mapper.writeValueAsString(payload), token).statusCode());
        assertEquals(401, request("PUT", path, "{}", null).statusCode());
        for (RoleCode role : new RoleCode[] {RoleCode.GUEST, RoleCode.SUPPORT, RoleCode.ADMINISTRATOR}) {
            var user = createUser(role.name().toLowerCase() + "@hosteo.test", role, true);
            String rejected = json(login(user.getEmail(), "ValidPassword123!")).get("accessToken").asText();
            assertEquals(403, request("PUT", path, "{}", rejected).statusCode());
        }
        for (var status : com.edlabcode.hosteo.entity.PropertyStatus.values()) {
            var property = registeredProperties.findById(created.get("id").asLong()).orElseThrow(); property.setStatus(status); property = registeredProperties.saveAndFlush(property);
            payload.put("version", property.getVersion()); payload.put("title", "Title " + status.name());
            var updated = request("PUT", path, mapper.writeValueAsString(payload), token);
            assertEquals(200, updated.statusCode()); assertEquals(status.name(), json(updated).get("status").asText());
        }
        assertEquals(404, request("PUT", "/api/v1/host/properties/999999", mapper.writeValueAsString(payload), token).statusCode());
        host = users.findById(host.getId()).orElseThrow(); host.setActive(false); users.saveAndFlush(host);
        assertEquals(401, request("PUT", path, mapper.writeValueAsString(payload), token).statusCode());
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
        return request(method, path, body, token, null);
    }

    private HttpResponse<String> request(String method, String path, String body, String token, String registrationKey) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (registrationKey != null) builder.header("Idempotency-Key", registrationKey);
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

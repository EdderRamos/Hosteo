package com.edlabcode.hosteo.controller;

import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.service.HostPropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/host/properties")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class HostPropertyController {
    private final HostPropertyService properties;
    @PostMapping
    @Operation(summary = "Register a draft property owned by the authenticated host")
    public ResponseEntity<PropertyResponse> create(@AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody CreatePropertyRequest request) {
        var result = properties.create(jwt.getSubject(), jwt.<Number>getClaim("roleRevision").longValue(), key, request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .location(URI.create("/api/v1/host/properties/" + result.property().id()))
                .cacheControl(CacheControl.noStore()).body(result.property());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Read your registered property confirmation")
    public ResponseEntity<PropertyResponse> get(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(properties.get(jwt.getSubject(), id));
    }
}

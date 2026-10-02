package com.edlabcode.hosteo.controller;

import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.service.AuthService;
import com.edlabcode.hosteo.service.RegistrationService;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RegistrationService registrationService;

    @PostMapping("/register/guest")
    @Operation(summary = "Register a guest account")
    public ResponseEntity<UserResponse> registerGuest(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(registrationService.register(request, RoleCode.GUEST));
    }

    @PostMapping("/register/host")
    @Operation(summary = "Register a host account")
    public ResponseEntity<UserResponse> registerHost(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(registrationService.register(request, RoleCode.HOST));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in with email and password")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(authService.currentUser(jwt.getSubject()));
    }
}

package com.edlabcode.hosteo.controller;

import com.edlabcode.hosteo.dto.ProfileResponse;
import com.edlabcode.hosteo.dto.UpdateProfileRequest;
import com.edlabcode.hosteo.service.CustomerProfileService;
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
@RequestMapping("/api/v1/customer/profile")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class CustomerProfileController {
    private final CustomerProfileService profiles;

    @GetMapping
    @Operation(summary = "Get your customer profile")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(profiles.getProfile(jwt.getSubject()));
    }

    @PutMapping
    @Operation(summary = "Replace your customer profile")
    public ResponseEntity<ProfileResponse> updateProfile(@AuthenticationPrincipal Jwt jwt,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(profiles.updateProfile(jwt.getSubject(), request));
    }
}

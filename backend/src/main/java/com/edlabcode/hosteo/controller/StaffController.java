package com.edlabcode.hosteo.controller;
import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.service.StaffService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.*;
@RestController
@Validated
@RequestMapping("/api/v1/hosteo")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class StaffController {
    private final StaffService staff;
    private <T> ResponseEntity<T> response(T body) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body); }
    @GetMapping("/summary") public ResponseEntity<StaffService.Summary> summary() { return response(staff.summary()); }
    @GetMapping("/roles") public ResponseEntity<RoleCode[]> roles() { return response(RoleCode.values()); }
    @GetMapping("/users") public ResponseEntity<StaffService.UserPage> users(@RequestParam(defaultValue = "") @Size(max = 100) String query,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) { return response(staff.search(query, page)); }
    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<StaffUserResponse> assign(@PathVariable @Positive Long id, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AssignRoleRequest request) { return response(staff.assign(id, jwt.getSubject(), jwt.<Number>getClaim("roleRevision").longValue(), request)); }
    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    @io.swagger.v3.oas.annotations.Operation(summary = "Activate or deactivate another user account")
    public ResponseEntity<StaffUserResponse> updateStatus(@PathVariable @Positive Long id,
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateUserStatusRequest request) {
        return response(staff.updateStatus(id, jwt.getSubject(), jwt.<Number>getClaim("roleRevision").longValue(), request));
    }
}

package com.edlabcode.hosteo.controller;

import com.edlabcode.hosteo.dto.HostPropertyListResponse;
import com.edlabcode.hosteo.dto.PropertyResponse;
import com.edlabcode.hosteo.dto.StaffUserResponse;
import com.edlabcode.hosteo.service.StaffService;
import com.edlabcode.hosteo.service.SupportLookupService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPPORT')")
@RequestMapping("/api/v1/support/users")
@SecurityRequirement(name = "bearerAuth")
public class SupportLookupController {
    private final SupportLookupService support;

    private <T> ResponseEntity<T> reply(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }

    @GetMapping
    public ResponseEntity<StaffService.UserPage> search(@RequestParam(defaultValue = "") @Size(max = 100) String query, @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return reply(support.search(query, page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffUserResponse> user(@PathVariable @Positive Long id) {
        return reply(support.user(id));
    }

    @GetMapping("/{id}/properties")
    public ResponseEntity<HostPropertyListResponse> properties(@PathVariable @Positive Long id, @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return reply(support.properties(id, page));
    }

    @GetMapping("/{id}/properties/{propertyId}")
    public ResponseEntity<PropertyResponse> property(@PathVariable @Positive Long id, @PathVariable @Positive Long propertyId) {
        return reply(support.property(id, propertyId));
    }
}

package com.edlabcode.hosteo.controller;

import com.edlabcode.hosteo.dto.PendingPropertyResponse;
import com.edlabcode.hosteo.service.PropertyReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/v1/hosteo/properties/pending")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class PropertyReviewController {
    private final PropertyReviewService reviews;
    @GetMapping
    @Operation(summary = "List properties awaiting administrative review, oldest submission first")
    public ResponseEntity<PropertyReviewService.PendingPage> list(@RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(reviews.list(page));
    }
    @GetMapping("/{id}")
    @Operation(summary = "Read the principal information and host of a pending property")
    public ResponseEntity<PendingPropertyResponse> get(@PathVariable @Positive Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(reviews.get(id));
    }
}

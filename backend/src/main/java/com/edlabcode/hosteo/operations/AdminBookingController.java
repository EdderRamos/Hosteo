package com.edlabcode.hosteo.operations;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.edlabcode.hosteo.operations.OperationsContracts.*;

@RestController
@Validated
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/admin")
public class AdminBookingController {
    private final OperationsService operations;

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<BookingView> status(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id, @Valid @RequestBody StatusRequest input) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.status(jwt, id, input));
    }

    @GetMapping("/bookings/{id}/history")
    public ResponseEntity<List<StatusHistoryView>> history(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.statusHistory(jwt, id));
    }

    @GetMapping("/payments")
    public ResponseEntity<PageResult<PaymentRecord>> payments(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.paymentList(jwt, page));
    }
}

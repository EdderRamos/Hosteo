package com.edlabcode.hosteo.operations;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

import static com.edlabcode.hosteo.operations.OperationsContracts.*;

@RestController
@Validated
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/guest")
public class GuestBookingController {
    private final OperationsService operations;

    @GetMapping("/properties/{id}/availability")
    public ResponseEntity<Availability> availability(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id, @RequestParam LocalDate checkIn, @RequestParam LocalDate checkOut, @RequestParam @Min(1) int guestCount) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.availability(jwt, id, checkIn, checkOut, guestCount));
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingView> book(@AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody BookingRequest input) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.book(jwt, key, input));
    }

    @PostMapping("/bookings/{id}/payment")
    public ResponseEntity<PaymentView> pay(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id, @Valid @RequestBody VersionRequest input) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.pay(jwt, id, input));
    }

    @GetMapping("/bookings/{id}/payment")
    public ResponseEntity<PaymentView> payment(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.payment(jwt, id));
    }
}

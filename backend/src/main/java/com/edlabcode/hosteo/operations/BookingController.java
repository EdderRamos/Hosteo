package com.edlabcode.hosteo.operations;
import static com.edlabcode.hosteo.operations.OperationsContracts.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
@RestController @Validated @RequiredArgsConstructor @SecurityRequirement(name="bearerAuth")
@RequestMapping({"/api/v1/guest/bookings","/api/v1/host/bookings","/api/v1/admin/bookings"})
public class BookingController {
 private final OperationsService operations;
 @GetMapping public ResponseEntity<PageResult<BookingView>> list(@AuthenticationPrincipal Jwt jwt,@RequestParam(defaultValue="0") @Min(0) @Max(100000) int page){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.bookingList(jwt,page));}
 @GetMapping("/{id}") public ResponseEntity<BookingView> get(@AuthenticationPrincipal Jwt jwt,@PathVariable @Positive Long id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.booking(jwt,id));}
}

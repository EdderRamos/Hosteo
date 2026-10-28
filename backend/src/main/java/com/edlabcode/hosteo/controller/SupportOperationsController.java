package com.edlabcode.hosteo.controller;
import com.edlabcode.hosteo.service.SupportOperationsService;
import static com.edlabcode.hosteo.operations.OperationsContracts.*;
import jakarta.validation.constraints.*;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
@RestController @Validated @RequiredArgsConstructor @PreAuthorize("hasRole('SUPPORT')")
@RequestMapping("/api/v1/support") @SecurityRequirement(name="bearerAuth")
public class SupportOperationsController {
 private final SupportOperationsService support;
 public record PaymentResult(PaymentView payment) {}
 private <T> ResponseEntity<T> reply(T body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
 @GetMapping("/bookings") public ResponseEntity<PageResult<BookingView>> search(@RequestParam(required=false) @Positive Long id,@RequestParam(required=false) UUID confirmationCode,@RequestParam(defaultValue="") @Size(max=100) String email,@RequestParam(defaultValue="0") @Min(0) @Max(100000) int page){return reply(support.search(id,confirmationCode,email,page));}
 @GetMapping("/bookings/{id}") public ResponseEntity<BookingView> booking(@PathVariable @Positive Long id){return reply(support.booking(id));}
 @GetMapping("/bookings/{id}/payment") public ResponseEntity<PaymentResult> payment(@PathVariable @Positive Long id){return reply(new PaymentResult(support.payment(id)));}
 @GetMapping("/operations/summary") public ResponseEntity<SupportOperationsService.OperationalInfo> summary(){return reply(support.summary());}
}

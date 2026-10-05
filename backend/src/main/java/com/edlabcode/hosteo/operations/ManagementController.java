package com.edlabcode.hosteo.operations;
import static com.edlabcode.hosteo.operations.OperationsContracts.*;
import com.edlabcode.hosteo.dto.PropertyResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
@RestController @Validated @RequiredArgsConstructor @SecurityRequirement(name="bearerAuth") @RequestMapping({"/api/v1/host","/api/v1/admin"})
public class ManagementController {
 private final OperationsService operations;
 private <T> ResponseEntity<T> reply(T body){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);}
 @GetMapping("/managed-properties") public ResponseEntity<PageResult<PropertyResponse>> properties(@AuthenticationPrincipal Jwt jwt,@RequestParam(defaultValue="0") @Min(0) @Max(100000) int page){return reply(operations.managedProperties(jwt,page));}
 @GetMapping("/properties/{id}/calendar") public ResponseEntity<CalendarView> calendar(@AuthenticationPrincipal Jwt jwt,@PathVariable @Positive Long id,@RequestParam LocalDate startDate,@RequestParam LocalDate endDate){return reply(operations.calendar(jwt,id,startDate,endDate));}
 @PostMapping("/properties/{id}/blocks") public ResponseEntity<BlockView> block(@AuthenticationPrincipal Jwt jwt,@PathVariable @Positive Long id,@Valid @RequestBody BlockRequest input){return reply(operations.block(jwt,id,input));}
 @PatchMapping("/properties/{propertyId}/blocks/{id}/deactivate") public ResponseEntity<BlockView> deactivate(@AuthenticationPrincipal Jwt jwt,@PathVariable @Positive Long propertyId,@PathVariable @Positive Long id,@Valid @RequestBody VersionRequest input){return reply(operations.deactivate(jwt,propertyId,id,input));}
 @GetMapping("/operations/summary") public ResponseEntity<Summary> summary(@AuthenticationPrincipal Jwt jwt){return reply(operations.summary(jwt));}
}

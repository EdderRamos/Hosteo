package com.edlabcode.hosteo.operations;
import com.edlabcode.hosteo.dto.PropertyResponse;
import static com.edlabcode.hosteo.operations.OperationsContracts.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController @Validated @RequiredArgsConstructor @RequestMapping("/api/v1/catalog/properties")
public class CatalogController {
 private final OperationsService operations;
 @GetMapping public ResponseEntity<PageResult<PublicProperty>> list(@RequestParam(defaultValue="0") @Min(0) @Max(100000) int page){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.catalog(page));}
 @GetMapping("/{id}") public ResponseEntity<PublicProperty> get(@PathVariable @Positive Long id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.catalogProperty(id));}
}

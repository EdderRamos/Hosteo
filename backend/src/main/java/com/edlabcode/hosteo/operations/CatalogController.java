package com.edlabcode.hosteo.operations;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import static com.edlabcode.hosteo.operations.OperationsContracts.PageResult;
import static com.edlabcode.hosteo.operations.OperationsContracts.PublicProperty;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/api/v1/catalog/properties")
public class CatalogController {
    private final OperationsService operations;

    @GetMapping
    public ResponseEntity<PageResult<PublicProperty>> list(@RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.catalog(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicProperty> get(@PathVariable @Positive Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(operations.catalogProperty(id));
    }
}

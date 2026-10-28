package com.edlabcode.hosteo.operations;

import com.edlabcode.hosteo.entity.PropertyType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CatalogFilters(
        @Size(max = 100) String district,
        @Size(max = 100) String query,
        PropertyType type,
        @Min(1) @Max(2147483647) Integer guests,
        @DecimalMin("0") @DecimalMax("9999999999.99") @Digits(integer = 10, fraction = 2) BigDecimal minPrice,
        @DecimalMin("0") @DecimalMax("9999999999.99") @Digits(integer = 10, fraction = 2) BigDecimal maxPrice,
        @Pattern(regexp = "PEN|USD") String currency) {}

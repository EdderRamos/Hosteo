package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.PropertyType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdatePropertyRequest(
        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 5000) String description,
        @NotNull PropertyType type,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String district,
        @NotNull @Min(1) Integer capacity,
        @NotNull @Min(0) Integer bedrooms,
        @NotNull @Min(1) Integer beds,
        @NotNull @Min(0) Integer bathrooms,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal nightlyRate,
        @NotNull @Pattern(regexp = "PEN|USD") String currency,
        @NotNull @Min(0) Long version) {
    public CreatePropertyRequest information() {
        return new CreatePropertyRequest(title, description, type, address, city, district, capacity, bedrooms,
                beds, bathrooms, nightlyRate, currency).normalized();
    }
}

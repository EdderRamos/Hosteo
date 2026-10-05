package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.*;
import java.math.BigDecimal;
import java.time.Instant;

public record PropertyResponse(Long id, Long hostId, String title, String description, PropertyType type,
        String address, String city, String district, int capacity, int bedrooms, int beds, int bathrooms,
        BigDecimal nightlyRate, String currency, PropertyStatus status, Instant createdAt, Instant updatedAt, long version, Instant submittedAt) {
    public static PropertyResponse from(Property p) {
        return new PropertyResponse(p.getId(), p.getHost().getId(), p.getTitle(), p.getDescription(), p.getType(),
                p.getAddress(), p.getCity(), p.getDistrict(), p.getCapacity(), p.getBedrooms(), p.getBeds(), p.getBathrooms(),
                p.getNightlyRate(), p.getCurrency(), p.getStatus(), p.getCreatedAt(), p.getUpdatedAt(), p.getVersion(), p.getSubmittedAt());
    }
    public CreatePropertyRequest registration() {
        return new CreatePropertyRequest(title, description, type, address, city, district, capacity, bedrooms, beds,
                bathrooms, nightlyRate, currency).normalized();
    }
}

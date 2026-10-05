package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.*;
import com.edlabcode.hosteo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('HOST')")
public class HostPropertyService {
    private final UserRepository users;
    private final PropertyRepository properties;
    public record Registration(PropertyResponse property, boolean created) {}

    @Transactional
    public Registration create(String subject, long revision, UUID key, CreatePropertyRequest input) {
        // Serialize creation/retries with access changes on the same host account.
        var host = users.findLockedById(Long.valueOf(subject))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication"));
        if (!host.isActive() || host.getRoleRevision() != revision)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication");
        if (host.getRole().getCode() != RoleCode.HOST)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host access required");
        var request = input.normalized();
        var existing = properties.findByHostIdAndRegistrationKey(host.getId(), key);
        if (existing.isPresent()) {
            var response = PropertyResponse.from(existing.get());
            if (!response.registration().equals(request))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration key has different property data");
            return new Registration(response, false);
        }
        var property = new Property();
        property.setHost(host);
        property.setTitle(request.title()); property.setDescription(request.description()); property.setType(request.type());
        property.setAddress(request.address()); property.setCity(request.city()); property.setDistrict(request.district());
        property.setCapacity(request.capacity()); property.setBedrooms(request.bedrooms());
        property.setBeds(request.beds()); property.setBathrooms(request.bathrooms());
        property.setNightlyRate(request.nightlyRate()); property.setCurrency(request.currency());
        property.setStatus(PropertyStatus.DRAFT); property.setRegistrationKey(key);
        return new Registration(PropertyResponse.from(properties.saveAndFlush(property)), true);
    }

    @Transactional
    public PropertyResponse update(String subject, long revision, Long id, UpdatePropertyRequest input) {
        var host = users.findLockedById(Long.valueOf(subject))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication"));
        if (!host.isActive() || host.getRoleRevision() != revision)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication");
        if (host.getRole().getCode() != RoleCode.HOST)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host access required");
        var property = properties.findLockedOwned(id, host.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
        if (property.getVersion() != input.version())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Property changed. Reload before saving again");
        var request = input.information();
        if (PropertyResponse.from(property).registration().equals(request)) return PropertyResponse.from(property);
        property.setTitle(request.title()); property.setDescription(request.description()); property.setType(request.type());
        property.setAddress(request.address()); property.setCity(request.city()); property.setDistrict(request.district());
        property.setCapacity(request.capacity()); property.setBedrooms(request.bedrooms()); property.setBeds(request.beds());
        property.setBathrooms(request.bathrooms()); property.setNightlyRate(request.nightlyRate()); property.setCurrency(request.currency());
        return PropertyResponse.from(properties.saveAndFlush(property));
    }

    @Transactional(readOnly = true)
    public HostPropertyListResponse list(String subject, int page) {
        var result = properties.findAllByHostId(Long.valueOf(subject),
                PageRequest.of(page, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        return new HostPropertyListResponse(result.map(PropertyResponse::from).getContent(),
                result.getTotalElements(), result.getNumber(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public PropertyResponse get(String subject, Long id) {
        return properties.findByIdAndHostId(id, Long.valueOf(subject)).map(PropertyResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
    }
}

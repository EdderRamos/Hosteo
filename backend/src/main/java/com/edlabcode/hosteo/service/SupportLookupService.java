package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.HostPropertyListResponse;
import com.edlabcode.hosteo.dto.PropertyResponse;
import com.edlabcode.hosteo.dto.StaffUserResponse;
import com.edlabcode.hosteo.repository.PropertyRepository;
import com.edlabcode.hosteo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasRole('SUPPORT')")
public class SupportLookupService {
    private final StaffService staff;
    private final UserRepository users;
    private final PropertyRepository properties;

    public StaffService.UserPage search(String query, int page) {
        return staff.search(query, page);
    }

    public StaffUserResponse user(Long id) {
        return users.findById(id).map(StaffUserResponse::from).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public HostPropertyListResponse properties(Long id, int page) {
        user(id);
        var result = properties.findAllByHostId(id, PageRequest.of(page, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        return new HostPropertyListResponse(result.map(PropertyResponse::from).getContent(), result.getTotalElements(), page, result.getTotalPages());
    }

    public PropertyResponse property(Long userId, Long propertyId) {
        user(userId);
        return properties.findByIdAndHostId(propertyId, userId).map(PropertyResponse::from).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not associated with this user"));
    }
}

package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.PendingPropertyResponse;
import com.edlabcode.hosteo.entity.PropertyStatus;
import com.edlabcode.hosteo.repository.PropertyRepository;
import java.util.List;
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
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Transactional(readOnly = true)
public class PropertyReviewService {
    private final PropertyRepository properties;
    public record PendingPage(List<PendingPropertyResponse> items, long total, int page, int pages) {}
    public PendingPage list(int page) {
        var result = properties.findAllByStatus(PropertyStatus.PENDING_REVIEW,
                PageRequest.of(page, 10, Sort.by(Sort.Order.asc("submittedAt"), Sort.Order.asc("id"))));
        return new PendingPage(result.map(PendingPropertyResponse::from).getContent(),
                result.getTotalElements(), result.getNumber(), result.getTotalPages());
    }
    public PendingPropertyResponse get(Long id) {
        return properties.findByIdAndStatus(id, PropertyStatus.PENDING_REVIEW).map(PendingPropertyResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pending property not found"));
    }
}

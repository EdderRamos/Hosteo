package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.*;
import com.edlabcode.hosteo.repository.*;
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
    private final UserRepository users;
    private final PropertyReviewRepository reviews;
    private final jakarta.validation.Validator validator;
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
    @Transactional
    public PropertyResponse decide(String subject, long revision, Long id, ReviewPropertyRequest input) {
        var administrator = users.findLockedById(Long.valueOf(subject))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication"));
        if (!administrator.isActive() || administrator.getRoleRevision() != revision)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication");
        if (administrator.getRole().getCode() != RoleCode.ADMINISTRATOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required");
        var property = properties.findLockedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
        var decisionStatus = input.decision() == ReviewDecision.APPROVED ? PropertyStatus.PUBLISHED : PropertyStatus.REJECTED;
        var comment = input.normalizedComment();
        var existing = reviews.findByPropertyIdAndPropertyVersion(id, input.version());
        if (existing.isPresent() && property.getVersion() - 1 == input.version() && property.getStatus() == decisionStatus) {
            var previous = existing.get();
            if (previous.getAdministrator().getId().equals(administrator.getId()) && previous.getDecision() == input.decision()
                    && java.util.Objects.equals(previous.getComment(), comment)) return PropertyResponse.from(property);
        }
        if (property.getVersion() != input.version() || property.getStatus() != PropertyStatus.PENDING_REVIEW)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Property changed or is no longer pending review");
        var response = PropertyResponse.from(property);
        if (input.decision() == ReviewDecision.APPROVED && !validator.validate(new CreatePropertyRequest(
                response.title(), response.description(), response.type(), response.address(), response.city(), response.district(),
                response.capacity(), response.bedrooms(), response.beds(), response.bathrooms(), response.nightlyRate(), response.currency())).isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Property information is incomplete");
        var now = java.time.Instant.now();
        var review = new PropertyReview(); review.setProperty(property); review.setAdministrator(administrator);
        review.setDecision(input.decision()); review.setComment(comment); review.setPropertyVersion(input.version()); review.setReviewedAt(now);
        reviews.save(review);
        property.setStatus(decisionStatus); property.setReviewedAt(now); property.setReviewComment(comment);
        property.setPublishedAt(input.decision() == ReviewDecision.APPROVED ? now : null);
        return PropertyResponse.from(properties.saveAndFlush(property));
    }

}

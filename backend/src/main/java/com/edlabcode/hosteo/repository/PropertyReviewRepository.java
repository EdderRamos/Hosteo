package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.PropertyReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PropertyReviewRepository extends JpaRepository<PropertyReview, Long> {
    Optional<PropertyReview> findByPropertyIdAndPropertyVersion(Long propertyId, long propertyVersion);
}

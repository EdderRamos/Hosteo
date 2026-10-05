package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Page<Property> findAllByHostId(Long hostId, Pageable pageable);
    Optional<Property> findByIdAndHostId(Long id, Long hostId);
    Optional<Property> findByHostIdAndRegistrationKey(Long hostId, UUID registrationKey);
}

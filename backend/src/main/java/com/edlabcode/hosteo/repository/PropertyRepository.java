package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findByIdAndHostId(Long id, Long hostId);
    Optional<Property> findByHostIdAndRegistrationKey(Long hostId, UUID registrationKey);
}

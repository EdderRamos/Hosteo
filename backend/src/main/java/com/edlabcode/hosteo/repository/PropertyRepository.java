package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.EntityGraph;
import com.edlabcode.hosteo.entity.PropertyStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Property p where p.id = :id and p.host.id = :hostId")
    Optional<Property> findLockedOwned(@Param("id") Long id, @Param("hostId") Long hostId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Property p where p.id = :id")
    Optional<Property> findLockedById(@Param("id") Long id);
    @EntityGraph(attributePaths = "host")
    Page<Property> findAllByStatus(PropertyStatus status, Pageable pageable);
    @EntityGraph(attributePaths = "host")
    Optional<Property> findByIdAndStatus(Long id, PropertyStatus status);
    Page<Property> findAllByHostId(Long hostId, Pageable pageable);
    Optional<Property> findByIdAndHostId(Long id, Long hostId);
    Optional<Property> findByHostIdAndRegistrationKey(Long hostId, UUID registrationKey);
}

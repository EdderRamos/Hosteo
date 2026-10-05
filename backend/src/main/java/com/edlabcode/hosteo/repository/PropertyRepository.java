package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Property;
import com.edlabcode.hosteo.entity.PropertyStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("select p.status,count(p) from Property p where (:host is null or p.host.id=:host) group by p.status")
    java.util.List<Object[]> statusTotals(@Param("host") Long host);

    Page<Property> findAllByHostId(Long hostId, Pageable pageable);

    Optional<Property> findByIdAndHostId(Long id, Long hostId);

    Optional<Property> findByHostIdAndRegistrationKey(Long hostId, UUID registrationKey);
}

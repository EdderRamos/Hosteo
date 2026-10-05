package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.AvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AvailabilityBlockRepository extends JpaRepository<AvailabilityBlock, Long> {
    @Query("select count(b) from AvailabilityBlock b where b.property.id=:property and b.active=true and b.startDate<:end and b.endDate>:start")
    long conflicts(@Param("property") Long property, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select b from AvailabilityBlock b where b.property.id=:property and b.startDate<:end and b.endDate>:start order by b.startDate,b.id")
    List<AvailabilityBlock> calendar(@Param("property") Long property, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select count(b) from AvailabilityBlock b where b.active=true and (:host is null or b.property.host.id=:host)")
    long activeCount(@Param("host") Long host);
}

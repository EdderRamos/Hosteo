package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.SimulatedPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SimulatedPaymentRepository extends JpaRepository<SimulatedPayment, Long> {
    Optional<SimulatedPayment> findByBookingId(Long bookingId);

    List<SimulatedPayment> findByBookingIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = {"booking", "booking.property", "booking.guest"})
    Page<SimulatedPayment> findAll(Pageable page);

    @Query("select p.booking.currency,sum(p.booking.totalAmount) from SimulatedPayment p where p.status=com.edlabcode.hosteo.entity.PaymentStatus.APPROVED and (:host is null or p.booking.property.host.id=:host) group by p.booking.currency")
    List<Object[]> amountTotals(@Param("host") Long host);

    @Query("select count(p) from SimulatedPayment p where (:host is null or p.booking.property.host.id=:host)")
    long scopedCount(@Param("host") Long host);
}

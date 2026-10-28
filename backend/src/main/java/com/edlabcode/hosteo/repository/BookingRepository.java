package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Booking;
import com.edlabcode.hosteo.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByGuestIdAndRegistrationKey(Long guestId, UUID registrationKey);

    @Query("select count(b) from Booking b where b.property.id=:property and b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and b.checkIn<:end and b.checkOut>:start")
    long conflicts(@Param("property") Long property, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select b from Booking b where b.property.id=:property and b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and b.checkIn<:end and b.checkOut>:start order by b.checkIn,b.id")
    List<Booking> occupied(@Param("property") Long property, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @EntityGraph(attributePaths = {"property", "property.host", "guest"})
    @Query("select b from Booking b where (:guest is null or b.guest.id=:guest) and (:host is null or b.property.host.id=:host)")
    Page<Booking> scoped(@Param("guest") Long guest, @Param("host") Long host, Pageable page);

    @Query("select b.status,count(b) from Booking b where (:host is null or b.property.host.id=:host) group by b.status")
    List<Object[]> statusTotals(@Param("host") Long host);

    @Query("select b.currency,sum(b.totalAmount) from Booking b where b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and (:host is null or b.property.host.id=:host) group by b.currency")
    List<Object[]> amountTotals(@Param("host") Long host);

    @Query("select count(b) from Booking b where b.status=com.edlabcode.hosteo.entity.BookingStatus.CONFIRMED and b.checkIn>=:today and (:host is null or b.property.host.id=:host)")
    long upcoming(@Param("host") Long host, @Param("today") LocalDate today);

    @EntityGraph(attributePaths = {"property", "property.host", "guest"})
    @Query("select b from Booking b where b.checkIn>=:start and b.checkIn<=:end and (:status is null or b.status=:status)")
    Page<Booking> report(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("status") BookingStatus status, Pageable page);

    @Query("select b.status,count(b) from Booking b where b.checkIn>=:start and b.checkIn<=:end and (:status is null or b.status=:status) group by b.status")
    List<Object[]> reportStatuses(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("status") BookingStatus status);

    @Query("select b.currency,sum(b.totalAmount) from Booking b where b.checkIn>=:start and b.checkIn<=:end and (:status is null or b.status=:status) and b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED group by b.currency")
    List<Object[]> reportAmounts(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("status") BookingStatus status);

    @EntityGraph(attributePaths={"property","property.host","guest"})
    @Query("select b from Booking b where (:id is null or b.id=:id) and (:code is null or b.confirmationCode=:code) and (:email='' or lower(b.guest.email) like lower(concat('%',:email,'%')))")
    Page<Booking> supportSearch(@Param("id") Long id,@Param("code") UUID code,@Param("email") String email,Pageable page);
}

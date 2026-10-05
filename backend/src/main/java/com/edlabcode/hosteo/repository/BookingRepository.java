package com.edlabcode.hosteo.repository;
import com.edlabcode.hosteo.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import java.time.LocalDate;
import java.util.*;
public interface BookingRepository extends JpaRepository<Booking,Long> {
    Optional<Booking> findByGuestIdAndRegistrationKey(Long guestId, UUID registrationKey);
    @Query("select count(b) from Booking b where b.property.id=:property and b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and b.checkIn<:end and b.checkOut>:start")
    long conflicts(@Param("property") Long property, @Param("start") LocalDate start, @Param("end") LocalDate end);
    @Query("select b from Booking b where b.property.id=:property and b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and b.checkIn<:end and b.checkOut>:start order by b.checkIn,b.id")
    List<Booking> occupied(@Param("property") Long property,@Param("start") LocalDate start,@Param("end") LocalDate end);
    @EntityGraph(attributePaths={"property","property.host","guest"})
    @Query("select b from Booking b where (:guest is null or b.guest.id=:guest) and (:host is null or b.property.host.id=:host)")
    Page<Booking> scoped(@Param("guest") Long guest,@Param("host") Long host,Pageable page);
    @Query("select b.status,count(b) from Booking b where (:host is null or b.property.host.id=:host) group by b.status")
    List<Object[]> statusTotals(@Param("host") Long host);
    @Query("select b.currency,sum(b.totalAmount) from Booking b where b.status<>com.edlabcode.hosteo.entity.BookingStatus.CANCELLED and (:host is null or b.property.host.id=:host) group by b.currency")
    List<Object[]> amountTotals(@Param("host") Long host);
    @Query("select count(b) from Booking b where b.status=com.edlabcode.hosteo.entity.BookingStatus.CONFIRMED and b.checkIn>=:today and (:host is null or b.property.host.id=:host)")
    long upcoming(@Param("host") Long host,@Param("today") LocalDate today);
}

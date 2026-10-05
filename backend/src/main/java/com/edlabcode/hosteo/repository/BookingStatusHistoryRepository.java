package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.BookingStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingStatusHistoryRepository extends JpaRepository<BookingStatusHistory, Long> {
    List<BookingStatusHistory> findByBookingIdOrderByChangedAtAscIdAsc(Long bookingId);
}

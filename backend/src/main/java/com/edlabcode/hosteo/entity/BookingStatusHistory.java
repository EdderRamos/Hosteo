package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "booking_status_history")
@Getter
@Setter
@NoArgsConstructor
public class BookingStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, updatable = false)
    private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_id", nullable = false, updatable = false)
    private User changedBy;
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 20, updatable = false)
    private BookingStatus previousStatus;
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20, updatable = false)
    private BookingStatus newStatus;
    @Column(length = 1000, updatable = false)
    private String comment;
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;
}

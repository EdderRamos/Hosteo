package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(name = "bookings_guest_registration_key", columnNames = {"guest_id", "registration_key"}))
@Getter
@Setter
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "confirmation_code", nullable = false, unique = true, updatable = false)
    private UUID confirmationCode;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false, updatable = false)
    private Property property;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false, updatable = false)
    private User guest;
    @Column(name = "check_in", nullable = false, updatable = false)
    private LocalDate checkIn;
    @Column(name = "check_out", nullable = false, updatable = false)
    private LocalDate checkOut;
    @Column(name = "guest_count", nullable = false, updatable = false)
    private int guestCount;
    @Column(name = "applied_nightly_rate", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal appliedNightlyRate;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal totalAmount;
    @Column(nullable = false, length = 3, updatable = false)
    private String currency;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;
    @Column(name = "registration_key", nullable = false, updatable = false)
    private UUID registrationKey;
    @Column(name = "quoted_property_version", nullable = false, updatable = false)
    private long quotedPropertyVersion;
    @Column(name = "confirmed_at", nullable = false, updatable = false)
    private Instant confirmedAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version
    private long version;

    @PrePersist
    void create() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void update() {
        updatedAt = Instant.now();
    }
}

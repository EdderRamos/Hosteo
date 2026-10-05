package com.edlabcode.hosteo.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="simulated_payments") @Getter @Setter @NoArgsConstructor
public class SimulatedPayment {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
@OneToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="booking_id", nullable=false, unique=true, updatable=false) private Booking booking;
@Column(nullable=false, unique=true, updatable=false) private UUID reference;
@Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private PaymentStatus status;
@Column(name="processed_at", nullable=false, updatable=false) private Instant processedAt;
@Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
@Column(name="updated_at",nullable=false) private Instant updatedAt;
@Version private long version;
@PrePersist void create() {createdAt=Instant.now();updatedAt=createdAt;}
@PreUpdate void update() {updatedAt=Instant.now();}
}

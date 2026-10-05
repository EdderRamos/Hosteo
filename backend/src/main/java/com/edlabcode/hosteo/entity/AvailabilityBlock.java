package com.edlabcode.hosteo.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Table(name="availability_blocks") @Getter @Setter @NoArgsConstructor
public class AvailabilityBlock {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
@ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="property_id", nullable=false) private Property property;
@ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="created_by_id", nullable=false) private User createdBy;
@Column(name="start_date", nullable=false) private LocalDate startDate;
@Column(name="end_date", nullable=false) private LocalDate endDate;
@Column(nullable=false, length=255) private String reason;
@Column(nullable=false) private boolean active = true;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="deactivated_by_id") private User deactivatedBy;
@Column(name="deactivated_at") private Instant deactivatedAt;
@Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
@Column(name="updated_at",nullable=false) private Instant updatedAt;
@Version private long version;
@PrePersist void create() {createdAt=Instant.now();updatedAt=createdAt;}
@PreUpdate void update() {updatedAt=Instant.now();}
}

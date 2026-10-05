package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "properties", uniqueConstraints = @UniqueConstraint(name = "properties_host_registration_key", columnNames = {"host_id", "registration_key"}))
@Getter
@Setter
@NoArgsConstructor
public class Property {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;
    @Column(nullable = false, length = 150) private String title;
    @Column(nullable = false, columnDefinition = "text") private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 50) private PropertyType type;
    @Column(nullable = false, length = 255) private String address;
    @Column(nullable = false, length = 100) private String city;
    @Column(nullable = false, length = 100) private String district;
    @Column(nullable = false) private int capacity;
    @Column(nullable = false) private int bedrooms;
    @Column(nullable = false) private int beds;
    @Column(nullable = false) private int bathrooms;
    @Column(name = "nightly_rate", nullable = false, precision = 12, scale = 2) private BigDecimal nightlyRate;
    @Column(nullable = false, length = 3) private String currency;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private PropertyStatus status;
    @Column(name = "registration_key", nullable = false, updatable = false) private UUID registrationKey;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "submitted_at") private Instant submittedAt;
    @Version private long version;
    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}

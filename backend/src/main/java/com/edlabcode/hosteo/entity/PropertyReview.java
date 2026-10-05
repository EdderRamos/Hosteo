package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "property_reviews", uniqueConstraints = @UniqueConstraint(name = "property_reviews_property_version", columnNames = {"property_id", "property_version"}))
@Getter @Setter @NoArgsConstructor
public class PropertyReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "property_id", nullable = false, updatable = false) private Property property;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "administrator_id", nullable = false, updatable = false) private User administrator;
    @Enumerated(EnumType.STRING) @Column(nullable = false, updatable = false, length = 20) private ReviewDecision decision;
    @Column(length = 1000, updatable = false) private String comment;
    @Column(name = "property_version", nullable = false, updatable = false) private long propertyVersion;
    @Column(name = "reviewed_at", nullable = false, updatable = false) private Instant reviewedAt;
}

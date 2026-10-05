package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    @Column(nullable = false, unique = true, length = 254)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;
    @Column(name = "phone", length = 30)
    private String phone;
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Gender gender;
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    @Column(length = 500)
    private String biography;
    @Column(length = 150)
    private String occupation;
    @Column(length = 150)
    private String location;
    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;
    @ElementCollection
    @CollectionTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"))
    @OrderColumn(name = "sort_order")
    private List<ProfileLanguage> languages = new ArrayList<>();
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest", nullable = false, length = 100)
    @OrderColumn(name = "sort_order")
    private List<String> interests = new ArrayList<>();
    @Column(name = "active", nullable = false)
    private boolean active = true;
    @Column(name = "last_login_at")
    private Instant lastLoginAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Column(name = "role_revision", nullable = false)
    private long roleRevision;
    @Version
    private long version;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

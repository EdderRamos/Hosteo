package com.edlabcode.hosteo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class ProfileLanguage {
    @Column(name = "language_code", nullable = false, length = 10)
    private String code;
    @Enumerated(EnumType.STRING)
    @Column(name = "proficiency", nullable = false, length = 20)
    private LanguageLevel proficiency;
}

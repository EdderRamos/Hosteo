package com.edlabcode.hosteo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

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

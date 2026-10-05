package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.LanguageLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record LanguageRequest(
        @NotBlank @Pattern(regexp = "[a-z]{2,3}(-[A-Z]{2})?") String code,
        @NotNull LanguageLevel proficiency) {
}

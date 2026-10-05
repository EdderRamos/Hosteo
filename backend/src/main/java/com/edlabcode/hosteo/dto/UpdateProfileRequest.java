package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.Gender;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phone,
        Gender gender,
        @Past LocalDate dateOfBirth,
        @Size(max = 500) String biography,
        @Size(max = 150) String occupation,
        @Size(max = 150) String location,
        @NotNull @Size(max = 20) List<@NotNull @Valid LanguageRequest> languages,
        @NotNull @Size(max = 30) List<@NotBlank @Size(max = 100) String> interests,
        @NotNull @PositiveOrZero Long version) {
}

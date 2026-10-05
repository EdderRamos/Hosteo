package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.Gender;
import com.edlabcode.hosteo.entity.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ProfileResponse(Long id, String firstName, String lastName, String email,
                              String phone, Long roleId, com.edlabcode.hosteo.entity.RoleCode roleCode, Gender gender, LocalDate dateOfBirth,
                              String biography, String occupation, String location, String avatarUrl,
                              List<LanguageRequest> languages, List<String> interests,
                              Instant memberSince, long version) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhone(), user.getRole().getId(), user.getRole().getCode(), user.getGender(),
                user.getDateOfBirth(), user.getBiography(), user.getOccupation(), user.getLocation(),
                user.getAvatarUrl(), user.getLanguages().stream()
                        .map(language -> new LanguageRequest(language.getCode(), language.getProficiency())).toList(),
                List.copyOf(user.getInterests()), user.getCreatedAt(), user.getVersion());
    }
}

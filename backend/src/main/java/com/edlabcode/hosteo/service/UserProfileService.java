package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.ProfileResponse;
import com.edlabcode.hosteo.dto.UpdateProfileRequest;
import com.edlabcode.hosteo.entity.ProfileLanguage;
import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.exception.*;
import com.edlabcode.hosteo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserRepository users;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String subject) {
        return ProfileResponse.from(getUser(subject));
    }

    @Transactional
    public ProfileResponse updateProfile(String subject, UpdateProfileRequest request) {
        var user = getUser(subject);
        if (user.getVersion() != request.version()) {
            throw new ProfileConflictException();
        }
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        if (users.existsByEmailAndIdNot(email, user.getId())) {
            throw new DuplicateEmailException();
        }
        var codes = new HashSet<String>();
        for (var language : request.languages()) {
            if (!codes.add(language.code())) {
                throw new InvalidProfileException("Languages must not contain duplicate codes");
            }
        }
        var interests = new HashSet<String>();
        for (String interest : request.interests()) {
            if (!interests.add(interest.strip().toLowerCase(Locale.ROOT))) {
                throw new InvalidProfileException("Interests must not contain duplicate values");
            }
        }
        user.setFirstName(request.firstName().strip());
        user.setLastName(request.lastName().strip());
        user.setEmail(email);
        user.setPhone(clean(request.phone()));
        user.setGender(request.gender());
        user.setDateOfBirth(request.dateOfBirth());
        user.setBiography(clean(request.biography()));
        user.setOccupation(clean(request.occupation()));
        user.setLocation(clean(request.location()));
        user.getLanguages().clear();
        for (var language : request.languages()) {
            var value = new ProfileLanguage();
            value.setCode(language.code());
            value.setProficiency(language.proficiency());
            user.getLanguages().add(value);
        }
        user.getInterests().clear();
        request.interests().forEach(interest -> user.getInterests().add(interest.strip()));
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
                if (cause instanceof org.hibernate.exception.ConstraintViolationException violation
                        && violation.getConstraintName() != null
                        && violation.getConstraintName().toLowerCase(Locale.ROOT).contains("email")) {
                    throw new DuplicateEmailException();
                }
            }
            throw exception;
        }
        return ProfileResponse.from(user);
    }

    private User getUser(String subject) {
        return users.findById(Long.valueOf(subject)).filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid authentication"));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}

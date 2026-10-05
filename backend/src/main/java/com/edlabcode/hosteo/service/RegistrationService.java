package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.dto.RegisterRequest;
import com.edlabcode.hosteo.dto.UserResponse;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.exception.DuplicateEmailException;
import com.edlabcode.hosteo.exception.InvalidRegistrationException;
import com.edlabcode.hosteo.repository.RoleRepository;
import com.edlabcode.hosteo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidRegistrationException("Password must not exceed 72 UTF-8 bytes");
        }
        var role = roles.findByCode(RoleCode.GUEST)
                .orElseThrow(() -> new IllegalStateException("Guest role is not configured"));
        var user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().strip());
        user.setLastName(request.lastName().strip());
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().strip());
        user.setRole(role);
        user.setActive(true);
        try {
            return UserResponse.from(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
                if (cause instanceof org.hibernate.exception.ConstraintViolationException violation
                        && violation.getConstraintName() != null) {
                    String constraint = violation.getConstraintName().toLowerCase(Locale.ROOT);
                    if (constraint.contains("email")) {
                        throw new DuplicateEmailException();
                    }
                }
            }
            throw exception;
        }
    }
}

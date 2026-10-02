package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.config.JwtProperties;
import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final JwtProperties properties;
    private final String dummyPasswordHash;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        var user = users.findByEmail(request.email().strip().toLowerCase(Locale.ROOT));
        String hash = user.map(User::getPasswordHash).orElse(dummyPasswordHash);
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwordEncoder.matches(request.password(), hash)
                || user.isEmpty() || !user.get().isActive()) {
            throw new BadCredentialsException("Invalid email or password");
        }
        var account = user.get();
        account.setLastLoginAt(Instant.now());
        return new LoginResponse(tokens.issue(account), "Bearer", properties.ttl().toSeconds(),
                UserResponse.from(account));
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String subject) {
        return users.findById(Long.valueOf(subject)).filter(User::isActive)
                .map(UserResponse::from)
                .orElseThrow(() -> new BadCredentialsException("Invalid authentication"));
    }
}

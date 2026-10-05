package com.edlabcode.hosteo.service;

import com.edlabcode.hosteo.config.JwtProperties;
import com.edlabcode.hosteo.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {
    private final JwtEncoder encoder;
    private final JwtProperties properties;

    public String issue(User user) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.ttl()))
                .id(UUID.randomUUID().toString())
                .claim("roleId", user.getRole().getId())
                .claim("roleRevision", user.getRoleRevision())
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}

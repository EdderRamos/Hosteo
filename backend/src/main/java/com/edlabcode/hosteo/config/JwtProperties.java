package com.edlabcode.hosteo.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(@NotBlank @Size(min = 32) String secret,
                            @NotBlank String issuer, @NotNull Duration ttl) {
    public JwtProperties {
        if (ttl != null && (ttl.isNegative() || ttl.isZero())) {
            throw new IllegalArgumentException("JWT lifetime must be positive");
        }
    }

    @Override
    public String toString() {
        return "JwtProperties[issuer=" + issuer + ", ttl=" + ttl + "]";
    }
}

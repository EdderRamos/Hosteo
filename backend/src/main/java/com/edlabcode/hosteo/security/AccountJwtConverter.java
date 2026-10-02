package com.edlabcode.hosteo.security;

import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class AccountJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final UserRepository users;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        long id;
        try {
            id = Long.parseLong(Objects.requireNonNull(jwt.getSubject()));
        } catch (NumberFormatException exception) {
            throw new InvalidBearerTokenException("Invalid authentication");
        }
        var user = users.findById(id).filter(User::isActive)
                .orElseThrow(() -> new InvalidBearerTokenException("Invalid authentication"));
        String role = user.getRole().getCode().name();
        Object roleId = jwt.getClaim("roleId");
        if (!(roleId instanceof Number number) || number.longValue() != user.getRole().getId()) {
            throw new InvalidBearerTokenException("Invalid authentication");
        }
        return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }
}

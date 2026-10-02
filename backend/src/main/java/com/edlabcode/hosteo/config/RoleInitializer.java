package com.edlabcode.hosteo.config;

import com.edlabcode.hosteo.entity.Role;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.bootstrap.roles", havingValue = "true")
public class RoleInitializer implements ApplicationRunner {
    private final RoleRepository roles;

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        for (RoleCode code : RoleCode.values()) {
            if (roles.findByCode(code).isEmpty()) {
                var role = new Role();
                role.setCode(code);
                role.setDescription(code.name());
                roles.save(role);
            }
        }
        roles.flush();
    }
}

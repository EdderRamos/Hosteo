package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.Role;
import com.edlabcode.hosteo.entity.RoleCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCode(RoleCode code);
}

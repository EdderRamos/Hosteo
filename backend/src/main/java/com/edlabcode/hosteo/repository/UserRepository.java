package com.edlabcode.hosteo.repository;

import com.edlabcode.hosteo.entity.User;
import com.edlabcode.hosteo.entity.DocumentType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    boolean existsByDocumentTypeAndDocumentNumber(DocumentType documentType, String documentNumber);

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmail(String email);

    @Override
    @EntityGraph(attributePaths = "role")
    Optional<User> findById(Long id);
}

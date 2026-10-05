package com.edlabcode.hosteo.service;
import com.edlabcode.hosteo.dto.*;
import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.*;
import java.util.*;
@Service
@RequiredArgsConstructor
public class StaffService {
    private final UserRepository users;
    private final RoleRepository roles;
    public record UserPage(List<StaffUserResponse> items, long total, int page, int pages) {}
    public record Summary(long customers, long administrators, long support) {}
    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary(users.countByRoleCode(RoleCode.GUEST) + users.countByRoleCode(RoleCode.HOST),
                users.countByRoleCode(RoleCode.ADMINISTRATOR), users.countByRoleCode(RoleCode.SUPPORT));
    }
    @Transactional(readOnly = true)
    public UserPage search(String query, int page) {
        var result = users.findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                query.strip(), query.strip(), query.strip(), PageRequest.of(page, 10, Sort.by("lastName", "firstName", "id")));
        return new UserPage(result.getContent().stream().map(StaffUserResponse::from).toList(), result.getTotalElements(), page, result.getTotalPages());
    }
    @Transactional
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public StaffUserResponse assign(Long id, String actor, AssignRoleRequest request) {
        // Lock the acting administrator too: a concurrent demotion must not retain write permission.
        var actorId = Long.valueOf(actor);
        var first = users.findLockedById(Math.min(id, actorId)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var second = id.equals(actorId) ? first : users.findLockedById(Math.max(id, actorId)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var administrator = first.getId().equals(actorId) ? first : second;
        var user = first.getId().equals(id) ? first : second;
        if (!administrator.isActive() || administrator.getRole().getCode() != RoleCode.ADMINISTRATOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required");
        if (id.equals(actorId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot change your own role");
        if (user.getVersion() != request.version()) throw new ResponseStatusException(HttpStatus.CONFLICT, "User has changed; reload before saving");
        if (user.getRole().getCode() != request.roleCode()) {
            user.setRole(roles.findByCode(request.roleCode()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not configured")));
            user.setRoleRevision(user.getRoleRevision() + 1);
            users.saveAndFlush(user);
        }
        return StaffUserResponse.from(user);
    }
}

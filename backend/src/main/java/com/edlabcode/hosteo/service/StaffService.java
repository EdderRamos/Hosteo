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
    public record Summary(long guests, long hosts, long administrators, long support) {}
    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary(users.countByRoleCode(RoleCode.GUEST), users.countByRoleCode(RoleCode.HOST),
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
    public StaffUserResponse assign(Long id, String actor, long actorRevision, AssignRoleRequest request) {
        var user = lockedTarget(id, actor, actorRevision);
        checkVersion(user, request.version());
        if (user.getRole().getCode() != request.roleCode()) {
            user.setRole(roles.findByCode(request.roleCode()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not configured")));
            user.setRoleRevision(user.getRoleRevision() + 1);
            users.saveAndFlush(user);
        }
        return StaffUserResponse.from(user);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public StaffUserResponse updateStatus(Long id, String actor, long actorRevision, UpdateUserStatusRequest request) {
        var user = lockedTarget(id, actor, actorRevision);
        checkVersion(user, request.version());
        if (user.isActive() != request.active()) {
            user.setActive(request.active());
            // This existing session revision also covers access changes: reactivation cannot revive old JWTs.
            user.setRoleRevision(user.getRoleRevision() + 1);
            users.saveAndFlush(user);
        }
        return StaffUserResponse.from(user);
    }

    private com.edlabcode.hosteo.entity.User lockedTarget(Long id, String actor, long actorRevision) {
        var actorId = Long.valueOf(actor);
        // Lock both accounts in ID order and recheck the actor after any concurrent access change.
        var first = users.findLockedById(Math.min(id, actorId)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var second = id.equals(actorId) ? first : users.findLockedById(Math.max(id, actorId)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        var administrator = first.getId().equals(actorId) ? first : second;
        if (!administrator.isActive() || administrator.getRoleRevision() != actorRevision)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication");
        if (administrator.getRole().getCode() != RoleCode.ADMINISTRATOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required");
        if (id.equals(actorId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot change your own account access");
        return first.getId().equals(id) ? first : second;
    }

    private void checkVersion(com.edlabcode.hosteo.entity.User user, long version) {
        if (user.getVersion() != version)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User has changed; reload before saving");
    }
}

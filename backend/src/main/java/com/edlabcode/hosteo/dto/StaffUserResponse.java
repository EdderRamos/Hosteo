package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.RoleCode;
import com.edlabcode.hosteo.entity.User;

public record StaffUserResponse(Long id, String firstName, String lastName, String email, RoleCode roleCode,
                                boolean active, long version) {
    public static StaffUserResponse from(User u) {
        return new StaffUserResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getRole().getCode(), u.isActive(), u.getVersion());
    }
}

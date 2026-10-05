package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.User;

public record UserResponse(Long id, String email, String firstName, String lastName, Long roleId,
                           com.edlabcode.hosteo.entity.RoleCode roleCode) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getRole().getId(), user.getRole().getCode());
    }
}

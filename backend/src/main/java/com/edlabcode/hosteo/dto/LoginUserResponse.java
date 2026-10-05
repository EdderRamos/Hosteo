package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.User;

public record LoginUserResponse(Long id, String email, String firstName, String lastName, Long roleId,
                                com.edlabcode.hosteo.entity.RoleCode roleCode) {
    public static LoginUserResponse from(User user) {
        return new LoginUserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole().getId(), user.getRole().getCode());
    }
}

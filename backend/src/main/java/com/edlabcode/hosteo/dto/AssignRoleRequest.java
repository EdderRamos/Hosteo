package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.RoleCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AssignRoleRequest(@NotNull RoleCode roleCode, @NotNull @PositiveOrZero Long version) {
}

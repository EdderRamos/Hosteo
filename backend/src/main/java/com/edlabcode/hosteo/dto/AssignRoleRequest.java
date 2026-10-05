package com.edlabcode.hosteo.dto;
import com.edlabcode.hosteo.entity.RoleCode;
import jakarta.validation.constraints.*;
public record AssignRoleRequest(@NotNull RoleCode roleCode, @NotNull @PositiveOrZero Long version) {}

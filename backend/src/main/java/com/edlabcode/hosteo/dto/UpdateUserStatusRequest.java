package com.edlabcode.hosteo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateUserStatusRequest(
        @NotNull Boolean active,
        @NotNull @PositiveOrZero Long version) {
}

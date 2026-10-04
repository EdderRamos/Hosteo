package com.edlabcode.hosteo.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Size(max = 30) String phone) {
    @Override
    public String toString() {
        return "RegisterRequest[credentials=REDACTED]";
    }
}

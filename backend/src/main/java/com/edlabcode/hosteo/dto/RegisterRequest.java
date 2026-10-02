package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.DocumentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Size(max = 30) String phone,
        @NotNull DocumentType documentType,
        @NotBlank @Size(max = 30) @Pattern(regexp = "[A-Za-z0-9]+", message = "Document number must contain only letters and digits") String documentNumber) {
    @Override
    public String toString() {
        return "RegisterRequest[credentials=REDACTED]";
    }
}

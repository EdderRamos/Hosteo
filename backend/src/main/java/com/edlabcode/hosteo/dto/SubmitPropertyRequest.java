package com.edlabcode.hosteo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SubmitPropertyRequest(@NotNull @Min(0) Long version) {}

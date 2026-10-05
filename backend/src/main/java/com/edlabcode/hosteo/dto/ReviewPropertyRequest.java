package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.ReviewDecision;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewPropertyRequest(@NotNull @Min(0) Long version, @NotNull ReviewDecision decision,
                                    @Size(max = 1000) String comment) {
    @io.swagger.v3.oas.annotations.media.Schema(hidden = true)
    @AssertTrue(message = "A rejection reason is required")
    public boolean isRejectionReasonValid() {
        return decision != ReviewDecision.REJECTED || (comment != null && !comment.isBlank());
    }

    public String normalizedComment() {
        return comment == null || comment.isBlank() ? null : comment.strip();
    }
}

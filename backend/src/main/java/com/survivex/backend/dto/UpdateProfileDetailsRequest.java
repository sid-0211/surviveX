package com.survivex.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileDetailsRequest(
        @NotBlank String bio,
        @NotBlank String survivalFocus
) {
}

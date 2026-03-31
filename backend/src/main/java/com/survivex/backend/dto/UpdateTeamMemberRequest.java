package com.survivex.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTeamMemberRequest(
        @NotBlank String name,
        String photoUrl,
        @NotBlank String description
) {
}

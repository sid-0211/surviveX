package com.survivex.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdatePostRequest(
        @NotNull Long requesterId,
        @NotBlank String title,
        @NotBlank String story,
        @NotBlank String survivalLesson,
        String imageUrl
) {
}

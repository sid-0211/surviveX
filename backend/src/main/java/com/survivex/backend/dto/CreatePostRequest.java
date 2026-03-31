package com.survivex.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePostRequest(
        @NotNull Long authorId,
        @NotBlank String title,
        @NotBlank String story,
        @NotBlank String survivalLesson,
        String imageUrl
) {
}

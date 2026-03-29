package com.survivex.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleLikeRequest(@NotNull Long userId) {
}

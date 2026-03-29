package com.survivex.backend.dto;

import jakarta.validation.constraints.NotNull;

public record DeleteContentRequest(@NotNull Long requesterId) {
}

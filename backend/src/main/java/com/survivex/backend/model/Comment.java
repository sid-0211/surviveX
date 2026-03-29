package com.survivex.backend.model;

import java.time.Instant;

public record Comment(
        Long id,
        Long authorId,
        String authorName,
        String message,
        Instant createdAt
) {
}

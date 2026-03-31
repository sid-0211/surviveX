package com.survivex.backend.model;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record Post(
        Long id,
        Long authorId,
        String authorName,
        String authorHandle,
        String authorProfilePhotoUrl,
        String title,
        String story,
        String survivalLesson,
        String imageUrl,
        Instant createdAt,
        String status,
        Set<Long> likedUserIds,
        List<Comment> comments
) {
}

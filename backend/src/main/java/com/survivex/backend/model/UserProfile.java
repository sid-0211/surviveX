package com.survivex.backend.model;

public record UserProfile(
        Long id,
        String username,
        String displayName,
        String bio,
        String survivalFocus
) {
}

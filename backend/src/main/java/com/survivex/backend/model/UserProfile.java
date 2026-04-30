package com.survivex.backend.model;

public record UserProfile(
        Long id,
        String email,
        String username,
        String displayName,
        String bio,
        String survivalFocus,
        String profilePhotoUrl,
        String coverImageUrl
) {
}

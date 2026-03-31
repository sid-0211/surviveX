package com.survivex.backend.dto;

public record UpdateProfileMediaRequest(
        String profilePhotoUrl,
        String coverImageUrl
) {
}

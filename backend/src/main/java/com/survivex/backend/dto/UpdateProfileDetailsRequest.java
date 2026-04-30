package com.survivex.backend.dto;

public record UpdateProfileDetailsRequest(
        String bio,
        String survivalFocus
) {
}

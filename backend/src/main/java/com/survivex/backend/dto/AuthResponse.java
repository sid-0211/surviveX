package com.survivex.backend.dto;

import com.survivex.backend.model.UserProfile;

public record AuthResponse(
        String message,
        UserProfile user
) {
}

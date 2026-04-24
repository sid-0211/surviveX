package com.survivex.backend.service;

public record PostModerationDecision(
        boolean approved,
        String reasonCode,
        String message
) {
}

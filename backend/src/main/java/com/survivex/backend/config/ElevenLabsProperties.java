package com.survivex.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "elevenlabs")
public record ElevenLabsProperties(
        String apiKey,
        String voiceId,
        String modelId
) {
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && voiceId != null && !voiceId.isBlank()
                && modelId != null && !modelId.isBlank();
    }
}

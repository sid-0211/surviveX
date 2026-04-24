package com.survivex.backend.service;

import com.survivex.backend.config.ElevenLabsProperties;
import com.survivex.backend.model.Post;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class ElevenLabsNarrationService {

    private final ElevenLabsProperties elevenLabsProperties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public ElevenLabsNarrationService(ElevenLabsProperties elevenLabsProperties) {
        this.elevenLabsProperties = elevenLabsProperties;
    }

    public byte[] generateNarration(Post post) {
        if (!elevenLabsProperties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI narration is not configured. Set ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, and ELEVENLABS_MODEL_ID."
            );
        }

        String requestBody = """
                {
                  "text": "%s",
                  "model_id": "%s",
                  "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.78,
                    "style": 0.15,
                    "use_speaker_boost": true
                  }
                }
                """.formatted(
                escapeJson(buildNarrationText(post)),
                escapeJson(elevenLabsProperties.modelId())
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        "https://api.elevenlabs.io/v1/text-to-speech/"
                                + elevenLabsProperties.voiceId()
                                + "?output_format=mp3_44100_128"
                ))
                .header("Accept", "audio/mpeg")
                .header("Content-Type", "application/json")
                .header("xi-api-key", elevenLabsProperties.apiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 400) {
                String errorBody = new String(response.body(), StandardCharsets.UTF_8);
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "ElevenLabs narration failed: " + truncate(errorBody)
                );
            }
            return response.body();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach ElevenLabs right now");
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach ElevenLabs right now");
        }
    }

    private String buildNarrationText(Post post) {
        return post.title() + ". " + post.story() + ". Instinct that mattered. " + post.survivalLesson() + ".";
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private String truncate(String value) {
        return value.length() > 240 ? value.substring(0, 240) + "..." : value;
    }
}

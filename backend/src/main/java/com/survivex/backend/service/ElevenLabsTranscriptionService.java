package com.survivex.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.survivex.backend.config.ElevenLabsProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
public class ElevenLabsTranscriptionService {

    private final ElevenLabsProperties elevenLabsProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.elevenlabs.io")
            .build();

    public ElevenLabsTranscriptionService(ElevenLabsProperties elevenLabsProperties) {
        this.elevenLabsProperties = elevenLabsProperties;
    }

    public String transcribe(MultipartFile file) {
        if (!elevenLabsProperties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI speech-to-text is not configured. Set ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, and ELEVENLABS_MODEL_ID."
            );
        }

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please record audio before transcribing.");
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("model_id", "scribe_v2");
            body.add("language_code", "en");
            body.add("file", new NamedByteArrayResource(file.getBytes(), resolveFilename(file)));

            String responseBody = restClient.post()
                    .uri("/v1/speech-to-text")
                    .header("xi-api-key", elevenLabsProperties.apiKey())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode -> HttpStatusCode.isError(), (request, response) -> {
                        String error = new String(response.getBody().readAllBytes());
                        throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "ElevenLabs transcription failed: " + truncate(error)
                        );
                    })
                    .body(String.class);

            JsonNode payload = objectMapper.readTree(responseBody == null ? "{}" : responseBody);
            String transcript = payload.path("text").asText("").trim();
            if (transcript.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ElevenLabs returned an empty transcript.");
            }
            return transcript;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to transcribe audio right now.");
        }
    }

    private String resolveFilename(MultipartFile file) {
        String original = file.getOriginalFilename();
        return (original == null || original.isBlank()) ? "speech.webm" : original;
    }

    private String truncate(String value) {
        return value.length() > 240 ? value.substring(0, 240) + "..." : value;
    }

    private static final class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        private NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}

package com.survivex.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.survivex.backend.config.GeminiProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class GeminiPostModerationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final GeminiProperties geminiProperties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public GeminiPostModerationService(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;
    }

    public PostModerationDecision moderate(String title, String story, String survivalLesson) {
        if (!geminiProperties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Automatic story moderation is not configured. Set GEMINI_API_KEY and GEMINI_MODEL."
            );
        }

        try {
            ObjectNode requestBody = OBJECT_MAPPER.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode userTurn = contents.addObject();
            userTurn.put("role", "user");
            ArrayNode parts = userTurn.putArray("parts");
            parts.addObject().put(
                    "text",
                    """
                    You moderate user-submitted survival stories for a public website.

                    Approve a story only when all of these are true:
                    - it is coherent and understandable
                    - it does not contain vulgar, abusive, sexual, hateful, or spammy language
                    - it is plausibly possible as a real-world human survival event

                    Reject a story when:
                    - it contains vulgar or abusive language
                    - it is nonsense, gibberish, or too incoherent to be meaningful
                    - it describes an obviously impossible survival event on its face

                    Important:
                    - Do not fact-check subtle claims.
                    - Only use impossible_story when the impossibility is obvious, like surviving impossible physics without explanation.
                    - Keep the message short, user-facing, and specific.
                    - Return JSON only.

                    Story submission:
                    Title: %s

                    Story:
                    %s

                    Instinct that mattered:
                    %s
                    """.formatted(title, story, survivalLesson)
            );

            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("responseMimeType", "application/json");

            ObjectNode responseSchema = generationConfig.putObject("responseSchema");
            responseSchema.put("type", "OBJECT");
            ObjectNode properties = responseSchema.putObject("properties");
            properties.putObject("approved").put("type", "BOOLEAN");

            ObjectNode reasonCode = properties.putObject("reasonCode");
            reasonCode.put("type", "STRING");
            ArrayNode reasonEnum = reasonCode.putArray("enum");
            reasonEnum.add("approved");
            reasonEnum.add("vulgar_language");
            reasonEnum.add("impossible_story");
            reasonEnum.add("incoherent_story");

            properties.putObject("message").put("type", "STRING");

            ArrayNode required = responseSchema.putArray("required");
            required.add("approved");
            required.add("reasonCode");
            required.add("message");

            String requestUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + URLEncoder.encode(geminiProperties.model(), StandardCharsets.UTF_8)
                    + ":generateContent?key="
                    + URLEncoder.encode(geminiProperties.apiKey(), StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            OBJECT_MAPPER.writeValueAsString(requestBody),
                            StandardCharsets.UTF_8
                    ))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini moderation failed: " + truncate(response.body())
                );
            }

            JsonNode responseJson = OBJECT_MAPPER.readTree(response.body());
            JsonNode textNode = responseJson.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            String outputText = textNode.asText("").trim();
            if (outputText.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini moderation returned no usable result.");
            }

            JsonNode moderationJson = OBJECT_MAPPER.readTree(outputText);
            boolean approved = moderationJson.path("approved").asBoolean(false);
            String reason = moderationJson.path("reasonCode").asText(approved ? "approved" : "incoherent_story");
            String message = moderationJson.path("message").asText(
                    approved
                            ? "Your story passed automatic moderation and was published."
                            : "Your story did not pass automatic moderation."
            ).trim();
            return new PostModerationDecision(approved, reason, message);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach the moderation model right now.");
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach the moderation model right now.");
        }
    }

    private String truncate(String value) {
        return value != null && value.length() > 240 ? value.substring(0, 240) + "..." : value;
    }
}

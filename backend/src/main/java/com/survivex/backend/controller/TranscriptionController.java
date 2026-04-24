package com.survivex.backend.controller;

import com.survivex.backend.service.ElevenLabsTranscriptionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@RestController
@RequestMapping("/api/transcription")
public class TranscriptionController {

    private final ElevenLabsTranscriptionService elevenLabsTranscriptionService;

    public TranscriptionController(ElevenLabsTranscriptionService elevenLabsTranscriptionService) {
        this.elevenLabsTranscriptionService = elevenLabsTranscriptionService;
    }

    @PostMapping
    public Map<String, String> transcribe(@RequestParam("file") MultipartFile file) {
        return Map.of("text", elevenLabsTranscriptionService.transcribe(file));
    }
}

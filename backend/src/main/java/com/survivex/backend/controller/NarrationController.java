package com.survivex.backend.controller;

import com.survivex.backend.model.Post;
import com.survivex.backend.service.ElevenLabsNarrationService;
import com.survivex.backend.service.SurviveXService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/narration")
public class NarrationController {

    private final SurviveXService surviveXService;
    private final ElevenLabsNarrationService elevenLabsNarrationService;

    public NarrationController(
            SurviveXService surviveXService,
            ElevenLabsNarrationService elevenLabsNarrationService
    ) {
        this.surviveXService = surviveXService;
        this.elevenLabsNarrationService = elevenLabsNarrationService;
    }

    @GetMapping(value = "/posts/{postId}", produces = "audio/mpeg")
    public ResponseEntity<byte[]> narratePost(@PathVariable Long postId) {
        Post post = surviveXService.getPost(postId);
        byte[] audio = elevenLabsNarrationService.generateNarration(post);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentDisposition(ContentDisposition.inline().filename("survivex-post-" + postId + ".mp3").build());
        return ResponseEntity.ok().headers(headers).body(audio);
    }
}

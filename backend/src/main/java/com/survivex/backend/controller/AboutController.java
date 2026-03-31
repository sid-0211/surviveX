package com.survivex.backend.controller;

import com.survivex.backend.dto.UpdateAboutPageRequest;
import com.survivex.backend.model.AboutPage;
import com.survivex.backend.service.SurviveXService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/about")
public class AboutController {

    private final SurviveXService surviveXService;

    public AboutController(SurviveXService surviveXService) {
        this.surviveXService = surviveXService;
    }

    @GetMapping
    public AboutPage getAboutPage() {
        return surviveXService.getAboutPage();
    }

    @PostMapping
    public AboutPage updateAboutPage(@Valid @RequestBody UpdateAboutPageRequest request) {
        return surviveXService.updateAboutPage(request);
    }
}

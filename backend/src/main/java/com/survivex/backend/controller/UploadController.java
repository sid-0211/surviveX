package com.survivex.backend.controller;

import com.survivex.backend.service.CloudinaryUploadService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final CloudinaryUploadService cloudinaryUploadService;

    public UploadController(CloudinaryUploadService cloudinaryUploadService) {
        this.cloudinaryUploadService = cloudinaryUploadService;
    }

    @PostMapping("/image")
    public Map<String, String> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "folder", defaultValue = "general") String folder
    ) {
        String imageUrl = cloudinaryUploadService.uploadImage(file, folder);
        return Map.of("imageUrl", imageUrl);
    }
}

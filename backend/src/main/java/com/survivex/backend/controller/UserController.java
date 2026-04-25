package com.survivex.backend.controller;

import com.survivex.backend.dto.AuthResponse;
import com.survivex.backend.dto.CreateUserRequest;
import com.survivex.backend.dto.LoginRequest;
import com.survivex.backend.dto.UpdateProfileDetailsRequest;
import com.survivex.backend.dto.UpdateProfileMediaRequest;
import com.survivex.backend.model.UserProfile;
import com.survivex.backend.service.SurviveXService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final SurviveXService surviveXService;

    public UserController(SurviveXService surviveXService) {
        this.surviveXService = surviveXService;
    }

    @GetMapping("/users")
    public List<UserProfile> getUsers() {
        return surviveXService.getUsers();
    }

    @GetMapping("/auth/username-availability")
    public Map<String, Boolean> checkUsernameAvailability(@RequestParam String username) {
        return Map.of("available", surviveXService.isUsernameAvailable(username));
    }

    @PostMapping("/auth/signup")
    public AuthResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        UserProfile user = surviveXService.createUser(request);
        return new AuthResponse("Account created successfully", user);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        UserProfile user = surviveXService.login(request);
        return new AuthResponse("Login successful", user);
    }

    @PostMapping("/users/{userId}/profile-media")
    public UserProfile updateProfileMedia(
            @PathVariable Long userId,
            @RequestBody UpdateProfileMediaRequest request
    ) {
        return surviveXService.updateProfileMedia(userId, request);
    }

    @PostMapping("/users/{userId}/profile-details")
    public UserProfile updateProfileDetails(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProfileDetailsRequest request
    ) {
        return surviveXService.updateProfileDetails(userId, request);
    }
}

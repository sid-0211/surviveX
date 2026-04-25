package com.survivex.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record CreateUserRequest(
        @NotBlank
        @Size(min = 4, message = "Username must be at least 4 characters long")
        String username,
        @NotBlank String displayName,
        @NotBlank String bio,
        @NotBlank String survivalFocus,
        String profilePhotoUrl,
        String coverImageUrl,
        @NotBlank
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{6,}$",
                message = "Password must be at least 6 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
        )
        String password
) {
}

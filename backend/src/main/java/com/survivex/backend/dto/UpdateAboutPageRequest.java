package com.survivex.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateAboutPageRequest(
        Long adminId,
        @NotBlank String title,
        String teamPhotoUrl,
        @NotBlank String teamStory,
        @Valid @NotEmpty List<UpdateTeamMemberRequest> members
) {
}

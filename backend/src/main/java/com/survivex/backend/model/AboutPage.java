package com.survivex.backend.model;

import java.util.List;

public record AboutPage(
        String title,
        String teamPhotoUrl,
        String teamStory,
        List<TeamMember> members
) {
}

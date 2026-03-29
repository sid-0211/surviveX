package com.survivex.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ApprovePostRequest(@NotNull Long adminId) {
}

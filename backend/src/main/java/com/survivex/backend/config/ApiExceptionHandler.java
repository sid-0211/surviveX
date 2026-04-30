package com.survivex.backend.config;

import com.survivex.backend.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        boolean hasRequiredFieldError = false;

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
            if ("NotBlank".equals(fieldError.getCode())) {
                hasRequiredFieldError = true;
            }
        }

        String message = hasRequiredFieldError
                ? "Mandatory fields are required."
                : "Please correct the highlighted fields.";

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(message, fieldErrors));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleStatus(ResponseStatusException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String reason = exception.getReason() == null ? "Request could not be processed." : exception.getReason();

        if (reason.toLowerCase().contains("username")) {
            fieldErrors.put("username", reason);
        }
        if (reason.toLowerCase().contains("email")) {
            fieldErrors.put("email", reason);
        }

        return ResponseEntity.status(exception.getStatusCode())
                .body(new ApiErrorResponse(reason, fieldErrors));
    }
}

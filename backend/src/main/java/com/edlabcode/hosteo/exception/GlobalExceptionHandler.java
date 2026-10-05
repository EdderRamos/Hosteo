package com.edlabcode.hosteo.exception;

import com.edlabcode.hosteo.dto.ApiError;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
import java.util.LinkedHashMap;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({jakarta.validation.ConstraintViolationException.class,
            org.springframework.web.method.annotation.HandlerMethodValidationException.class})
    public ResponseEntity<ApiError> parameterValidation(Exception exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "VALIDATION_ERROR", "Check the submitted parameters"));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiError> status(org.springframework.web.server.ResponseStatusException exception) {
        int status = exception.getStatusCode().value();
        return ResponseEntity.status(status).body(ApiError.of(status, status == 409 ? "CONFLICT" : "REQUEST_ERROR", exception.getReason()));
    }

    @ExceptionHandler({org.springframework.web.bind.MissingRequestHeaderException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalidParameter(Exception exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "VALIDATION_ERROR", "Check the submitted parameters"));
    }

    @ExceptionHandler(InvalidProfileException.class)
    public ResponseEntity<ApiError> invalidProfile(InvalidProfileException exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "INVALID_PROFILE", exception.getMessage()));
    }

    @ExceptionHandler({ProfileConflictException.class, org.springframework.orm.ObjectOptimisticLockingFailureException.class})
    public ResponseEntity<ApiError> profileConflict(Exception exception) {
        return ResponseEntity.status(409).body(ApiError.of(409, "PROFILE_CONFLICT",
                "Your profile has changed. Reload it before saving again"));
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> duplicateEmail(DuplicateEmailException exception) {
        return ResponseEntity.status(409).body(ApiError.of(409, "EMAIL_ALREADY_EXISTS", exception.getMessage()));
    }

    @ExceptionHandler(InvalidRegistrationException.class)
    public ResponseEntity<ApiError> invalidRegistration(InvalidRegistrationException exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "INVALID_REGISTRATION", exception.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> credentials(BadCredentialsException exception) {
        return ResponseEntity.status(401).body(ApiError.of(401, "INVALID_CREDENTIALS", "Invalid email or password"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException exception) {
        var fields = new LinkedHashMap<String, String>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(Instant.now(), 400, "VALIDATION_ERROR",
                "Check the submitted fields", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformedBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "INVALID_REQUEST", "Invalid request body"));
    }
}

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
        return ResponseEntity.badRequest().body(ApiError.of(400, "VALIDATION_ERROR", "Revisa las fechas, identificadores y parámetros de la solicitud."));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiError> status(org.springframework.web.server.ResponseStatusException exception) {
        int status = exception.getStatusCode().value();
        return ResponseEntity.status(status).body(ApiError.of(status, status == 409 ? "CONFLICT" : "REQUEST_ERROR", exception.getReason()));
    }

    @ExceptionHandler({org.springframework.web.bind.MissingRequestHeaderException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalidParameter(Exception exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "VALIDATION_ERROR", "Revisa las fechas, identificadores y parámetros de la solicitud."));
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
                "Revisa los campos indicados antes de continuar.", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformedBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "INVALID_REQUEST", "La solicitud contiene datos incompletos o con formato incorrecto."));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integrity(Exception exception) {
        return ResponseEntity.status(409).body(ApiError.of(409,"DATA_CONFLICT","La operación entra en conflicto con datos registrados. Actualiza la información antes de continuar."));
    }
    @ExceptionHandler(org.springframework.dao.DataAccessResourceFailureException.class)
    public ResponseEntity<ApiError> databaseUnavailable(Exception exception) {
        return ResponseEntity.status(503).body(ApiError.of(503,"SERVICE_UNAVAILABLE","El servicio no está disponible temporalmente. Intenta nuevamente en unos minutos."));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> denied(Exception exception) {
        return ResponseEntity.status(403).body(ApiError.of(403,"ACCESS_DENIED","Tu cuenta no tiene permiso para realizar esta acción."));
    }
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiError> authentication(Exception exception) {
        return ResponseEntity.status(401).body(ApiError.of(401,"INVALID_SESSION","Tu sesión no es válida. Inicia sesión nuevamente."));
    }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiError> missingResource(Exception exception) {
        return ResponseEntity.status(404).body(ApiError.of(404,"NOT_FOUND","No encontramos el recurso solicitado. Comprueba la dirección."));
    }
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> method(Exception exception) {
        return ResponseEntity.status(405).body(ApiError.of(405,"METHOD_NOT_ALLOWED","Esta operación no está disponible para el recurso solicitado."));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception exception) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class).error("Unhandled API failure",exception);
        return ResponseEntity.internalServerError().body(ApiError.of(500,"INTERNAL_ERROR","No pudimos completar la operación. Actualiza la información antes de reintentar; si persiste, contacta con soporte."));
    }
}

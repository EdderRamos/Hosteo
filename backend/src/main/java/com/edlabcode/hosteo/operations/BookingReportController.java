package com.edlabcode.hosteo.operations;

import com.edlabcode.hosteo.entity.BookingStatus;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
@RequestMapping("/api/v1/admin/reports/bookings")
@SecurityRequirement(name = "bearerAuth")
public class BookingReportController {
    private final BookingReportService reports;

    @GetMapping
    public ResponseEntity<BookingReportService.Report> report(@RequestParam LocalDate startDate, @RequestParam LocalDate endDate, @RequestParam(required = false) BookingStatus status, @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(reports.report(startDate, endDate, status, page));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> export(@RequestParam LocalDate startDate, @RequestParam LocalDate endDate, @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bookings-" + startDate + "-" + endDate + ".csv").contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8)).body(reports.csv(startDate, endDate, status).getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}

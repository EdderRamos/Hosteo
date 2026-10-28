package com.edlabcode.hosteo.operations;

import com.edlabcode.hosteo.entity.Booking;
import com.edlabcode.hosteo.entity.BookingStatus;
import com.edlabcode.hosteo.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import static com.edlabcode.hosteo.operations.OperationsContracts.PageResult;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class BookingReportService {
    private final BookingRepository bookings;

    public record Row(Long id, UUID confirmationCode, Long propertyId, String propertyTitle, String guestName,
                      String guestEmail, String hostName, LocalDate checkIn, LocalDate checkOut, int guestCount,
                      BookingStatus status, BigDecimal totalAmount, String currency) {
        static Row from(Booking b) {
            return new Row(b.getId(), b.getConfirmationCode(), b.getProperty().getId(), b.getProperty().getTitle(), b.getGuest().getFirstName() + " " + b.getGuest().getLastName(), b.getGuest().getEmail(), b.getProperty().getHost().getFirstName() + " " + b.getProperty().getHost().getLastName(), b.getCheckIn(), b.getCheckOut(), b.getGuestCount(), b.getStatus(), b.getTotalAmount(), b.getCurrency());
        }
    }

    public record Report(LocalDate startDate, LocalDate endDate, BookingStatus status, Instant generatedAt,
                         PageResult<Row> records, Map<String, Long> bookingsByStatus,
                         Map<String, BigDecimal> nonCancelledAmountByCurrency) {
    }

    private void validate(LocalDate start, LocalDate end) {
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) > 365)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an ordered arrival range of at most 366 calendar days");
    }

    private Pageable page(int page, int size) {
        return PageRequest.of(page, size, Sort.by(Sort.Order.asc("checkIn"), Sort.Order.asc("id")));
    }

    public Report report(LocalDate start, LocalDate end, BookingStatus status, int page) {
        validate(start, end);
        var result = bookings.report(start, end, status, page(page, 10));
        var counts = new TreeMap<String, Long>();
        for (var row : bookings.reportStatuses(start, end, status))
            counts.put(row[0].toString(), ((Number) row[1]).longValue());
        var amounts = new TreeMap<String, BigDecimal>();
        for (var row : bookings.reportAmounts(start, end, status)) amounts.put(row[0].toString(), (BigDecimal) row[1]);
        return new Report(start, end, status, Instant.now(), new PageResult<>(result.map(Row::from).getContent(), result.getTotalElements(), page, result.getTotalPages()), counts, amounts);
    }

    private String cell(Object value) {
        String text = value == null ? "" : value.toString();
        String stripped = text.stripLeading();
        if (!stripped.isEmpty() && "=+-@\t\r\n".indexOf(stripped.charAt(0)) >= 0) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    public String csv(LocalDate start, LocalDate end, BookingStatus status) {
        validate(start, end);
        var first = bookings.report(start, end, status, page(0, 500));
        if (first.getTotalElements() > 10000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Narrow the filters to export at most 10000 bookings");
        var out = new StringBuilder("\uFEFFid,confirmation_code,property_id,property_title,guest_name,guest_email,host_name,check_in,check_out,guest_count,status,total_amount,currency\r\n");
        for (int index = 0; index < Math.max(first.getTotalPages(), 1); index++) {
            var batch = index == 0 ? first : bookings.report(start, end, status, page(index, 500));
            for (var b : batch) {
                var r = Row.from(b);
                Object[] fields = {r.id(), r.confirmationCode(), r.propertyId(), r.propertyTitle(), r.guestName(), r.guestEmail(), r.hostName(), r.checkIn(), r.checkOut(), r.guestCount(), r.status(), r.totalAmount(), r.currency()};
                out.append(Arrays.stream(fields).map(this::cell).collect(java.util.stream.Collectors.joining(","))).append("\r\n");
            }
        }
        return out.toString();
    }
}

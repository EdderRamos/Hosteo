package com.edlabcode.hosteo.operations;

import com.edlabcode.hosteo.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public final class OperationsContracts {
    private OperationsContracts() {}
    public record PublicProperty(Long id, String title, String description, PropertyType type, String address, String city, String district,
            int capacity, int bedrooms, int beds, int bathrooms, BigDecimal nightlyRate, String currency, long version) {
        public static PublicProperty from(Property p) {return new PublicProperty(p.getId(),p.getTitle(),p.getDescription(),p.getType(),p.getAddress(),p.getCity(),p.getDistrict(),p.getCapacity(),p.getBedrooms(),p.getBeds(),p.getBathrooms(),p.getNightlyRate(),p.getCurrency(),p.getVersion());}
    }
    public record BlockRequest(@NotNull LocalDate startDate, @NotNull LocalDate endDate, @NotBlank @Size(max=255) String reason) {}
    public record VersionRequest(@NotNull @Min(0) Long version) {}
    public record BookingRequest(@NotNull @Positive Long propertyId, @NotNull LocalDate checkIn, @NotNull LocalDate checkOut,
            @NotNull @Min(1) Integer guestCount, @NotNull @Min(0) Long propertyVersion) {}
    public record StatusRequest(@NotNull BookingStatus status, @NotNull @Min(0) Long version, @NotBlank @Size(max=1000) String comment) {}
    public record PageResult<T>(List<T> items, long total, int page, int pages) {}
    public record Identity(Long id, String name, String email) { public static Identity from(User u) { return new Identity(u.getId(),u.getFirstName()+" "+u.getLastName(),u.getEmail()); } }
    public record BlockView(Long id, Long propertyId, LocalDate startDate, LocalDate endDate, String reason, boolean active, Long createdById, Instant createdAt, long version) {
        public static BlockView from(AvailabilityBlock b) { return new BlockView(b.getId(),b.getProperty().getId(),b.getStartDate(),b.getEndDate(),b.getReason(),b.isActive(),b.getCreatedBy().getId(),b.getCreatedAt(),b.getVersion()); }
    }
    public record PaymentView(Long id, Long bookingId, UUID reference, PaymentStatus status, BigDecimal amount, String currency, Instant processedAt, long version) {
        public static PaymentView from(SimulatedPayment p) { return new PaymentView(p.getId(),p.getBooking().getId(),p.getReference(),p.getStatus(),p.getBooking().getTotalAmount(),p.getBooking().getCurrency(),p.getProcessedAt(),p.getVersion()); }
    }
    public record BookingView(Long id, UUID confirmationCode, Long propertyId, String propertyTitle, String district, Identity guest, Identity host,
            LocalDate checkIn, LocalDate checkOut, int guestCount, BigDecimal nightlyRate, BigDecimal totalAmount, String currency,
            BookingStatus status, Instant confirmedAt, Instant createdAt, long version, PaymentView payment) {
        public static BookingView from(Booking b, SimulatedPayment p) { return new BookingView(b.getId(),b.getConfirmationCode(),b.getProperty().getId(),b.getProperty().getTitle(),b.getProperty().getDistrict(),Identity.from(b.getGuest()),Identity.from(b.getProperty().getHost()),b.getCheckIn(),b.getCheckOut(),b.getGuestCount(),b.getAppliedNightlyRate(),b.getTotalAmount(),b.getCurrency(),b.getStatus(),b.getConfirmedAt(),b.getCreatedAt(),b.getVersion(),p==null?null:PaymentView.from(p)); }
    }
    public record PaymentRecord(PaymentView payment, UUID confirmationCode, String propertyTitle, Identity guest) {
        public static PaymentRecord from(SimulatedPayment p) { return new PaymentRecord(PaymentView.from(p),p.getBooking().getConfirmationCode(),p.getBooking().getProperty().getTitle(),Identity.from(p.getBooking().getGuest())); }
    }
    public record OccupiedRange(LocalDate startDate, LocalDate endDate, String kind) {}
    public record CalendarView(Long propertyId, LocalDate startDate, LocalDate endDate, List<BlockView> blocks, List<OccupiedRange> reservations) {}
    public record Availability(Long propertyId, long propertyVersion, LocalDate checkIn, LocalDate checkOut, int guestCount, boolean available, long nights, BigDecimal nightlyRate, BigDecimal totalAmount, String currency) {}
    public record Summary(long properties, Map<String,Long> propertiesByStatus, long bookings, Map<String,Long> bookingsByStatus,
            long upcomingBookings, long activeBlocks, long payments, Map<String,BigDecimal> bookedAmountByCurrency, Map<String,BigDecimal> paidAmountByCurrency) {}
    public record StatusHistoryView(BookingStatus previousStatus, BookingStatus newStatus, String comment, Instant changedAt) {
        public static StatusHistoryView from(BookingStatusHistory h) { return new StatusHistoryView(h.getPreviousStatus(),h.getNewStatus(),h.getComment(),h.getChangedAt()); }
    }
}

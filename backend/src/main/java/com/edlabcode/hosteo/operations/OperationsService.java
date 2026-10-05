package com.edlabcode.hosteo.operations;

import com.edlabcode.hosteo.dto.PropertyResponse;
import com.edlabcode.hosteo.entity.*;
import com.edlabcode.hosteo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.edlabcode.hosteo.operations.OperationsContracts.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('GUEST','HOST','ADMINISTRATOR')")
public class OperationsService {
    private final PropertyRepository properties;
    private final UserRepository users;
    private final BookingRepository bookings;
    private final AvailabilityBlockRepository blocks;
    private final SimulatedPaymentRepository payments;
    private final BookingStatusHistoryRepository history;
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("9999999999.99");

    private ResponseStatusException fail(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    private User actor(Jwt jwt, boolean lock, RoleCode... allowed) {
        var actor = (lock ? users.findLockedById(Long.valueOf(jwt.getSubject())) : users.findById(Long.valueOf(jwt.getSubject())))
                .orElseThrow(() -> fail(HttpStatus.UNAUTHORIZED, "Invalid authentication"));
        if (!actor.isActive() || actor.getRoleRevision() != jwt.<Number>getClaim("roleRevision").longValue())
            throw fail(HttpStatus.UNAUTHORIZED, "Invalid authentication");
        if (!Arrays.asList(allowed).contains(actor.getRole().getCode()))
            throw fail(HttpStatus.FORBIDDEN, "Access denied");
        return actor;
    }

    private Pageable page(int page) {
        if (page < 0 || page > 100000) throw fail(HttpStatus.BAD_REQUEST, "Invalid page");
        return PageRequest.of(page, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
    }

    private <T, R> PageResult<R> result(Page<T> p, Function<T, R> mapper) {
        return new PageResult<>(p.map(mapper).getContent(), p.getTotalElements(), p.getNumber(), p.getTotalPages());
    }

    private long range(LocalDate start, LocalDate end, boolean future) {
        long days = ChronoUnit.DAYS.between(start, end);
        if (days <= 0 || days > 366 || (future && start.isBefore(LocalDate.now(LIMA))))
            throw fail(HttpStatus.BAD_REQUEST, "Select an ordered date range of at most 366 nights, starting today or later");
        return days;
    }

    private Property property(Long id, boolean lock) {
        return (lock ? properties.findLockedById(id) : properties.findById(id)).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Property not found"));
    }

    private void manage(User actor, Property p) {
        if (actor.getRole().getCode() != RoleCode.ADMINISTRATOR && !p.getHost().getId().equals(actor.getId()))
            throw fail(HttpStatus.NOT_FOUND, "Property not found");
    }

    private boolean free(Long id, LocalDate start, LocalDate end) {
        return blocks.conflicts(id, start, end) == 0 && bookings.conflicts(id, start, end) == 0;
    }

    private BigDecimal total(Property p, long nights) {
        var total = p.getNightlyRate().multiply(BigDecimal.valueOf(nights));
        if (total.compareTo(MAX_AMOUNT) > 0)
            throw fail(HttpStatus.BAD_REQUEST, "The stay exceeds the supported total amount");
        return total;
    }

    private BookingView view(Booking b) {
        return BookingView.from(b, payments.findByBookingId(b.getId()).orElse(null));
    }

    private Booking owned(User u, Long id) {
        var b = bookings.findById(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Booking not found"));
        boolean allowed = u.getRole().getCode() == RoleCode.ADMINISTRATOR || (u.getRole().getCode() == RoleCode.GUEST && b.getGuest().getId().equals(u.getId())) || (u.getRole().getCode() == RoleCode.HOST && b.getProperty().getHost().getId().equals(u.getId()));
        if (!allowed) throw fail(HttpStatus.NOT_FOUND, "Booking not found");
        return b;
    }

    @PreAuthorize("permitAll()")
    public PageResult<PublicProperty> catalog(int page) {
        return result(properties.findAllByStatus(PropertyStatus.PUBLISHED, page(page)), PublicProperty::from);
    }

    @PreAuthorize("permitAll()")
    public PublicProperty catalogProperty(Long id) {
        return properties.findByIdAndStatus(id, PropertyStatus.PUBLISHED).map(PublicProperty::from).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Published property not found"));
    }

    @PreAuthorize("hasRole('GUEST')")
    public Availability availability(Jwt jwt, Long id, LocalDate start, LocalDate end, int count) {
        actor(jwt, false, RoleCode.GUEST);
        long nights = range(start, end, true);
        var p = property(id, false);
        if (p.getStatus() != PropertyStatus.PUBLISHED) throw fail(HttpStatus.NOT_FOUND, "Published property not found");
        if (count < 1 || count > p.getCapacity()) throw fail(HttpStatus.BAD_REQUEST, "Guest count exceeds capacity");
        return new Availability(p.getId(), p.getVersion(), start, end, count, free(id, start, end), nights, p.getNightlyRate(), total(p, nights), p.getCurrency());
    }

    @Transactional
    @PreAuthorize("hasRole('GUEST')")
    public BookingView book(Jwt jwt, UUID key, BookingRequest input) {
        var guest = actor(jwt, true, RoleCode.GUEST);
        var p = property(input.propertyId(), true);
        var existing = bookings.findByGuestIdAndRegistrationKey(guest.getId(), key);
        if (existing.isPresent()) {
            var b = existing.get();
            if (!b.getProperty().getId().equals(input.propertyId()) || !b.getCheckIn().equals(input.checkIn()) || !b.getCheckOut().equals(input.checkOut()) || b.getGuestCount() != input.guestCount() || b.getQuotedPropertyVersion() != input.propertyVersion())
                throw fail(HttpStatus.CONFLICT, "Registration key has different booking data");
            return view(b);
        }
        long nights = range(input.checkIn(), input.checkOut(), true);
        if (p.getStatus() != PropertyStatus.PUBLISHED || p.getVersion() != input.propertyVersion())
            throw fail(HttpStatus.CONFLICT, "Property or price changed. Check availability again");
        if (p.getHost().getId().equals(guest.getId()) || input.guestCount() > p.getCapacity())
            throw fail(HttpStatus.BAD_REQUEST, "Invalid guest count or owner booking");
        if (!free(p.getId(), input.checkIn(), input.checkOut()))
            throw fail(HttpStatus.CONFLICT, "These dates are no longer available");
        var b = new Booking();
        b.setProperty(p);
        b.setGuest(guest);
        b.setCheckIn(input.checkIn());
        b.setCheckOut(input.checkOut());
        b.setGuestCount(input.guestCount());
        b.setAppliedNightlyRate(p.getNightlyRate());
        b.setTotalAmount(total(p, nights));
        b.setCurrency(p.getCurrency());
        b.setStatus(BookingStatus.CONFIRMED);
        b.setRegistrationKey(key);
        b.setQuotedPropertyVersion(input.propertyVersion());
        b.setConfirmationCode(UUID.randomUUID());
        b.setConfirmedAt(Instant.now());
        bookings.saveAndFlush(b);
        record(b, guest, null, BookingStatus.CONFIRMED, "Booking registered");
        return view(b);
    }

    public PageResult<BookingView> bookingList(Jwt jwt, int page) {
        var u = actor(jwt, false, RoleCode.GUEST, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        var list = bookings.scoped(u.getRole().getCode() == RoleCode.GUEST ? u.getId() : null, u.getRole().getCode() == RoleCode.HOST ? u.getId() : null, page(page));
        var paymentMap = payments.findByBookingIdIn(list.getContent().stream().map(Booking::getId).toList()).stream().collect(Collectors.toMap(p -> p.getBooking().getId(), Function.identity()));
        return result(list, b -> BookingView.from(b, paymentMap.get(b.getId())));
    }

    public BookingView booking(Jwt jwt, Long id) {
        return view(owned(actor(jwt, false, RoleCode.GUEST, RoleCode.HOST, RoleCode.ADMINISTRATOR), id));
    }

    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public List<StatusHistoryView> statusHistory(Jwt jwt, Long id) {
        owned(actor(jwt, false, RoleCode.ADMINISTRATOR), id);
        return history.findByBookingIdOrderByChangedAtAscIdAsc(id).stream().map(StatusHistoryView::from).toList();
    }

    private void record(Booking b, User u, BookingStatus from, BookingStatus to, String comment) {
        var h = new BookingStatusHistory();
        h.setBooking(b);
        h.setChangedBy(u);
        h.setPreviousStatus(from);
        h.setNewStatus(to);
        h.setComment(comment);
        h.setChangedAt(Instant.now());
        history.save(h);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public BookingView status(Jwt jwt, Long id, StatusRequest input) {
        var admin = actor(jwt, true, RoleCode.ADMINISTRATOR);
        var initial = owned(admin, id);
        property(initial.getProperty().getId(), true);
        // Refresh after acquiring the common property lock; another operation may have committed while waiting.
        var b = bookings.findById(id).orElseThrow();
        refreshBooking(b);
        if (b.getVersion() != input.version()) throw fail(HttpStatus.CONFLICT, "Booking changed. Reload it");
        if (b.getStatus() == input.status()) return view(b);
        boolean valid = (b.getStatus() == BookingStatus.CONFIRMED && (input.status() == BookingStatus.IN_PROGRESS || input.status() == BookingStatus.CANCELLED)) || (b.getStatus() == BookingStatus.IN_PROGRESS && (input.status() == BookingStatus.COMPLETED || input.status() == BookingStatus.CANCELLED));
        if (!valid) throw fail(HttpStatus.CONFLICT, "This status transition is not allowed");
        var old = b.getStatus();
        b.setStatus(input.status());
        bookings.saveAndFlush(b);
        record(b, admin, old, input.status(), input.comment().strip());
        return view(b);
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private void refreshBooking(Booking b) {
        entityManager.refresh(b);
    }

    @Transactional
    @PreAuthorize("hasRole('GUEST')")
    public PaymentView pay(Jwt jwt, Long id, VersionRequest input) {
        var guest = actor(jwt, true, RoleCode.GUEST);
        var initial = owned(guest, id);
        property(initial.getProperty().getId(), true);
        var b = bookings.findById(id).orElseThrow();
        refreshBooking(b);
        var existing = payments.findByBookingId(id);
        if (existing.isPresent()) return PaymentView.from(existing.get());
        if (b.getVersion() != input.version() || !(b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.IN_PROGRESS))
            throw fail(HttpStatus.CONFLICT, "Booking changed or no longer accepts a payment");
        var p = new SimulatedPayment();
        p.setBooking(b);
        p.setReference(UUID.randomUUID());
        p.setStatus(PaymentStatus.APPROVED);
        p.setProcessedAt(Instant.now());
        return PaymentView.from(payments.saveAndFlush(p));
    }

    @PreAuthorize("hasRole('GUEST')")
    public PaymentView payment(Jwt jwt, Long id) {
        owned(actor(jwt, false, RoleCode.GUEST), id);
        return payments.findByBookingId(id).map(PaymentView::from).orElse(null);
    }

    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public PageResult<PaymentRecord> paymentList(Jwt jwt, int page) {
        actor(jwt, false, RoleCode.ADMINISTRATOR);
        return result(payments.findAll(page(page)), PaymentRecord::from);
    }

    @PreAuthorize("hasAnyRole('HOST','ADMINISTRATOR')")
    public PageResult<PropertyResponse> managedProperties(Jwt jwt, int page) {
        var u = actor(jwt, false, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        return result(u.getRole().getCode() == RoleCode.HOST ? properties.findAllByHostId(u.getId(), page(page)) : properties.findAll(page(page)), PropertyResponse::from);
    }

    @PreAuthorize("hasAnyRole('HOST','ADMINISTRATOR')")
    public CalendarView calendar(Jwt jwt, Long id, LocalDate start, LocalDate end) {
        var u = actor(jwt, false, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        var p = property(id, false);
        manage(u, p);
        range(start, end, false);
        return new CalendarView(id, start, end, blocks.calendar(id, start, end).stream().map(BlockView::from).toList(), bookings.occupied(id, start, end).stream().map(b -> new OccupiedRange(b.getCheckIn(), b.getCheckOut(), "BOOKING")).toList());
    }

    @Transactional
    @PreAuthorize("hasAnyRole('HOST','ADMINISTRATOR')")
    public BlockView block(Jwt jwt, Long id, BlockRequest input) {
        var u = actor(jwt, true, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        var p = property(id, true);
        manage(u, p);
        range(input.startDate(), input.endDate(), true);
        if (!free(id, input.startDate(), input.endDate()))
            throw fail(HttpStatus.CONFLICT, "The range overlaps a booking or an active block");
        var b = new AvailabilityBlock();
        b.setProperty(p);
        b.setCreatedBy(u);
        b.setStartDate(input.startDate());
        b.setEndDate(input.endDate());
        b.setReason(input.reason().strip());
        return BlockView.from(blocks.saveAndFlush(b));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('HOST','ADMINISTRATOR')")
    public BlockView deactivate(Jwt jwt, Long propertyId, Long id, VersionRequest input) {
        var u = actor(jwt, true, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        var p = property(propertyId, true);
        manage(u, p);
        var b = blocks.findById(id).filter(value -> value.getProperty().getId().equals(propertyId)).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Block not found"));
        if (u.getRole().getCode() == RoleCode.HOST && !b.getCreatedBy().getId().equals(u.getId()))
            throw fail(HttpStatus.FORBIDDEN, "Only administrators may remove administrative blocks");
        if (b.getVersion() != input.version()) throw fail(HttpStatus.CONFLICT, "Block changed. Reload it");
        if (b.isActive()) {
            b.setActive(false);
            b.setDeactivatedBy(u);
            b.setDeactivatedAt(Instant.now());
            blocks.saveAndFlush(b);
        }
        return BlockView.from(b);
    }

    private Map<String, Long> counts(List<Object[]> rows) {
        var map = new TreeMap<String, Long>();
        for (var r : rows) map.put(r[0].toString(), ((Number) r[1]).longValue());
        return map;
    }

    private Map<String, BigDecimal> amounts(List<Object[]> rows) {
        var map = new TreeMap<String, BigDecimal>();
        for (var r : rows) map.put(r[0].toString(), (BigDecimal) r[1]);
        return map;
    }

    @PreAuthorize("hasAnyRole('HOST','ADMINISTRATOR')")
    public Summary summary(Jwt jwt) {
        var u = actor(jwt, false, RoleCode.HOST, RoleCode.ADMINISTRATOR);
        Long host = u.getRole().getCode() == RoleCode.HOST ? u.getId() : null;
        var p = counts(properties.statusTotals(host));
        var b = counts(bookings.statusTotals(host));
        return new Summary(p.values().stream().mapToLong(Long::longValue).sum(), p, b.values().stream().mapToLong(Long::longValue).sum(), b, bookings.upcoming(host, LocalDate.now(LIMA)), blocks.activeCount(host), payments.scopedCount(host), amounts(bookings.amountTotals(host)), amounts(payments.amountTotals(host)));
    }
}

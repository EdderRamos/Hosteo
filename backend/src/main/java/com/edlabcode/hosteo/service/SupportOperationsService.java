package com.edlabcode.hosteo.service;
import com.edlabcode.hosteo.entity.*;
import com.edlabcode.hosteo.repository.*;
import static com.edlabcode.hosteo.operations.OperationsContracts.*;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @RequiredArgsConstructor @Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
@PreAuthorize("hasRole('SUPPORT')")
public class SupportOperationsService {
 private final BookingRepository bookings; private final SimulatedPaymentRepository payments; private final PropertyRepository properties; private final AvailabilityBlockRepository blocks;
 public record OperationalInfo(Instant generatedAt,LocalDate today,long properties,Map<String,Long> propertiesByStatus,long bookings,Map<String,Long> bookingsByStatus,long upcomingArrivals,long activeBlocks) {}
 public PageResult<BookingView> search(Long id,UUID code,String email,int page){
  var result=bookings.supportSearch(id,code,email.strip(),PageRequest.of(page,10,Sort.by(Sort.Order.desc("createdAt"),Sort.Order.desc("id"))));
  var paymentMap=new HashMap<Long,SimulatedPayment>();for(var p:payments.findByBookingIdIn(result.getContent().stream().map(Booking::getId).toList()))paymentMap.put(p.getBooking().getId(),p);
  return new PageResult<>(result.map(b->BookingView.from(b,paymentMap.get(b.getId()))).getContent(),result.getTotalElements(),page,result.getTotalPages());
 }
 private Booking find(Long id){return bookings.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Booking not found"));}
 public BookingView booking(Long id){return BookingView.from(find(id),payments.findByBookingId(id).orElse(null));}
 public PaymentView payment(Long id){find(id);return payments.findByBookingId(id).map(PaymentView::from).orElse(null);}
 private Map<String,Long> counts(List<Object[]> rows){var map=new TreeMap<String,Long>();for(var row:rows)map.put(row[0].toString(),((Number)row[1]).longValue());return map;}
 public OperationalInfo summary(){var p=counts(properties.statusTotals(null));var b=counts(bookings.statusTotals(null));var today=LocalDate.now(ZoneId.of("America/Lima"));return new OperationalInfo(Instant.now(),today,p.values().stream().mapToLong(Long::longValue).sum(),p,b.values().stream().mapToLong(Long::longValue).sum(),b,bookings.upcoming(null,today),blocks.activeCount(null));}
}

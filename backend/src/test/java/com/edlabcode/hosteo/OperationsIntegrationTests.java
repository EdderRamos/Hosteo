package com.edlabcode.hosteo;

import com.edlabcode.hosteo.entity.*;
import com.edlabcode.hosteo.repository.*;
import com.edlabcode.hosteo.service.TokenService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.*;
import java.net.*;
import java.net.http.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT) @ActiveProfiles("test")
class OperationsIntegrationTests {
 @LocalServerPort int port;
 @Autowired UserRepository users; @Autowired RoleRepository roles; @Autowired PropertyRepository properties;
 @Autowired BookingRepository bookings; @Autowired AvailabilityBlockRepository blocks; @Autowired SimulatedPaymentRepository payments;
 @Autowired BookingStatusHistoryRepository history; @Autowired PropertyReviewRepository reviews; @Autowired TokenService tokens;
 final ObjectMapper mapper=new ObjectMapper(); final HttpClient client=HttpClient.newHttpClient();
 User host,guest,otherGuest,admin,otherHost,support; Property property;
 LocalDate start=LocalDate.now(ZoneId.of("America/Lima")).plusDays(20),end=start.plusDays(2);
 @BeforeEach void prepare() {
  payments.deleteAll();history.deleteAll();bookings.deleteAll();blocks.deleteAll();reviews.deleteAll();properties.deleteAll();users.deleteAll();
  for(var code:RoleCode.values()) if(roles.findByCode(code).isEmpty()){var r=new Role();r.setCode(code);roles.save(r);}
  host=user("host",RoleCode.HOST);guest=user("guest",RoleCode.GUEST);otherGuest=user("otherGuest",RoleCode.GUEST);admin=user("admin",RoleCode.ADMINISTRATOR);otherHost=user("otherHost",RoleCode.HOST);support=user("support",RoleCode.SUPPORT);
  property=property(host);
 }
 User user(String name,RoleCode role){var u=new User();u.setFirstName(name);u.setLastName("Test");u.setEmail(name.toLowerCase()+"@test.local");u.setPasswordHash("unused-test-password-hash");u.setRole(roles.findByCode(role).orElseThrow());u.setActive(true);return users.saveAndFlush(u);}
 Property property(User host){var p=new Property();p.setHost(host);p.setTitle("Real test apartment");p.setDescription("Apartment description");p.setType(PropertyType.APARTMENT);p.setAddress("Street 123");p.setCity("Lima");p.setDistrict("Miraflores");p.setCapacity(4);p.setBedrooms(1);p.setBeds(2);p.setBathrooms(1);p.setNightlyRate(new BigDecimal("100.00"));p.setCurrency("PEN");p.setStatus(PropertyStatus.PUBLISHED);p.setPublishedAt(Instant.now());p.setRegistrationKey(UUID.randomUUID());return properties.saveAndFlush(p);}
 HttpResponse<String> call(String method,String path,Object body,User user,String key)throws Exception{var b=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v1"+path)).timeout(Duration.ofSeconds(15)).header("Content-Type","application/json");if(user!=null)b.header("Authorization","Bearer "+tokens.issue(user));if(key!=null)b.header("Idempotency-Key",key);b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)));return client.send(b.build(),HttpResponse.BodyHandlers.ofString());}
 JsonNode ok(HttpResponse<String> r){assertEquals(200,r.statusCode(),r.body());return mapper.readTree(r.body());}
 Map<String,Object> stay(Property p,LocalDate in,LocalDate out){return Map.of("propertyId",p.getId(),"propertyVersion",p.getVersion(),"checkIn",in.toString(),"checkOut",out.toString(),"guestCount",2);}
 String availablePath(Property p,LocalDate in,LocalDate out){return "/guest/properties/"+p.getId()+"/availability?checkIn="+in+"&checkOut="+out+"&guestCount=2";}
 @Test void essentialBookingPaymentAndManagementJourney()throws Exception{
  assertEquals(1,ok(call("GET","/catalog/properties",null,null,null)).get("total").asInt());
  var block=ok(call("POST","/host/properties/"+property.getId()+"/blocks",Map.of("startDate",start.toString(),"endDate",end.toString(),"reason","Maintenance"),host,null));
  assertFalse(ok(call("GET",availablePath(property,start,end),null,guest,null)).get("available").asBoolean());
  assertEquals(409,call("POST","/guest/bookings",stay(property,start,end),guest,UUID.randomUUID().toString()).statusCode());
  ok(call("PATCH","/host/properties/"+property.getId()+"/blocks/"+block.get("id").asLong()+"/deactivate",Map.of("version",0),host,null));
  assertTrue(ok(call("GET",availablePath(property,start,end),null,guest,null)).get("available").asBoolean());
  String key=UUID.randomUUID().toString();var reservation=ok(call("POST","/guest/bookings",stay(property,start,end),guest,key));long id=reservation.get("id").asLong();
  assertEquals("CONFIRMED",reservation.get("status").asText());assertEquals(200,reservation.get("totalAmount").asInt());assertNotNull(reservation.get("confirmationCode"));
  assertEquals(id,ok(call("POST","/guest/bookings",stay(property,start,end),guest,key)).get("id").asLong());assertEquals(1,bookings.count());
  assertEquals(409,call("POST","/guest/bookings",stay(property,end,end.plusDays(1)),guest,key).statusCode());
  assertEquals(404,call("GET","/guest/bookings/"+id,null,otherGuest,null).statusCode());
  assertEquals(404,call("GET","/host/bookings/"+id,null,otherHost,null).statusCode());
  assertEquals(1,ok(call("GET","/guest/bookings",null,guest,null)).get("total").asInt());assertEquals(1,ok(call("GET","/host/bookings",null,host,null)).get("total").asInt());assertEquals(1,ok(call("GET","/admin/bookings",null,admin,null)).get("total").asInt());
  var payment=ok(call("POST","/guest/bookings/"+id+"/payment",Map.of("version",0,"amount",1),guest,null));assertEquals("APPROVED",payment.get("status").asText());assertEquals(200,payment.get("amount").asInt());
  assertEquals(payment,ok(call("POST","/guest/bookings/"+id+"/payment",Map.of("version",0),guest,null)));assertEquals(1,payments.count());
  assertEquals(payment,ok(call("GET","/guest/bookings/"+id+"/payment",null,guest,null)));assertEquals(1,ok(call("GET","/admin/payments",null,admin,null)).get("total").asInt());
  var summary=ok(call("GET","/host/operations/summary",null,host,null));assertEquals(1,summary.get("bookings").asInt());assertEquals(200,summary.get("paidAmountByCurrency").get("PEN").asInt());
  assertEquals(0,ok(call("GET","/host/operations/summary",null,otherHost,null)).get("bookings").asInt());
  var progress=ok(call("PATCH","/admin/bookings/"+id+"/status",Map.of("version",0,"status","IN_PROGRESS","comment","Check-in"),admin,null));
  assertEquals("IN_PROGRESS",progress.get("status").asText());assertEquals(409,call("PATCH","/admin/bookings/"+id+"/status",Map.of("version",0,"status","COMPLETED","comment","Stale"),admin,null).statusCode());
  var cancelled=ok(call("PATCH","/admin/bookings/"+id+"/status",Map.of("version",progress.get("version").asLong(),"status","CANCELLED","comment","Cancelled"),admin,null));assertEquals("CANCELLED",cancelled.get("status").asText());
  assertTrue(ok(call("GET",availablePath(property,start,end),null,guest,null)).get("available").asBoolean());assertEquals(3,ok(call("GET","/admin/bookings/"+id+"/history",null,admin,null)).size());
  assertEquals(1,ok(call("GET","/admin/operations/summary",null,admin,null)).get("payments").asInt());assertEquals("APPROVED",ok(call("GET","/guest/bookings/"+id,null,guest,null)).get("payment").get("status").asText());
  var administrative=ok(call("POST","/admin/properties/"+property.getId()+"/blocks",Map.of("startDate",start.toString(),"endDate",end.toString(),"reason","Administrative closure"),admin,null));
  assertEquals(403,call("PATCH","/host/properties/"+property.getId()+"/blocks/"+administrative.get("id").asLong()+"/deactivate",Map.of("version",0),host,null).statusCode());
  ok(call("PATCH","/admin/properties/"+property.getId()+"/blocks/"+administrative.get("id").asLong()+"/deactivate",Map.of("version",0),admin,null));
 }
 @Test void essentialPermissionDatePriceAndStateGuards()throws Exception{
  assertEquals(401,call("GET",availablePath(property,start,end),null,null,null).statusCode());assertEquals(403,call("GET","/admin/bookings",null,guest,null).statusCode());assertEquals(403,call("GET","/host/bookings",null,support,null).statusCode());
  assertEquals(404,call("GET","/host/properties/"+property.getId()+"/calendar?startDate="+start+"&endDate="+end,null,otherHost,null).statusCode());
  assertEquals(400,call("POST","/guest/bookings",stay(property,start,start),guest,UUID.randomUUID().toString()).statusCode());
  assertEquals(400,call("POST","/guest/bookings",stay(property,start,end),guest,null).statusCode());
  assertEquals(400,call("GET","/guest/properties/"+property.getId()+"/availability?checkIn="+start+"&checkOut="+end+"&guestCount=5",null,guest,null).statusCode());
  property.setNightlyRate(new BigDecimal("120.00"));property=properties.saveAndFlush(property);
  var stale=new HashMap<>(stay(property,start,end));stale.put("propertyVersion",0);
  assertEquals(409,call("POST","/guest/bookings",stale,guest,UUID.randomUUID().toString()).statusCode());
  var b=ok(call("POST","/guest/bookings",stay(property,start,end),guest,UUID.randomUUID().toString()));long id=b.get("id").asLong();
  assertEquals(404,call("POST","/guest/bookings/"+id+"/payment",Map.of("version",0),otherGuest,null).statusCode());
  assertEquals(409,call("PATCH","/admin/bookings/"+id+"/status",Map.of("version",0,"status","COMPLETED","comment","Skip check-in"),admin,null).statusCode());
  ok(call("PATCH","/admin/bookings/"+id+"/status",Map.of("version",0,"status","CANCELLED","comment","Cancel"),admin,null));assertEquals(409,call("POST","/guest/bookings/"+id+"/payment",Map.of("version",1),guest,null).statusCode());
  var draft=property(otherHost);draft.setStatus(PropertyStatus.DRAFT);draft=properties.saveAndFlush(draft);assertEquals(404,call("GET","/catalog/properties/"+draft.getId(),null,null,null).statusCode());
  var visible=ok(call("GET","/catalog/properties/"+property.getId(),null,null,null));assertFalse(visible.has("reviewComment"));assertFalse(visible.has("hostId"));
 }
 @Test void essentialConcurrentCrossingAndAdjacentDates()throws Exception{
  var executor=Executors.newFixedThreadPool(2);try{
   var go=new CountDownLatch(1);var first=executor.submit(()->{go.await();return call("POST","/guest/bookings",stay(property,start,end),guest,UUID.randomUUID().toString());});var second=executor.submit(()->{go.await();return call("POST","/guest/bookings",stay(property,start,end),otherGuest,UUID.randomUUID().toString());});go.countDown();int a=first.get(15,TimeUnit.SECONDS).statusCode(),b=second.get(15,TimeUnit.SECONDS).statusCode();assertTrue((a==200&&b==409)||(a==409&&b==200));assertEquals(1,bookings.count());
   ok(call("POST","/guest/bookings",stay(property,end,end.plusDays(1)),guest,UUID.randomUUID().toString()));
   var another=property(host);var race=new CountDownLatch(1);var reservation=executor.submit(()->{race.await();return call("POST","/guest/bookings",stay(another,start,end),guest,UUID.randomUUID().toString());});var block=executor.submit(()->{race.await();return call("POST","/admin/properties/"+another.getId()+"/blocks",Map.of("startDate",start.toString(),"endDate",end.toString(),"reason","Concurrent maintenance"),admin,null);});race.countDown();a=reservation.get(15,TimeUnit.SECONDS).statusCode();b=block.get(15,TimeUnit.SECONDS).statusCode();assertTrue((a==200&&b==409)||(a==409&&b==200));assertEquals(1,bookings.conflicts(another.getId(),start,end)+blocks.conflicts(another.getId(),start,end));
  }finally{executor.shutdownNow();}
 }
}

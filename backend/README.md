# Backend de Hosteo

Base de servicios REST con Java 21 y Spring Boot 4.1.1. El SRS aportado menciona Spring Boot 3.x; se conserva la versión 4.1.1 que ya estaba en el proyecto.

## Dependencias

- Spring Web MVC: controladores REST y serialización JSON.
- Bean Validation: validación de DTO con `@Valid`, `@NotBlank`, etc.
- Spring Data JPA / Hibernate: entidades, repositorios y transacciones.
- PostgreSQL JDBC: conexión a la base de datos del proyecto.
- springdoc-openapi 3.1.1: OpenAPI y Swagger UI, compatible con Spring Boot 4.
- Actuator: endpoint de salud, sin exponer detalles internos.
- Lombok y DevTools: utilidades de desarrollo ya presentes.
- Starters de pruebas de MVC, validación y JPA; H2 exclusivamente para pruebas.

Spring provides `@Service` and `@Transactional`. HU-01 implements JWT authentication and role-based authorization using Spring Security.

## Ejecución

La conexión local a Neon se guarda en `backend/.env`, excluido de Git. Spring carga ese archivo automáticamente al ejecutar desde `backend/`, mediante `spring.config.import` con formato de propiedades. Contiene `DB_URL`, `DB_USERNAME` y `DB_PASSWORD`. Usar entradas `CLAVE=valor` sin `export` ni comillas; la URL JDBC mantiene SSL y channel binding obligatorios. No versionar este archivo. Para ejecutar con esta configuración basta con `./mvnw spring-boot:run`. El archivo `.env.example` sirve de plantilla sin credenciales reales.

Crear previamente la base PostgreSQL `hosteo` y un usuario con acceso. Configurar las variables sin guardar secretos en el repositorio:

```sh
export DB_URL='jdbc:postgresql://localhost:5432/hosteo'
export DB_USERNAME='hosteo'
export DB_PASSWORD='tu-contraseña-local'
./mvnw spring-boot:run
```

Ejecutar desde `backend/` con JDK 21 o superior. Hibernate valida el esquema (`ddl-auto=validate`); no crea ni modifica tablas automáticamente. Antes de incorporar entidades se deberá versionar el esquema correspondiente.

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- Salud: http://localhost:8080/actuator/health

Swagger mostrará las operaciones cuando se agreguen controladores. La configuración actual requiere PostgreSQL para iniciar normalmente.

## Pruebas

```sh
./mvnw test
```

Las pruebas utilizan H2 en memoria y no requieren PostgreSQL. H2 permite verificar el contexto y la infraestructura; no sustituye las pruebas futuras de consultas y concurrencia en PostgreSQL.

## HU-01 authentication

The backend follows controller, service, repository and entity layers. DTOs define the API contract. Spring Security validates HS256 bearer tokens issued by the login service. Passwords use BCrypt. Authentication is stateless; tokens are supplied through the Authorization header, never cookies.

`POST /api/v1/auth/login` accepts `email` and `password` and returns `accessToken` and `user` with `id`, `email`, `firstName`, `lastName` and numeric `roleId`; no role name or token metadata is returned by login. `GET /api/v1/auth/me` requires `Authorization: Bearer <token>`.

`GET /api/v1/auth/me` returns the user identity and a numeric `roleId`. JWT claims also use numeric `roleId`; role names are resolved internally for authorization. Internal roles are `ADMINISTRATOR`, `SUPPORT`, `HOST` and `GUEST`. Database tables, columns and role codes use English names. Role-specific route prefixes are `/api/v1/admin/`, `/api/v1/support/`, `/api/v1/host/` and `/api/v1/guest/`. Account status and role are checked against the database on each authenticated request. Inactive accounts and invalid credentials return the same 401 response.

Set `JWT_SECRET` in `.env` to a random secret of at least 32 bytes. Tokens expire after 30 minutes. Swagger supports the bearer token through Authorize. No refresh-token endpoint is included. Registration is implemented separately in HU-02.

Flyway applies `V1__create_authentication_tables.sql` on startup. It creates `roles` and `users` and seeds only the four roles. No default users or passwords are created. An existing active user with a BCrypt password hash is required to log in. Accounts can be created through HU-02 registration.

The integration tests create isolated accounts in H2. They cover all four roles, invalid credentials, inactive accounts, input validation, malformed requests, missing/tampered/expired tokens, administrative route restrictions and invalidation after account or role changes. PostgreSQL migrations must also be verified against the target database before deployment.

## HU-02 registration

`POST /api/v1/auth/register/guest` registers a guest and `POST /api/v1/auth/register/host` registers a host. Both endpoints are public and accept `email`, `password`, `firstName`, `lastName` and optional `phone`. The controller selects the role; the request has no `roleId`. Both account types are stored in `users` with the corresponding foreign key to `roles`. Internal roles cannot be assigned through public registration.

Passwords must contain at least 8 characters and fit within BCrypt’s 72-byte UTF-8 limit. Email is normalized to lowercase, names and phone are trimmed, and the account is active on creation. The database unique email constraint protects concurrent registrations as well as the initial duplicate check.

A successful request returns HTTP 201 with `id`, `email`, `firstName`, `lastName` and `roleId`. The user then signs in through `/api/v1/auth/login`. Duplicate email returns HTTP 409; invalid fields or a forbidden role return HTTP 400. No password hash or access token is returned by registration. No database migration is required because the existing users schema supports this flow.

```json
{
  "email": "guest@example.com",
  "password": "YourPassword123!",
  "firstName": "Alex",
  "lastName": "Smith",
  "phone": "+51999999999"
}
```

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

Ejecutar desde `backend/` con JDK 21 o superior. El `.env` local usa `DB_DDL_AUTO=update` para conservar datos. Con `DB_DDL_AUTO=create`, Hibernate recrea las tablas mapeadas en cada arranque y elimina sus datos. `BOOTSTRAP_ROLES=true` carga los cuatro roles. La configuración predeterminada sin estas variables valida el esquema existente.

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

Hibernate manages the development schema through `DB_DDL_AUTO=create`. Every startup recreates mapped tables and deletes their data. `BOOTSTRAP_ROLES=true` seeds the four roles without creating accounts. Use `DB_DDL_AUTO=update` to preserve development data across ordinary restarts. Defaults outside local configuration are `validate` and role bootstrap disabled. No Flyway dependency or migrations remain.

The integration tests create isolated accounts in H2. They cover all four roles, invalid credentials, inactive accounts, input validation, malformed requests, missing/tampered/expired tokens, administrative route restrictions and invalidation after account or role changes. Schema changes must be reviewed before production deployment.

## HU-02 registration

`POST /api/v1/auth/register` is the single public registration endpoint. It accepts `email`, `password`, `firstName`, `lastName`, and optional `phone`. Every account starts as a guest. The client cannot choose a role. Becoming a host is a separate future flow for the same account.

Email must be unique. Passwords are hashed with BCrypt and limited to 72 UTF-8 bytes.

Success returns 201 with the user identity and numeric `roleId`. Invalid input returns 400; duplicate email returns 409. Sign in separately through `/api/v1/auth/login`. No default users are created.

Local development uses `DB_DDL_AUTO=update` to create missing columns and preserve accounts. The fallback remains `validate`. The existing four roles must be present in the database.

## HU-03 customer profile

`GET /api/v1/customer/profile` reads the authenticated profile. `PUT /api/v1/customer/profile` replaces editable fields and returns the saved profile. Both require a bearer token and the GUEST or HOST role. Identity is taken from the token; no user ID is accepted in the path or payload.

Fields: `firstName`, `lastName`, `email`, `phone`, `gender`, `dateOfBirth`, `biography`, `occupation`, `location`, `avatarUrl`, `languages`, `interests`, `version`. Names and email are required. Optional scalar fields may be null to clear them. Lists are required and may be empty. Each language has `code` such as `es` or `en` and `proficiency`: BASIC, INTERMEDIATE, ADVANCED or NATIVE. Gender values are FEMALE, MALE, NON_BINARY, OTHER and PREFER_NOT_TO_SAY.

Biography is limited to 500 characters, dates of birth must be in the past, avatar URLs must use HTTPS, and duplicate languages/interests are rejected. Avatar files must already be uploaded; this endpoint stores a URL only. Email remains unique and normalized. Verification of contact details is not implemented by this endpoint.

Use the `version` returned by GET to save changes. Stale versions return 409 PROFILE_CONFLICT. Role, activation state, password, membership date and user ID are not editable. Profile updates and collections are saved transactionally. Hibernate update adds the profile columns and `user_languages`/`user_interests` tables in local development.

El perfil usa `GET` y `PUT /api/v1/customer/profile`. La edición de foto está temporalmente deshabilitada: `avatarUrl` sigue disponible en la respuesta para mostrar una foto existente, pero no forma parte de `UpdateProfileRequest` y el servicio conserva su valor al actualizar los demás datos.

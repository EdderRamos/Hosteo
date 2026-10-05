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

## HU-03 personal profile

`GET /api/v1/profile` reads the authenticated profile. `PUT /api/v1/profile` replaces editable fields and returns the saved profile. Both require a bearer token and accept all four roles: GUEST, HOST, ADMINISTRATOR and SUPPORT. Identity is taken from the token; no user ID is accepted in the path or payload.

Fields: `firstName`, `lastName`, `email`, `phone`, `gender`, `dateOfBirth`, `biography`, `occupation`, `location`, `languages`, `interests`, `version`. Names and email are required. Optional scalar fields may be null to clear them. Lists are required and may be empty. Each language has `code` such as `es` or `en` and `proficiency`: BASIC, INTERMEDIATE, ADVANCED or NATIVE. Gender values are FEMALE, MALE, NON_BINARY, OTHER and PREFER_NOT_TO_SAY.

Biography is limited to 500 characters, dates of birth must be in the past, and duplicate languages/interests are rejected. Avatar URLs are returned for display and preserved on update; photo editing is disabled. Email remains unique and normalized. Verification of contact details is not implemented by this endpoint.

Use the `version` returned by GET to save changes. Stale versions return 409 PROFILE_CONFLICT. Role, activation state, password, membership date and user ID are not editable. Profile updates and collections are saved transactionally. Hibernate update adds the profile columns and `user_languages`/`user_interests` tables in local development.

El perfil usa `GET` y `PUT /api/v1/profile`. La edición de foto está temporalmente deshabilitada: `avatarUrl` sigue disponible en la respuesta para mostrar una foto existente, pero no forma parte de `UpdateProfileRequest` y el servicio conserva su valor al actualizar los demás datos.

## HU-05: portal de personal y asignación de roles

El prefijo `/api/v1/hosteo` comparte el portal entre `ADMINISTRATOR` y `SUPPORT`. Los cuatro roles son independientes: `GUEST`, `HOST`, `ADMINISTRATOR` y `SUPPORT`. No existe un quinto rol ni una agrupación de huéspedes y anfitriones.

| Método y ruta | Permiso | Contrato |
| --- | --- | --- |
| GET `/api/v1/hosteo/summary` | Administrador/Soporte | Totales separados de huéspedes, anfitriones, administradores y soporte, incluyendo inactivas |
| GET `/api/v1/hosteo/roles` | Administrador/Soporte | Códigos de los cuatro roles |
| GET `/api/v1/hosteo/users?query=&page=0` | Administrador/Soporte | `items`, `total`, `page`, `pages`; 10 cuentas por página, búsqueda por email/nombres/apellidos |
| PATCH `/api/v1/hosteo/users/{id}/role` | Solo Administrador | `{ "roleCode": "SUPPORT", "version": 3 }`; devuelve la cuenta actualizada |

Las respuestas de usuarios incluyen ID, nombres, email, código de rol, estado activo y versión; nunca hashes. El actor no puede cambiar su propio rol. La versión desactualizada devuelve 409; una cuenta inexistente, 404; rol inválido o payload incompleto, 400. Se bloquean actor y destino en orden de ID dentro de una transacción y se revalida que el actor siga siendo administrador activo.

Aplicar `backend/database/migrations/001_user_role_revision.sql` antes de arrancar contra un esquema PostgreSQL existente. La migración añade `users.role_revision` sin cambiar roles ni cuentas; ya se aplicó a la base configurada durante esta implementación. No se configura ejecución automática de migraciones en este cambio. H2 crea el campo mediante JPA en las pruebas.

El JWT y las respuestas de login/me ahora incluyen, respectivamente, `roleRevision` y `roleCode`. Cada reasignación efectiva incrementa la revisión e invalida tokens anteriores, incluso si después se restaura el rol inicial. Los JWT emitidos antes de este cambio requieren iniciar sesión nuevamente. La invalidación se aplica en la siguiente solicitud autenticada; no existe notificación push ni un nuevo token enviado a la cuenta afectada. Se necesita una cuenta administrativa provisionada previamente; el registro público continúa creando únicamente huéspedes.

## HU-06: activación y desactivación de usuarios

`PATCH /api/v1/hosteo/users/{id}/status` recibe `{ "active": false, "version": 3 }` y devuelve `StaffUserResponse` actualizado, con `Cache-Control: no-store`. `active` y `version` son obligatorios; `active: true` reactiva la cuenta. Solo `ADMINISTRATOR` puede escribir; soporte conserva consulta. No se permite modificar el acceso de la cuenta propia, para evitar que el administrador se desactive.

El servicio bloquea actor y destino en orden de ID, comprueba que el actor siga activo, con rol administrativo y con la revisión del JWT vigente, y valida la versión del destino. Un cambio concurrente de rol o estado devuelve 409; una cuenta inexistente, 404; datos inválidos o cambio propio, 400. Una solicitud con el estado actual y la versión vigente no incrementa revisión ni versión.

La desactivación conserva datos y relaciones históricas. Login y cada petición autenticada rechazan cuentas inactivas. Cada cambio efectivo de `active` incrementa la revisión de sesión existente (`role_revision` / claim `roleRevision`); su nombre procede de HU-05 y ahora también cubre cambios de acceso. Así, reactivar la cuenta no revive tokens anteriores: se requiere iniciar sesión de nuevo. La invalidación se verifica en la siguiente petición autenticada, sin notificación push.

No requiere una nueva migración: reutiliza `users.active` y la columna de HU-05. No se modificaron estados de cuentas reales durante esta implementación. Las pruebas cubren los cuatro roles, reactivación, JWT antiguos, datos preservados, estado sin cambios, permisos, cuenta propia, validación y conflicto concurrente entre cambio de rol y estado.

## Alineación con los cuatro roles

`UserProfileController` y `UserProfileService` reemplazan los nombres anteriores del perfil. `GET/PUT /api/v1/profile` atiende únicamente al usuario del JWT y permite gestionar el perfil personal a los cuatro roles (HU-03). La respuesta incluye `roleCode`; el PUT no puede asignar roles ni modificar el estado activo. El endpoint anterior se retiró y no se mantiene como alias.

El resumen de personal devuelve `{ "guests": 0, "hosts": 0, "administrators": 0, "support": 0 }`, sin agregar huésped y anfitrión en un solo grupo. `/api/v1/guest/**`, `/api/v1/host/**`, `/api/v1/admin/**` y `/api/v1/support/**` conservan permisos independientes. `/api/v1/hosteo/**` continúa compartido exclusivamente por administrador y soporte, con escrituras limitadas al administrador.

No se cambia ningún rol existente ni el esquema de datos: el modelo ya usa los cuatro códigos. Tras renombrar clases, ejecutar una compilación limpia para eliminar clases antiguas del directorio generado `target`. Esto alinea las funcionalidades existentes; propiedades, calendario, reservas y pagos siguen pendientes según las HUs documentadas.

## HU-07: host property registration

Apply `database/migrations/002_properties.sql` before starting against an existing PostgreSQL schema. It creates property storage, constraints and indexes, including a unique host/registration-key pair. Migration execution is manual; the migration was applied to the configured local database during implementation.

`POST /api/v1/host/properties` requires an active HOST bearer token and a UUID `Idempotency-Key` header. Fields: `title` (150), `description` (5000), `type` (APARTMENT/HOUSE/ROOM), `address` (255), `city`/`district` (100), `capacity`/`beds` (integer >=1), `bedrooms`/`bathrooms` (integer >=0), `nightlyRate` (0.01 through 9999999999.99, at most two decimals), `currency` (PEN/USD). Text fields are required and trimmed. Ownership comes from the JWT; status is always DRAFT.

Creation returns 201, the persisted property and its `Location`. An identical retry with the same key returns 200 and the same record; a different payload with that key returns 409. A transaction locks the host account and rechecks active status, role and session revision before saving. Validation returns 400, missing/invalid sessions 401, other roles 403.

`GET /api/v1/host/properties/{id}` returns the authenticated host's property for confirmation and reload. Missing and foreign properties both return 404. Both endpoints return `Cache-Control: no-store`. Listing, editing, photos, submission for review and publication are separate stories.

The 19 backend tests pass with H2, covering server ownership, DRAFT status, input/header validation, role and active-account restrictions, foreign-property access, duplicate retries and conflicting registration keys. PostgreSQL migration and local OpenAPI endpoints were verified separately; browser responses were simulated without creating test properties in the real database.

## HU-08: consultar propiedades del anfitrión

`GET /api/v1/host/properties?page=0` requiere HOST activo y devuelve `{ items, total, page, pages }`, diez propiedades por página, ordenadas por creación descendente e ID descendente para desempatar. `items` usa `PropertyResponse`, incluyendo estado, tarifa, ubicación y fecha de registro. La consulta filtra siempre por el ID del JWT; no acepta un anfitrión elegido por el cliente. No requiere migración adicional.

Páginas negativas o inválidas devuelven 400; sin sesión válida, 401; otros roles, 403. Una página fuera del resultado devuelve items vacío conservando total y pages. Las respuestas usan no-store. Las pruebas verifican aislamiento entre anfitriones, paginación, orden, estados, cuentas desactivadas y permisos.

## HU-09: editar información de una propiedad

`PUT /api/v1/host/properties/{id}` requiere HOST activo. Recibe los mismos campos principales y validaciones del registro más `version` obligatoria, entera y no negativa, obtenida del GET. La propiedad se busca por ID y anfitrión autenticado; una propiedad ajena o inexistente devuelve 404. La respuesta 200 incluye los datos persistidos y `Cache-Control: no-store`.

Se bloquean la cuenta del anfitrión y la propiedad en una transacción, se revalidan el acceso y la revisión del JWT y se comprueba la versión. Una versión desactualizada devuelve 409 sin sobrescribir datos. La edición preserva identidad, propietario, fecha de creación, clave de registro y estado; no agrega transiciones de aprobación o publicación que HU-09 no define. Una escritura idéntica con versión vigente no incrementa la versión. No requiere migración adicional.

Las pruebas verifican edición, persistencia, validación, aislamiento, conflictos, permisos y cuentas inactivas. Desde HU-10, PENDING_REVIEW bloquea la edición; los demás estados se conservan al editar. No se editaron propiedades reales para probar el flujo.


## HU-10: solicitud de validación

`POST /api/v1/host/properties/{id}/submit` recibe `{ "version": 0 }`, obligatoria y no negativa. Solo el HOST activo propietario puede enviar. Devuelve 200 con PropertyResponse, estado PENDING_REVIEW y `submittedAt`, usando no-store. DRAFT y REJECTED permiten enviar; PUBLISHED devuelve 409. Enviar no publica: la decisión administrativa corresponde a HU-11/HU-12.

La transacción bloquea cuenta y propiedad, revalida rol, estado de cuenta y revisión de sesión, compara versión y valida la información principal persistida conforme a HU-07. Una versión desactualizada devuelve 409, datos incompletos 400, una propiedad ajena/inexistente 404 y otros roles 403. Se conserva información, propietario y fecha de creación; se actualizan estado, fecha de envío y versión. El PUT rechaza cualquier edición mientras PENDING_REVIEW para mantener estable la información enviada.

Un reintento sobre PENDING_REVIEW acepta la versión actual o la inmediatamente anterior al envío y devuelve el mismo registro sin cambiar fechas ni versión. Una versión más antigua da 409. No existe publicación automática ni validación de fotos/documentos no definidos en esta HU.

Aplicar `database/migrations/003_property_submission.sql` antes de arrancar con un esquema existente. Añade submitted_at si falta, de forma compatible con 002_properties.sql que ya incluía la columna. Fue aplicada a la base PostgreSQL configurada sin modificar propiedades reales. No hay ejecución automática de migraciones.

Verificación: 24 pruebas backend con H2, incluyendo reenvío tras rechazo, reintentos, permisos, integridad, información incompleta, bloqueo de edición y envío concurrente con edición. La revisión del navegador usa respuestas simuladas.

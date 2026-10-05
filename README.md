# Documentación técnica de Hosteo

![Logo de Hosteo](	https://hosteo.pe/logo-horizontal.png)

**Proyecto:** sistema web de gestión de propiedades y reservas para Hosteo S.A.C.  
**Fecha:** 5 de octubre de 2026.  
**Alcance:** documentación general del código disponible en el repositorio y del esquema PostgreSQL consultado en esta sesión de trabajo. Las funcionalidades descritas no equivalen a una certificación de todos los criterios de aceptación.

## 1. Objetivo y alcance

Hosteo es un MVP académico para administrar alojamientos de corta estadía. Integra cuentas, perfiles, propiedades, publicación mediante revisión administrativa, catálogo, disponibilidad, reservas, pagos simulados y consultas operativas. Sus actores son huésped, anfitrión, administrador y soporte.

La planificación de referencia contiene HU-01 a HU-39. Las integraciones productivas con Airbnb, Hostaway, PriceLabs y pasarelas bancarias reales quedan fuera del MVP. Los pagos registrados por el sistema son demostrativos.

## 2. Arquitectura

![Arquitectura del proyecto Hosteo](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnyJKeIR3yoXDEUXapKElufbgOP5sf1dhngEiHjoW5KC1H18HaNz8LKo0&s=10)

El frontend presenta las pantallas y consume una API REST mediante JSON. El backend autentica, autoriza, valida las operaciones y accede a PostgreSQL mediante JPA/Hibernate. Neon aloja la base utilizada para desarrollo. Swagger publica el contrato de la API y Actuator ofrece un endpoint de salud.

El backend utiliza capas `controller`, `service`, `repository`, `entity` y `dto`, con paquetes adicionales `config`, `security`, `exception` y `operations`. Este último concentra controladores, contratos y servicios de calendario, reservas, pagos y resúmenes. Los controladores reciben solicitudes; los servicios contienen reglas y transacciones; los repositorios acceden a datos; las entidades representan tablas; y los DTO delimitan campos de entrada y salida.

El frontend separa páginas, componentes, funcionalidades, consumo HTTP compartido y estilos. React Router resuelve navegación; React Hook Form y Zod validan formularios; TanStack Query gestiona consultas del servidor en los flujos que lo utilizan.

## 3. Tecnologías

| Componente | Tecnología observada |
| --- | --- |
| Backend | Java 21 como versión objetivo, Spring Boot 4.1.1 |
| API y seguridad | Spring MVC, Bean Validation, Spring Security, JWT HS256 |
| Persistencia | Spring Data JPA, Hibernate, PostgreSQL JDBC, Neon |
| Documentación y salud | springdoc-openapi 3.1.1, Actuator |
| Frontend | React 19, TypeScript 6, Vite 8, React Router 8 |
| Formularios | React Hook Form, Zod |
| Datos del servidor | TanStack Query 5 |
| Herramientas | Maven Wrapper, npm, Git |
| Pruebas disponibles | JUnit/Spring Boot, H2, Vitest, Testing Library |

Las versiones exactas y transitivas deben comprobarse en `backend/pom.xml`, `frontend/package.json` y `frontend/package-lock.json`. El SRS menciona Spring Boot 3.x y MySQL; el código actual usa Spring Boot 4.1.1 y PostgreSQL según decisiones posteriores del proyecto.

## 4. Organización del repositorio

```text
hosteo/
├── backend/
│   ├── src/main/java/com/edlabcode/hosteo/
│   │   ├── controller/  service/  repository/
│   │   ├── entity/  dto/  config/  security/
│   │   └── exception/  operations/
│   ├── src/main/resources/application.properties
│   ├── src/test/
│   ├── database/migrations/
│   ├── pom.xml
│   └── .env.example
├── frontend/
│   ├── src/pages/  src/features/  src/components/
│   ├── src/shared/  src/styles/  src/assets/
│   ├── src/routes.tsx
│   ├── package.json
│   └── .env.example
└── development/
    ├── docs/contexto/
    ├── database/current/
    └── documentation/
```

`development/` contiene referencias y documentación local y está excluido de Git. Los archivos `.env` almacenan configuración privada; las plantillas `.env.example` pueden versionarse. No se incluyen credenciales reales en este documento.

## 5. Pantallas del proyecto

### Inicio de sesión

![Pantalla real de inicio de sesión de Hosteo](images/login.png)

Captura del frontend local sin sesión. El formulario solicita correo y contraseña, muestra errores y permite recordar la sesión. Consume `POST /api/v1/auth/login`. La autenticación devuelve `accessToken` y `user`.

### Registro

![Pantalla real de registro de Hosteo](images/register.png)

Captura del frontend local. Se utiliza un único registro público; todas las cuentas comienzan como huéspedes. El backend acepta nombres, apellidos, correo, contraseña y teléfono opcional. No solicita DNI, tipo de documento ni selección de rol.

Estas capturas ilustran pantallas públicas reales. No se crearon cuentas ni se alteraron registros para producirlas. Los portales privados requieren una cuenta autorizada; no se presentan imágenes con usuarios o cifras inventados.

## 6. Autenticación y autorización

Las contraseñas se almacenan con BCrypt. El backend firma JWT HS256 y valida emisor y vencimiento. La configuración actual establece una vigencia de 30 minutos. Cada solicitud protegida envía `Authorization: Bearer <token>`.

El conversor de autenticación consulta la cuenta y comprueba que esté activa, que `roleId` coincida y que `roleRevision` siga vigente. Los cambios de rol o acceso invalidan tokens anteriores mediante esta revisión. Las respuestas actuales de identidad incluyen `roleId` y `roleCode`; el frontend usa el código para dirigir al portal correspondiente sin asumir IDs fijos.

| Rol | Funciones principales del código actual |
| --- | --- |
| GUEST | Perfil propio, catálogo, disponibilidad, reservas propias y pago simulado |
| HOST | Perfil propio, propiedades propias, calendario, bloqueos, reservas de sus propiedades y resumen |
| ADMINISTRATOR | Usuarios, roles, estado de cuentas, validación de propiedades, reservas, pagos y operación general |
| SUPPORT | Consulta del portal de usuarios; no modifica roles ni estados |

La autorización se aplica mediante rutas y reglas de servicios. Las operaciones sensibles verifican además la propiedad del recurso. Desactivar una cuenta conserva sus datos. El registro público no crea administradores ni soporte; actualmente no hay un flujo autónomo para convertirse en anfitrión.

El frontend guarda el token en `sessionStorage` o, al recordar la sesión, en `localStorage`. No almacena contraseñas. La restauración consulta `/auth/me`; cerrar sesión elimina el almacenamiento. Recordar la sesión no amplía la vigencia del token. No hay refresh token. Los cambios de rol y estado se aplican en el servidor, no solo en la interfaz.

## 7. API REST

Prefijo general: `/api/v1`. El contrato más detallado, DTO y parámetros se encuentran en Swagger y los controladores. La siguiente tabla resume los endpoints del código actual.

| Método | Ruta | Función |
| --- | --- | --- |
| POST | `/auth/register` | Registro público como huésped |
| POST | `/auth/login` | Autenticación |
| GET | `/auth/me` | Identidad autenticada |
| GET / PUT | `/profile` | Consulta y actualización del perfil propio |
| GET | `/hosteo/users` | Búsqueda y paginación de usuarios |
| GET | `/hosteo/summary`, `/hosteo/roles` | Totales y roles del portal interno |
| PATCH | `/hosteo/users/{id}/role` | Asignación administrativa de rol |
| PATCH | `/hosteo/users/{id}/status` | Activación o desactivación |
| GET / POST | `/host/properties` | Propiedades propias y creación |
| GET / PUT | `/host/properties/{id}` | Consulta y edición de una propiedad propia |
| POST | `/host/properties/{id}/submit` | Envío a validación |
| GET | `/hosteo/properties/pending` | Listado de propiedades pendientes |
| GET | `/hosteo/properties/pending/{id}` | Detalle de revisión |
| POST | `/hosteo/properties/pending/{id}/decision` | Aprobar o rechazar |
| GET | `/catalog/properties`, `/catalog/properties/{id}` | Catálogo público y detalle |
| GET | `/guest/properties/{id}/availability` | Disponibilidad y cotización |
| POST | `/guest/bookings` | Registrar reserva con `Idempotency-Key` |
| GET | `/guest/bookings`, `/host/bookings`, `/admin/bookings` | Reservas según rol y propiedad |
| GET | Las rutas anteriores más `/{id}` | Detalle de reserva autorizado |
| POST / GET | `/guest/bookings/{id}/payment` | Registrar o consultar pago simulado |
| PATCH | `/admin/bookings/{id}/status` | Cambio de estado de reserva |
| GET | `/admin/bookings/{id}/history` | Historial de cambios |
| GET | `/admin/payments` | Listado administrativo de pagos |
| GET | `/host/managed-properties`, `/admin/managed-properties` | Propiedades administrables |
| GET | `/host/properties/{id}/calendar`, `/admin/properties/{id}/calendar` | Calendario |
| POST | `/host/properties/{id}/blocks`, `/admin/properties/{id}/blocks` | Crear bloqueo |
| PATCH | `/host/properties/{propertyId}/blocks/{id}/deactivate` y equivalente `/admin` | Desactivar bloqueo |
| GET | `/host/operations/summary`, `/admin/operations/summary` | Indicadores operativos |

### Ejemplo de registro

```json
{
  "email": "guest@example.com",
  "password": "YourPassword123!",
  "firstName": "Alex",
  "lastName": "Smith",
  "phone": "+51999999999"
}
```

Devuelve HTTP 201 con la identidad. Correo duplicado devuelve 409; campos inválidos devuelven 400. El usuario inicia sesión por separado; el registro no entrega automáticamente un token.

### Perfil personal

El endpoint vigente es `/api/v1/profile`, no el antiguo prefijo `/customer/profile`. Está habilitado para los cuatro roles y toma la identidad del token. Los campos editables incluyen nombres, correo, teléfono, género, fecha de nacimiento, biografía, ocupación, ubicación, idiomas e intereses. El PUT requiere la `version` obtenida del GET para detectar cambios concurrentes.

La biografía admite hasta 500 caracteres. Las colecciones de idiomas e intereses se almacenan separadamente. El contrato actual de actualización no admite `avatarUrl`; la interfaz mantiene deshabilitada la edición de foto y conserva la existente.

## 8. Propiedades, disponibilidad y reservas

Las propiedades usan estados DRAFT, PENDING_REVIEW, PUBLISHED y REJECTED. Solo las publicadas aparecen en el catálogo. El anfitrión administra recursos propios y el administrador decide la publicación. Las revisiones se conservan en su historial.

Los rangos de estadía usan entrada incluida y salida excluida: `[checkIn, checkOut)`. Esto permite una nueva entrada el día de salida de otra reserva. El servicio valida un rango ordenado de hasta 366 noches, capacidad y fechas conforme a `America/Lima`.

Al reservar se bloquea la propiedad, se revalidan disponibilidad, bloqueos, precio y versión, y se guarda dentro de una transacción. `Idempotency-Key` identifica un intento: repetir la misma clave y datos devuelve la reserva existente; reutilizarla con datos diferentes produce conflicto. La reserva conserva tarifa y moneda históricas.

Las reservas tienen estados CONFIRMED, IN_PROGRESS, COMPLETED y CANCELLED. Los cambios administrativos registran historial. Un pago simulado se asocia a una reserva válida; el servicio devuelve el pago existente cuando ya está registrado. No se recopilan datos bancarios ni se efectúa un cobro real.

## 9. Base de datos

La consulta de metadatos realizada el 5 de octubre identificó 11 tablas: diez de negocio y una técnica.

| Tabla | Responsabilidad |
| --- | --- |
| `roles` | Catálogo de roles |
| `users` | Cuenta, acceso y perfil |
| `user_languages` | Idiomas y nivel |
| `user_interests` | Intereses del perfil |
| `properties` | Alojamiento, propietario, tarifa y publicación |
| `property_reviews` | Decisiones de validación |
| `availability_blocks` | Rangos no reservables |
| `bookings` | Reserva, huésped, fechas y precio histórico |
| `booking_status_history` | Seguimiento de estados |
| `simulated_payments` | Pago demostrativo por reserva |
| `flyway_schema_history` | Registro técnico anterior de migraciones |

La tabla técnica persiste aunque no exista dependencia activa de Flyway. También hay scripts SQL manuales en `backend/database/migrations/`; su presencia no significa ejecución automática. Las fotos y comodidades del modelo inicial no aparecen como tablas en el esquema consultado.

Los diseños exportados de la base están disponibles en [modelo lógico](../database/current/logical.dbml), [modelo físico](../database/current/physical.dbml) y [DDL reconstruido](../database/current/physical.sql). Estos archivos son una fotografía del esquema, no un respaldo de registros ni un procedimiento completo de restauración.

## 10. Configuración y ejecución local

Se necesita un JDK compatible con la versión objetivo 21 y Node compatible con las dependencias instaladas. El README del frontend documenta el requisito de React Router de Node 22.22.0 o superior. npm usa el lockfile; Maven Wrapper gestiona la compilación del backend.

### Backend

Desde `backend/`, crear `.env` a partir de `.env.example` y configurar:

| Variable | Uso |
| --- | --- |
| `DB_URL` | URL JDBC PostgreSQL; en Neon debe conservar los parámetros TLS requeridos |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciales privadas |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 bytes |
| `DB_DDL_AUTO` | Gestión del esquema: validate, update o create |
| `BOOTSTRAP_ROLES` | Inicialización de los cuatro roles |

```sh
./mvnw compile -Dmaven.test.skip=true
./mvnw spring-boot:run -Dmaven.test.skip=true
```

El fallback de Hibernate es `validate`; la plantilla del repositorio propone `create`. `create` elimina los datos de tablas mapeadas al arrancar. Para desarrollo con datos que deban conservarse, configurar `update`; antes de producción, utilizar un esquema versionado y validación. No copiar la configuración de desarrollo directamente a producción.

Swagger: `http://localhost:8080/swagger-ui/index.html`. OpenAPI: `/v3/api-docs`. Salud: `/actuator/health`.

### Frontend

Desde `frontend/`:

```sh
npm ci
npm run dev
```

La variable `VITE_API_URL` usa `/api/v1` por defecto en la plantilla. Vite redirige `/api` hacia `http://localhost:8080`. En despliegue se necesita un proxy equivalente o una configuración explícita de CORS; el proxy de desarrollo no se publica con los archivos estáticos.

```sh
npm run build
```

Genera los archivos de producción en `frontend/dist/`. No configura por sí solo alojamiento, TLS, dominio ni acceso a la API.

## 11. Verificación y mantenimiento

El repositorio contiene pruebas de autenticación y operaciones del backend y pruebas de formularios, sesión y funcionalidades del frontend. Los comandos disponibles son `./mvnw test`, `npm run test`, `npm run lint` y `npm run build`.

No se ejecutaron pruebas en esta tarea de documentación. Las capturas verifican únicamente las pantallas públicas y no prueban registro, reservas o pagos contra Neon. Las referencias a pruebas anteriores en los README no se presentan como una validación nueva.

Mantener contratos de DTO, esquema y frontend sincronizados. Después de modificar la API, revisar Swagger. En cambios concurrentes de perfil, usuario o propiedad se debe recargar la versión tras un 409. Ante 401, descartar la sesión y solicitar nuevo login. No registrar contraseñas, tokens o secretos en logs.

## 12. Funciones pendientes y límites

- Recuperación de contraseña: existe pantalla; no hay servicio real de recuperación.
- Fotografías de propiedades: el catálogo actual usa marcadores; no existe un contrato completo de carga y asociación de imágenes.
- Conversión autónoma de huésped a anfitrión: no está implementada; el rol puede ser asignado por administración.
- Catálogo: el controlador inspeccionado publica listado paginado y detalle; no se atribuyen filtros de servidor que no están presentes en su contrato.
- Reportes: existen resúmenes e indicadores; no se declara una exportación completa de reportes por la sola presencia de esos resúmenes.
- Soporte: la consulta de usuarios está disponible; no se consideran completadas todas las consultas de soporte del backlog sin verificar sus endpoints.
- Integraciones externas y pagos bancarios: excluidos del MVP.
- No se afirma disponibilidad comercial, cumplimiento legal o pruebas completas de las 39 HU con base únicamente en pantallas o código.

## 13. Fuentes del proyecto

La documentación se elaboró con `backend/pom.xml`, `frontend/package.json`, ambos README, `frontend/src/routes.tsx`, controladores y servicios del backend, DTO, configuración de seguridad y exportación de metadatos PostgreSQL. Los documentos académicos aportados están en `development/docs/contexto/` y constituyen la referencia de alcance; las decisiones posteriores del usuario prevalecen sobre versiones anteriores.

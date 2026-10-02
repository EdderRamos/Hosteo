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

Spring incluye `@Service` y `@Transactional`; no requieren una biblioteca adicional. La autenticación y autorización por roles se implementarán al trabajar el módulo de usuarios; esta base todavía no implementa seguridad.

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

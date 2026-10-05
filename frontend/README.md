# Hosteo Frontend

Landing y flujo de autenticación de Hosteo, construidos con React 19, TypeScript y Vite 8.

## Pantallas

- `/` y `/home`: redirigen al portal correspondiente al rol.
- `/guest`: listado real de propiedades publicadas.
- `/host`: home del anfitrión, con propiedades, reservas, disponibilidad y resumen.
- `/hosteo`: portal de administrador y soporte, con permisos distintos.
- `/profile`: perfil personal para los cuatro roles.
- `/login`: inicio de sesión.
- `/register`: registro de cuenta conectado a la API.
- `/forgot-password`: recuperación de acceso.

## Desarrollo local

El catálogo consulta propiedades publicadas del backend; ya no muestra alojamientos de ejemplo ni simula disponibilidad. El recorrido de reserva requiere una sesión de huésped y comprueba capacidad, precio vigente y cruces de fechas en el servidor. Los pagos son exclusivamente simulados. Las propiedades todavía no tienen contrato de fotos: las tarjetas usan un marcador visual, sin atribuir fotografías de ejemplo a alojamientos reales.


La implementación inicial del catálogo reutilizaba fotografías de ejemplo; el catálogo real usa marcadores hasta contar con fotografías de cada propiedad. El logo usa el asset único de Hosteo aportado por el usuario.

```bash
npm ci
npm run dev
```

## Verificaciones

```bash
npm run lint
npm run test
npm run build
```

Login, registro y reservas consumen la API real. La recuperación conserva el flujo visual local.

## HU-01: inicio de sesión

`/login` implementa el diseño Figma `94:3`, dentro de “HU 1: Login” (`94:2`), del archivo `AT6w9KgP54VcNwXZ9m7tXR`. Usa la fotografía original, Playfair Display e Inter; la versión móvil se infiere del desktop. React Hook Form y Zod validan campos antes de enviar credenciales a `POST /api/v1/auth/login`.

El login consume el contrato real (`accessToken`, `user` y `roleId` numérico). Muestra errores de validación, credenciales, red, permisos y servicio, bloquea envíos duplicados y permite mostrar/ocultar contraseña. No hay cuentas ni éxitos simulados en login o registro. La recuperación aún no tiene API.

Vite redirige `/api` al backend local en el puerto 8080. Ver `.env.example` para `VITE_API_URL`; en producción se requiere proxy del hosting o una API que permita CORS. Iniciar el backend desde `backend/` conforme a su README. No se crean usuarios de prueba en la base real: iniciar sesión requiere una cuenta activa con contraseña BCrypt.

La sesión usa `sessionStorage` normalmente y `localStorage` solo si el usuario elige mantenerla activa. Solo persiste el bearer token, nunca la contraseña. Respeta `exp` y revalida con `/auth/me` al recargar o volver a la pestaña; la firma y permisos los valida el backend. Cerrar sesión limpia ambos almacenes. No hay refresh token: la opción de recordar no prolonga los 30 minutos de vigencia. El almacenamiento web está sujeto al riesgo de XSS; una futura sesión mediante cookie HttpOnly requiere cambiar el contrato del backend.

Tras autenticar se muestra confirmación y acceso al inicio existente. No se inventan equivalencias entre IDs de rol ni paneles que aún no están implementados; el acceso a funcionalidades por rol se completará junto con sus módulos. No se declara todo HU-01 validado de extremo a extremo sin una prueba con cuenta real.

Excepciones al Figma: campos inicialmente vacíos, sin credenciales de ejemplo; se omiten la etiqueta “Production”, afirmaciones de TLS y licencias no verificadas, RUC y enlaces legales sin destinos proporcionados. Se mantiene un único enlace al registro público: el backend crea únicamente huéspedes, sin selector de roles. Las fuentes se cargan desde Google Fonts y requieren conexión.

Verificación:

```bash
npm run lint
npm run test
npm run build
```

Pruebas de formulario, fallos HTTP/red, envío en curso, persistencia, expiración y rechazo de sesión por backend. Las respuestas HTTP de estas pruebas son simuladas, no una validación de credenciales contra producción. React Router instalado requiere Node >=22.22.0; el entorno observado usa 22.20.0 y emite ese aviso aunque las verificaciones pasan.

## HU-02: registro de huésped

`/register` implementa las versiones desktop y móvil de “HU2: Registro Huesped” (`94:143`) del mismo archivo Figma, con su fotografía original. El formulario usa React Hook Form y Zod y envía `POST /api/v1/auth/register` con `firstName`, `lastName`, `email` y `password`. No envía rol ni confirmación de contraseña. Todas las cuentas comienzan como huéspedes y deben iniciar sesión tras la creación; no se genera un token automáticamente.

El formulario separa nombres y apellidos. Por solicitud del usuario, se retiraron tipo y número de documento de la interfaz, validaciones y payload. El backend aún los exige: el registro real puede devolver 400 hasta que se actualice el endpoint; no se envían valores ficticios para evitarlo. La contraseña sigue el diseño (ocho caracteres, mayúscula y número) y respeta el límite BCrypt de 72 bytes UTF-8. La confirmación debe coincidir.

El registro muestra carga, errores de campos, correo duplicado, errores de red y confirmación solo después de una respuesta válida del servidor. Conserva entradas ante fallos, impide envíos repetidos y permite mostrar/ocultar ambos campos de contraseña. No guarda datos de registro en almacenamiento web. No se incluyen textos de conexión cifrada que no estén verificados en el entorno.

La imagen `src/assets/hosteo-logo.png`, aportada por el usuario, es el logo único. El componente `Brand` la reutiliza en inicio, login, registro, recuperación y footer; el favicon usa el mismo asset. En fondos oscuros se presenta sobre un soporte claro, sin recolorear ni sustituir el logo. Se conserva su resolución original (151×40).

La implementación inicial fue validada con 22 pruebas de frontend, lint y build; revisión visual a 375, 430, 768, 1024, 1280 y 1448 px sin desbordamientos ni errores JavaScript. Las pruebas HTTP usan respuestas simuladas. Una prueba real de alta e inicio de sesión requiere backend activo y datos autorizados; no se crearon cuentas en la base real durante esta implementación.

## HU-03: perfil personal y sesión en home

`/home` muestra el usuario autenticado y permite abrir `/profile` o cerrar sesión. Un login exitoso navega al home. El token conserva el mecanismo de sesión existente: `sessionStorage` por defecto, `localStorage` al marcar mantener sesión, restauración por `/auth/me` y expiración del JWT. No se guardan contraseñas ni datos del perfil en esos almacenes.

`/profile` reproduce la estructura de la captura aportada: identidad, datos básicos, biografía, ocupación, ubicación, idiomas, intereses y contacto. Consulta `GET /api/v1/profile` y guarda con `PUT` al mismo endpoint, con bearer token y la versión recibida. Solo actualiza el nombre en el encabezado tras confirmar el guardado. Permite descartar cambios, reintentar carga y conserva el formulario ante errores o conflictos de versión. Un 401 limpia la sesión. El perfil personal está autorizado para los cuatro roles.

La edición de foto está temporalmente deshabilitada. El formulario y el PUT no incluyen `avatarUrl`; el servicio conserva la foto existente. Los controles para añadir idiomas e intereses se despliegan desde las opciones del diseño. Los datos vacíos permanecen vacíos, sin inventar la identidad de la captura. El diseño móvil se infiere del desktop. La revisión del flujo usa respuestas HTTP simuladas; validar persistencia en la base real requiere iniciar sesión con una cuenta existente y guardar desde la interfaz.

## HU-05: portal Hosteo

`/hosteo` es el home compartido del personal `ADMINISTRATOR` y `SUPPORT`. Login y la ruta raíz usan `roleCode` recibido del backend para decidir el portal, sin asumir IDs fijos. `/guest` contiene el catálogo del huésped; `/home` redirige según el rol. Al restaurar una sesión se espera la respuesta de `/auth/me` antes de resolver navegación.

El portal adapta la referencia visual aportada: cabecera con cuenta, navegación lateral, tarjetas de cuentas y tabla de asignación. En móvil las filas se convierten en tarjetas con todos sus controles visibles. La información de usuarios y totales proviene de `/api/v1/hosteo`; no hay mocks activos en la aplicación. La búsqueda se envía al confirmar el formulario y la lista usa paginación de servidor.

Administrador puede seleccionar GUEST, HOST, SUPPORT o ADMINISTRATOR para otra cuenta y confirmar el cambio. La interfaz advierte del permiso administrativo y de la invalidación de sesión, impide doble envío y permite recargar ante un conflicto de versión. Soporte comparte la vista con acceso de consulta. La cuenta propia se muestra protegida. La autorización efectiva permanece en el backend.

Los módulos de propiedades, calendario, recepción y liquidaciones se indican como pendientes. No se reproducen cifras operativas, alertas ni aprobaciones ficticias de la referencia fuera de HU-05. Se conserva el logo existente y se usan iniciales para la cuenta sin inventar una foto personal.

Verificación de HU-05: lint y build aprobados; 31 pruebas frontend y 11 backend. Revisión de navegador con respuestas simuladas en 375, 430, 768, 1024, 1280 y 1440 px, asignación confirmada y soporte sin controles de edición. Las pruebas reales de permisos del backend usan H2. La migración PostgreSQL se aplicó y el backend local publica los cuatro endpoints en OpenAPI; no se reasignaron cuentas reales para probar la interfaz.

## HU-06: control de acceso de cuentas

La tabla de `/hosteo` incorpora **Gestionar acceso**: “Desactivar” para cuentas activas y “Activar” para inactivas. Solo aparece para el administrador; la cuenta propia está protegida. Se conservan los colores, tipografía, espaciados, tarjetas móviles y estados del portal existente, siguiendo `development/docs/contexto/frontend.md` y la referencia visual aportada para el home del personal.

Antes de enviar se confirma el usuario y la consecuencia: bloquear acceso conservando datos, o permitir un nuevo login. La confirmación recibe foco y Cancelar lo devuelve al control que la abrió. Durante el envío se deshabilitan acciones para evitar duplicados. El estado se recarga desde la API tras confirmar el guardado; los errores y conflictos no muestran un éxito ficticio. Un 401 elimina la sesión y lleva a login; 403 muestra el rechazo del servidor.

Integración real con `PATCH /api/v1/hosteo/users/{id}/status`, enviando bearer token, estado deseado y versión recibida. No hay simulación de esta operación en la aplicación. Soporte puede ver los estados y no dispone de controles de rol ni de activación.

Verificación: lint, 36 pruebas frontend y build; 14 pruebas backend con H2. Revisión del portal en navegador con respuestas HTTP simuladas a 375, 430, 768, 1024, 1280 y 1440 px: sin desbordamiento de página ni errores JavaScript; activación, desactivación, cancelación con retorno de foco y consulta de soporte verificadas. No se activaron ni desactivaron cuentas reales para esta revisión.

## Navegación y permisos por los cuatro roles

- `GUEST`: `/guest`, con catálogo de ejemplo y navegación del huésped. El catálogo también es visible sin sesión, como en la vista pública existente.
- `HOST`: `/host`, con identidad y acceso a su perfil; propiedades, calendario y reservas del anfitrión se indican expresamente como pendientes.
- `ADMINISTRATOR`: `/hosteo`, con gestión de roles y estado de cuentas.
- `SUPPORT`: `/hosteo`, con consulta de cuentas y sin controles administrativos.

Login, `/` y la ruta anterior `/home` usan una única función `homePath` basada en `roleCode`. Un usuario autenticado que intenta entrar al portal de otro rol vuelve al suyo. Administrador y soporte comparten el diseño de personal, conservando permisos distintos; huésped y anfitrión ya no se agrupan.

Se renombraron `GuestHomePage`, `GuestHeader`, `GuestCatalog`, estilos, selectores y pruebas del catálogo. Los códigos, labels y destinos de los cuatro roles se centralizan en `src/shared/auth/roles.ts`. El perfil común usa `AccountHeader` y `GET/PUT /api/v1/profile`, sin asumir que todos los usuarios son huéspedes. El portal de personal muestra huéspedes y anfitriones en tarjetas separadas y sus selectores usan los cuatro nombres de rol.

Esta migración no declara terminado todo el MVP: el catálogo sigue siendo una demostración y los módulos del anfitrión no implementan aún sus operaciones de negocio.

Verificación de esta migración: 44 pruebas frontend, lint y build aprobados; 16 pruebas backend aprobadas tras `./mvnw clean test`. Revisión en navegador con respuestas simuladas: navegación y perfil para los cuatro roles; portal de personal y anfitrión en seis tamaños de 375 a 1440 px; catálogo del huésped en móvil. Sin errores JavaScript ni desbordamientos de página. No se modificaron cuentas ni códigos de rol en PostgreSQL.

## HU-07: registro de propiedad del anfitrión

`/host` permite abrir `/host/properties/new`. Solo HOST accede al formulario: título, descripción, tipo (departamento/casa/habitación), dirección, ciudad, distrito, huéspedes, habitaciones, camas, baños, tarifa por noche y moneda PEN/USD. Se siguen los colores, tipografías y componentes existentes; no se recibió un frame específico para esta HU.

React Hook Form y Zod validan antes del envío; TanStack Query administra creación y consulta. Se conservan los datos ante errores, se deshabilita el formulario durante el guardado y se reutiliza `Idempotency-Key` al reintentar los mismos datos. La confirmación `/host/properties/:id` muestra datos persistidos, se puede recargar y confirma que la propiedad queda como borrador sin publicación. Los datos no se guardan en almacenamiento web. Un 401 termina la sesión.

La aplicación consume POST y GET reales de `/api/v1/host/properties`. El listado, la edición y el envío a validación se integran en HU-08 a HU-10; las fotos y la publicación administrativa corresponden a flujos posteriores. El catálogo ahora integra propiedades publicadas mediante el flujo operativo documentado al final.

Verificación: lint, build y 55 pruebas frontend aprobadas; pruebas de permisos, validación, errores, reintento idempotente y confirmación. Las respuestas HTTP del frontend se simulan; las pruebas del backend verifican persistencia y seguridad con H2.

## HU-08: mis propiedades

`/host/properties`, accesible desde el portal del anfitrión y la confirmación de registro, consulta la API real del listado. Presenta título, tipo, ubicación, capacidad, tarifa, fecha y los estados Borrador, Pendiente de revisión, Publicada y Rechazada. Cada tarjeta abre su información guardada; “Actualizar estados” consulta nuevamente el servidor. La paginación de diez registros usa `page` en la URL y TanStack Query con claves separadas por sesión y página.

Incluye carga, lista vacía, recuperación de errores y retorno a la primera página cuando no hay resultados en la página elegida. Solo HOST accede; un 401 termina la sesión. Se reutiliza la estética de HU-07 y se infiere la adaptación móvil, sin un frame específico aportado para HU-08. Pruebas de navegador con HTTP simulado verificaron seis anchos de 375 a 1440 px, actualización, detalle y recarga sin desbordamientos ni errores JavaScript.

## HU-09: edición de propiedades

Desde las tarjetas o el detalle se abre `/host/properties/:id/edit`. El formulario reutiliza los campos y el diseño de HU-07, carga los datos actuales por GET y guarda por PUT con su versión. Solo confirma el guardado tras validar la respuesta. Conserva entradas ante fallos, bloquea envíos repetidos y permite cancelar sin escribir. Las consultas de lista se invalidan tras guardar.

Un conflicto 409 mantiene los cambios locales y bloquea otro guardado hasta que el anfitrión elija “Descartar cambios y recargar”. Se informa que esa acción descartará sus cambios. El formulario no recarga automáticamente al recuperar foco o conexión para evitar perder entradas. Un 401 cierra la sesión; una propiedad ajena o inexistente muestra no encontrada. Desde HU-10 la edición queda bloqueada durante la revisión. Desde HU-12, modificar información publicada la devuelve a borrador para solicitar validación nuevamente; una escritura sin cambios mantiene la publicación.

La revisión de navegador, con respuestas HTTP simuladas, verificó edición, guardado, recarga y cancelación en seis anchos de 375 a 1440 px sin desbordamientos ni errores JavaScript. No se proporcionó un frame específico de HU-09; se mantiene la estética existente.


## HU-10: envío a validación

Las propiedades Borrador y Rechazada ofrecen “Enviar a validación” en el listado y el detalle. Una confirmación identifica el alojamiento, explica que el envío no lo publica y advierte que no podrá editarse durante la revisión. Recibe foco de teclado; Cancelar y Escape cierran la confirmación y devuelven foco al control de origen. El envío bloquea controles duplicados, guarda por POST con la versión consultada y confirma únicamente una respuesta válida PENDING_REVIEW con fecha de envío.

Tras enviar se actualizan el detalle y el listado. Pendiente de revisión y Publicada no ofrecen envío; la ruta de edición también bloquea propiedades en revisión. Los errores permiten reintentar; un conflicto ofrece actualizar el estado, y un 401 termina la sesión. La fecha de envío aparece en el detalle. No se requieren fotos ni documentos para esta operación: la HU y el SRS no definen esos requisitos; se comprueba la información principal de HU-07.

Verificación: 83 pruebas frontend, lint y build; navegador con respuestas HTTP simuladas en seis anchos de 375 a 1440 px, confirmación, cancelación, envío, recarga y bloqueo de edición, sin desbordamientos ni errores JavaScript. Se reutiliza el diseño existente, sin un frame específico aportado para HU-10.

## HU-11: bandeja administrativa de propiedades

El administrador accede desde el panel y la navegación a `/hosteo/properties/pending`. La tabla adapta el portal existente y la referencia aportada: propiedad, anfitrión, distrito, tarifa por noche, fecha de envío, estado y enlace al expediente. En móvil conserva la información en tarjetas. Los endpoints reales se consultan con TanStack Query y validación Zod; las claves separan sesión y página. Solo se aceptan registros PENDING_REVIEW con identidad de anfitrión coherente.

`/hosteo/properties/pending/:id` permite consultar descripción, tipo, dirección, ciudad, distrito, distribución, tarifa, fecha de registro/envío e identidad del anfitrión. Ambas pantallas permiten actualizar, recuperarse de errores y recargar por URL. La bandeja pagina diez solicitudes, de la más antigua a la más reciente, con página en la URL. La lista vacía y una solicitud que salió de revisión muestran mensajes explícitos. Un 401 termina la sesión. Huésped, anfitrión y soporte no acceden ni muestran enlaces a la bandeja; la consulta de soporte corresponde a HU-34.

Se reutilizan cabecera y navegación del portal del personal. La consulta de HU-11 no modifica estados; HU-12 añade la aprobación y el rechazo desde el expediente. No se incluyen cifras, fotos ni documentos ficticios; los adjuntos requieren su contrato propio.

Verificación: 95 pruebas frontend, lint y build; navegador con respuestas HTTP simuladas para bandeja y detalle en 375, 430, 768, 1024, 1280 y 1440 px, paginación, actualización y recarga sin desbordamientos ni errores JavaScript. La adaptación móvil sigue los patrones existentes; no se aportó un frame específico adicional para HU-11.


## HU-12: aprobar o rechazar una propiedad

El expediente ofrece “Aprobar propiedad” y “Rechazar propiedad”, con confirmación explícita y la versión consultada. La aprobación cambia el estado a Publicada; el rechazo requiere un motivo de hasta 1000 caracteres. Ambas decisiones muestran confirmación solo tras validar la respuesta persistida, retiran la propiedad de pendientes y bloquean envíos repetidos. Cancelar/Escape no escriben y devuelven foco al control de origen. Los errores conservan el comentario; un conflicto ofrece actualizar el expediente y un 401 termina la sesión.

El anfitrión consulta el motivo del rechazo y la fecha de publicación en su detalle. Puede corregir y reenviar una propiedad rechazada. Editar información de una publicada advierte que se retirará la publicación; el backend la devuelve a borrador y exige el flujo de validación nuevamente. El flujo operativo integra el listado/detalle mínimo de propiedades publicadas necesario para reservar; fotos, búsqueda avanzada y filtros adicionales conservan sus historias específicas.

Verificación: 104 pruebas frontend, lint y build aprobados. Navegador con respuestas simuladas para confirmación en seis anchos de 375 a 1440 px, aprobación, rechazo, validación del motivo, salida de la bandeja y consulta del motivo por el anfitrión, sin desbordamientos ni errores JavaScript. Se conserva el diseño del portal existente.


## HU-17 a HU-31: disponibilidad, reservas, pagos y resúmenes

| Rol | Rutas |
| --- | --- |
| Huésped | `/guest`, `/guest/properties/:id`, `/guest/bookings`, `/guest/bookings/:id` |
| Anfitrión | `/host/operations`, `/host/properties/:id/calendar`, `/host/bookings`, `/host/bookings/:id` |
| Administrador | `/hosteo/operations`, `/hosteo/properties/:id/calendar`, `/hosteo/bookings`, `/hosteo/bookings/:id`, `/hosteo/payments` |

HU-17/HU-18 permiten consultar rangos de ocupación y crear/desactivar bloqueos, conservando el registro. El anfitrión solo gestiona propiedades propias y no puede retirar un bloqueo creado por el administrador. Las fechas usan `[inicio, fin)`: el día de salida no ocupa una noche. Los formularios advierten de ese límite y no admiten cruces con reservas o bloqueos activos. Una confirmación precede a las escrituras; recibe foco, permite Escape/Cancelar y bloquea envíos repetidos.

HU-19 a HU-22 seleccionan llegada/salida/huéspedes, consultan disponibilidad y precio, confirman el total y registran una reserva CONFIRMED con código único. El servidor vuelve a validar todo al guardar. Cambiar fechas o capacidad invalida la cotización de la interfaz; un conflicto exige consultar de nuevo. Los reintentos conservan Idempotency-Key para evitar duplicados. La confirmación se recupera por GET al recargar, sin basarse en una pantalla ficticia de éxito.

HU-23 a HU-26 ofrecen listas paginadas y detalle por rol. El administrador puede avanzar Confirmada → En curso → Completada, o cancelar una Confirmada/En curso, con motivo, confirmación y control de versión. Los estados finales no se reabren. Se muestra el historial. Cancelar libera las fechas y conserva la reserva y sus datos.

HU-27 a HU-29 registran cero o un pago por reserva, siempre por su total histórico y moneda. La simulación se confirma como aprobada, sin tarjetas, datos bancarios ni pasarela. El huésped consulta estado/referencia/importe; el administrador consulta todos los pagos. Una cancelación conserva el pago simulado: no genera reembolso bancario. Las listas y resúmenes se actualizan tras guardar.

HU-30/HU-31 muestran cantidades por estado, próximas llegadas confirmadas, bloqueos activos e importes de reservas no canceladas y pagos aprobados. Los importes se separan por PEN/USD. El anfitrión solo recibe agregados propios. Los estados de carga, vacío, error y recuperación se muestran explícitamente. Soporte no accede a estas operaciones; sus consultas corresponden a otras HUs.

Se usa TanStack Query, React Hook Form, Zod y el diseño existente; el catálogo y las pantallas operativas se cargan de forma diferida. El catálogo real es una dependencia mínima del flujo de reserva, no una implementación de búsqueda avanzada ni fotos inexistentes.

Validación limitada por solicitud del usuario: 3 pruebas frontend focalizadas (recorrido reserva/pago, invalidación/conflictos y catálogo vacío), lint y build. Una revisión de navegador con HTTP simulado cubrió los tres roles, recarga de reserva/pago, bloqueos, seguimiento y resúmenes en móvil 375 px y escritorio 1440 px, sin desbordamientos ni errores JavaScript. No se ejecutó la suite completa anterior ni se crearon reservas reales de prueba.

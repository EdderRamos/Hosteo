# Hosteo Frontend

Landing y flujo de autenticación de Hosteo, construidos con React 19, TypeScript y Vite 8.

## Pantallas

- `/`: redirige al inicio predeterminado `/home`.
- `/home`: catálogo “Home: Customer” con buscador y filtros locales.
- `/login`: inicio de sesión.
- `/register`: registro de cuenta conectado a la API.
- `/forgot-password`: recuperación de acceso.

## Desarrollo local

El inicio reproduce el frame de catálogo proporcionado por el usuario. Usa seis alojamientos de ejemplo y permite combinar filtros por distrito, precio y capacidad. Las fechas se validan localmente; no se consulta disponibilidad ni se crean reservas. Los botones de disponibilidad abren una vista previa y las funciones pendientes muestran un aviso. El encabezado muestra la sesión real cuando el usuario inicia sesión. No se agregaron servicios ni cambios al backend.

Las fotografías reutilizan assets existentes: son aproximaciones porque el MCP de Figma alcanzó su cuota y la referencia disponible fue la captura. El logo usa el asset único de Hosteo aportado por el usuario.

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

Login y registro consumen la API real de autenticación. La recuperación conserva el flujo visual local; las reservas se integrarán con sus respectivas historias.

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

`/profile` reproduce la estructura de la captura aportada: identidad, datos básicos, biografía, ocupación, ubicación, idiomas, intereses y contacto. Consulta `GET /api/v1/customer/profile` y guarda con `PUT` al mismo endpoint, con bearer token y la versión recibida. Solo actualiza el nombre en el encabezado tras confirmar el guardado. Permite descartar cambios, reintentar carga y conserva el formulario ante errores o conflictos de versión. Un 401 limpia la sesión. El backend autoriza huéspedes y anfitriones.

La edición de foto está temporalmente deshabilitada. El formulario y el PUT no incluyen `avatarUrl`; el servicio conserva la foto existente. Los controles para añadir idiomas e intereses se despliegan desde las opciones del diseño. Los datos vacíos permanecen vacíos, sin inventar la identidad de la captura. El diseño móvil se infiere del desktop. La revisión del flujo usa respuestas HTTP simuladas; validar persistencia en la base real requiere iniciar sesión con una cuenta existente y guardar desde la interfaz.

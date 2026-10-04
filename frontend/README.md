# Hosteo Frontend

Landing y flujo de autenticación de Hosteo, construidos con React 19, TypeScript y Vite 8.

## Pantallas

- `/`: inicio, buscador, alojamientos, destinos e información de Hosteo.
- `/login`: inicio de sesión.
- `/register`: creación de cuenta.
- `/forgot-password`: recuperación de acceso.

## Desarrollo local

```bash
npm ci
npm run dev
```

## Verificaciones

```bash
npm run lint
npm run build
```

Los formularios incluyen navegación y validación visual local. La conexión con reservas y autenticación se incorporará cuando se integre el backend.

## HU-01: inicio de sesión

`/login` implementa el diseño Figma `94:3`, dentro de “HU 1: Login” (`94:2`), del archivo `AT6w9KgP54VcNwXZ9m7tXR`. Usa la fotografía original, Playfair Display e Inter; la versión móvil se infiere del desktop. React Hook Form y Zod validan campos antes de enviar credenciales a `POST /api/v1/auth/login`.

El login consume el contrato real (`accessToken`, `user` y `roleId` numérico). Muestra errores de validación, credenciales, red, permisos y servicio, bloquea envíos duplicados y permite mostrar/ocultar contraseña. No hay cuentas ni éxitos simulados. El registro y recuperación existentes conservan validación local y aún no tienen API.

Vite redirige `/api` al backend local en el puerto 8080. Ver `.env.example` para `VITE_API_URL`; en producción se requiere proxy del hosting o una API que permita CORS. Iniciar el backend desde `backend/` conforme a su README. No se crean usuarios de prueba en la base real: iniciar sesión requiere una cuenta activa con contraseña BCrypt.

La sesión usa `sessionStorage` normalmente y `localStorage` solo si el usuario elige mantenerla activa. Solo persiste el bearer token, nunca la contraseña. Respeta `exp` y revalida con `/auth/me` al recargar o volver a la pestaña; la firma y permisos los valida el backend. Cerrar sesión limpia ambos almacenes. No hay refresh token: la opción de recordar no prolonga los 30 minutos de vigencia. El almacenamiento web está sujeto al riesgo de XSS; una futura sesión mediante cookie HttpOnly requiere cambiar el contrato del backend.

Tras autenticar se muestra confirmación y acceso al inicio existente. No se inventan equivalencias entre IDs de rol ni paneles que aún no están implementados; el acceso a funcionalidades por rol se completará junto con sus módulos. No se declara todo HU-01 validado de extremo a extremo sin una prueba con cuenta real.

Excepciones al Figma: campos inicialmente vacíos, sin credenciales de ejemplo; se omiten la etiqueta “Production”, afirmaciones de TLS y licencias no verificadas, RUC y enlaces legales sin destinos proporcionados. Se mantiene un único enlace al registro existente porque aún no permite seleccionar rol. Las fuentes se cargan desde Google Fonts y requieren conexión.

Verificación:

```bash
npm run lint
npm run test
npm run build
```

Pruebas de formulario, fallos HTTP/red, envío en curso, persistencia, expiración y rechazo de sesión por backend. Las respuestas HTTP de estas pruebas son simuladas, no una validación de credenciales contra producción. React Router instalado requiere Node >=22.22.0; el entorno observado usa 22.20.0 y emite ese aviso aunque las verificaciones pasan.

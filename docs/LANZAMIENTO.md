# Musikeeo — Qué falta para salir al aire

> Estado a 8 de octubre de 2026. Revisado en el código de `main` y en Firebase de producción.
> Objetivo: abrir la app al público en Barcelona y que la gente empiece a subir su contenido.

## Respuesta corta

**No hace falta un sistema de pagos para lanzar.** La v1 es de contacto directo (chat interno y WhatsApp), como ya estaba decidido: el músico, la sala y la tienda cierran el trato entre ellos. Los pagos (Stripe Connect con la comisión del 10 %) son para la v2, cuando haya volumen y confianza.

Lo que sí falta son **5 bloqueantes**, casi todos pequeños, y el más importante es que **todavía no se puede subir contenido propio al Feed**.

---

## 1. Bloqueantes (sin esto no se lanza)

| # | Qué | Por qué bloquea | Quién | Esfuerzo |
|---|---|---|---|---|
| 1 | **Subir vídeos y fotos al Feed** (posts/reels propios) | Hoy el Feed solo enseña reels de demostración. No existe la colección `posts` ni la subida de vídeo. Sin esto la gente no puede «subir su contenido», que es justo el objetivo del lanzamiento | Claude | 1–2 días |
| 2 | **Rellenar las páginas legales** | Aviso legal, Privacidad y Términos tienen huecos `[TITULAR]`, `[NIF/CIF]`, `[DIRECCIÓN]` (14 en total). La LSSI obliga a identificar al titular de la web | Víctor da los datos, Claude los pone | 30 min |
| 3 | **Rodrigo responde de verdad** | El último error fue `404 modelo no encontrado / sin permiso` en Kimi. Ya hay modelos de respaldo; si sigue fallando es saldo de la cuenta de Moonshot | Víctor (recargar) | 5 min |
| 4 | **Rodrigo no debe inventarse artistas ni bolos** | Su prompt le pide recomendar artistas con «id ficticio». Con usuarios reales es engañoso: tiene que recomendar perfiles reales de Explorar o no dar nombres | Claude | 1 h |
| 5 | **Subida de imagen al publicar un bolo** | `storage.rules` no tiene regla para `events/`, así que la portada del bolo falla y se pone una foto de stock | Claude + `firebase deploy --only storage` | 15 min |

## 2. Necesario la primera semana

| Qué | Detalle | Esfuerzo |
|---|---|---|
| **Avisos por email** | Si alguien te escribe o se postula a tu bolo, no te enteras si no abres la app. Firebase Functions + Resend | 1 día |
| **Verificar el email** | Se envía el correo pero no se exige: es fácil crear cuentas falsas | 2 h |
| **Botones que no hacen nada o mienten** | «Solicitar presupuesto» en el perfil de artista solo enseña un aviso (no envía nada); campana de notificaciones sin función; llamada y videollamada en mensajes; «En línea» siempre fijo | 4 h |
| **Pantallas con datos de ejemplo** | `Profile.tsx` (bolos y TrustScore inventados), `PublicProfile` (reels de ejemplo), `Projects` (siempre de ejemplo y sin reglas en Firestore) | 4 h |
| **Panel de organizador roto** | Usa la colección `organizers`, que no tiene reglas (todo denegado); «Mis eventos» enseña los de todos | 2 h |
| **Límite de uso de Rodrigo** | `/api/chat` no pide sesión y el límite es por servidor: alguien puede gastar el saldo de Kimi. Pedir sesión o App Check | 2 h |
| **Auditoría UI/UX y pruebas** | Botones que se salen de la pantalla, pantallas del panel, publicar evento y crear anuncio sin pasar por el rediseño | 1–2 días |
| **Moderación** | Existe la colección `reports` (denuncias) pero no hay forma de verlas salvo la consola de Firebase. Mínimo: aviso por email al recibir una | 2 h |

## 3. Pulido antes de anunciarlo a lo grande

- Imagen para compartir en WhatsApp/Instagram (OG 1200×630; ahora es el logo cuadrado).
- Iconos de la PWA en sus tamaños reales (192 y 512 son en realidad de 1024).
- Activar Sentry (`VITE_SENTRY_DSN` en Vercel) para ver los fallos de los usuarios.
- Borrar la cuenta del todo (hoy deja anuncios y fotos) — RGPD.
- Unificar «Publicar evento»: hay dos flujos (`/publicar` y `/eventos/crear`, este último con una «IA» de mentira y la imagen en base64).
- Retirar el contenido de prueba antes del anuncio (todo acaba en «Contenido de prueba de Musikeeo.»).

## 4. Después del lanzamiento (v2, no bloquea)

- **Pagos**: Stripe Connect para reservar y cobrar con comisión del 10 %, señal y devolución.
- **Reputación verificada**: reseñas después de cada bolo (TrustScore real).
- **Plan Pro**: más visibilidad, estadísticas, IA avanzada.
- Notificaciones push, academia, sincronizar Google Calendar.

---

## Lo que YA está hecho (para no repetirlo)

- Navegación pública sin cuenta; publicar, escribir y el perfil propio piden login y devuelven a donde estabas.
- Con cuenta, la app abre en el Feed; menú Feed · Explorar · Bolos · Mercado · Perfil.
- Emails privados (`users` solo para su dueño, `publicProfiles` sin email) — reglas desplegadas.
- «Contactar» abre el chat; el primer chat ya se puede crear.
- Recuperar contraseña, rol de Tienda en el registro.
- Rodrigo prepara borradores de anuncio, bolo y perfil que el usuario publica con un toque.
- Feed con vídeos que se reproducen solos y visor de reels tipo Instagram (deslizar, doble toque, volver deslizando).
- Rediseño estilo iOS con Manrope; home con la narrativa de la visión y vídeos de Aura Studio.
- PWA: hueco de la barra de estado del iPhone, tema oscuro, se actualiza sola, sin zoom accidental.
- Índice compuesto del mercado desplegado.
- Cuenta de pruebas «Musikeeo Dev» con artista, técnico, 6 anuncios y 4 bolos.

## Plan propuesto (2 semanas)

1. **Días 1–2** — Subir contenido al Feed (bloqueante 1) + regla de Storage de eventos + Rodrigo sin inventar.
2. **Día 2** — Víctor: datos legales y saldo de Kimi. Claude: legales rellenos.
3. **Días 3–5** — Avisos por email, verificar email, botones falsos fuera, panel de organizador.
4. **Días 6–8** — Auditoría UI/UX pantalla a pantalla en móvil + pruebas con dos cuentas reales.
5. **En paralelo (Víctor)** — 20–30 perfiles reales de su red (Lady Jarana, Cataleya, Samantha's, técnicos) antes de abrir.
6. **Día 10** — Lanzamiento en Barcelona con el vídeo de anuncio.

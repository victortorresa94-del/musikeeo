# MUSIKEEO — Project Context for Claude Code

## Identity
PWA connecting musicians, sound techs, promoters & instrument stores across Spain/Europe.
Vision: #1 live music network in Europe → expand to LATAM.
Tagline: "Conecta. Crea. Suena."

## Stack
- Frontend: React 19 + Vite + TypeScript
- Styling: Tailwind CSS + Framer Motion
- Backend: Firebase (Auth, Firestore, Functions, Storage)
- AI: Kimi (Moonshot AI, API directa) via Vercel serverless /api/chat
- Deploy: Vercel → musikeeo.com (auto-deploy on push to `main`)
- Repo: github.com/victortorresa94-del/musikeeo

## Branding
- Primary: amarillo #FFD60A (token `primary` en src/index.css). Decidido 2026-10: el verde #82FF1F queda solo en theme-color/manifest
- Tema: CLARO por defecto (fondo blanco); oscuro opcional (clave `musikeeo-theme-v3`, se aplica en `index.html` antes de pintar). La home (/home) sigue siempre oscura
- Colores SOLO por tokens con su pareja claro/oscuro (src/index.css): `bg-fill`, `bg-fill-strong`, `border-hairline(-strong)`, `bg-sheet`, `bg-chrome`, `text-primary-ink` (amarillo como texto: oro oscuro en claro), sombras `shadow-e1/e2/e3`, pulsación `.pulsable`. Nada de `bg-white/…`, `text-white` (salvo sobre fotos), `text-gray-*`, `brand-*` ni hex a pelo (skills de Aura Storage: equipo-design-system, uiux-app-premium)
- Diseño nuevo: primero se SUEÑA en Aura Studio (3-4 conceptos, se elige) y luego se maqueta
- Background: #0A0A0A
- Fonts (decidido 21-oct-2026 sobre el sueño de Explorar que le gustó): la letra del iPhone (SF Pro vía `-apple-system`) y su gemela Inter (variable 400–800, en /public/fonts) en Android y PC, para toda la app (`font-sans`/`font-heading`). Texto a 500, negrita a 750 (tailwind `fontWeight.bold`). Manrope SOLO en los titulares grandes de la portada (`font-display`); se descartó Manrope para todo porque «no para todo ni tan grande»
- Style: Dark, limpio, estilo iOS. Amarillo SOLO para la acción principal de cada pantalla; chips, pestañas y controles segmentados en blanco/gris (seleccionado = blanco con texto negro). Barra inferior estilo iOS sin píldoras de color. Títulos grandes de página a 28px (no más: «ni tan grande»). Botones: h-9 rounded-full (compactos) o h-[52px] rounded-[14px] (principales). Nada de brillos ni sombras de color

## Business Model
- Freemium base
- 10% commission on bookings (not yet implemented)
- Pro Plan (monthly subscription — not yet implemented)
- B2B Marketplace

## User Roles
- Músico / Banda
- Técnico de sonido
- Promotor / Sala
- Tienda de instrumentos

## AI Modules
- Rodrigo: floating chatbot (RodrigoFloatingChat) + page (/rodrigo)
  - Engine: rodrigoEngine.ts → openrouter.ts (wrapper cliente, nombre histórico) → POST /api/chat (Vercel serverless) → api.moonshot.ai
  - Model: kimi-k2-turbo-preview (override con env KIMI_MODEL)
  - API key: KIMI_API_KEY (Vercel env var, never in frontend bundle)
  - Prompt real: `api/chat.ts` (RODRIGO_SYSTEM_PROMPT del servidor; `src/lib/rodrigoPrompt.ts` es una copia antigua)
  - Borradores desde el chat: Rodrigo emite bloques `[CREAR_ANUNCIO]`, `[PUBLISH_EVENT]` (bolo) y `[CREAR_PERFIL]` → `rodrigoEngine.parseResponse` → `RodrigoDraftCard` (resumen + «Publicar»). Nada se publica sin que el usuario pulse; publica con su sesión vía `src/services/rodrigoActions.ts` (mismos campos que los formularios). Sin sesión → login y vuelta

## Architecture Rules
- All pages in `src/pages/`
- Shared components in `src/components/`
- Firebase logic in `src/services/` or `src/lib/`
- AI calls: frontend → /api/chat serverless → Kimi (Moonshot AI)
- Types in `src/types/`
- Hooks in `src/hooks/`
- Vercel serverless functions in `/api/` (root level)

## Key Conventions
- Use TypeScript strict mode
- Tailwind for all styling (no inline styles)
- Framer Motion for animations
- Firebase Auth for all authentication
- Firestore for all data persistence
- Mobile-first design (PWA)
- Spanish UI text (primary market)
- NO payment integration yet (marketplace is contact-only, v1)

## Dev Workflow
```bash
npm run dev       # local dev server
npm run build     # production build
git push origin main  # triggers Vercel auto-deploy
```

## Environment Variables (never commit)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- KIMI_API_KEY  ← server-side only (Vercel env), NO VITE_ prefix (acepta también MOONSHOT_API_KEY)
- KIMI_MODEL    ← opcional; por defecto kimi-k2-turbo-preview. Ante 404 (cuenta sin acceso al modelo) se prueban kimi-k2-0905-preview → kimi-k2-0711-preview → kimi-latest → moonshot-v1-8k
- KIMI_BASE_URL ← opcional; si se fija se prueba primero. Ante 401 se prueban en orden api.moonshot.ai → api.moonshot.cn → api.kimi.com/coding (modelo kimi-for-coding) y se recuerda el que funcione

## Acceso
- Navegar es público: /home, /feed, /explorar(/:categoría), /eventos(/:id), /market/:id, /profile/:id, /artist/:slug, /reels
- Explorar = el marketplace (Explorar + Mercado unidos): categorías en `src/config/categorias.ts` (una tabla para hub, vista, buscador), iconos 3D en `public/images/categorias/` recortados del sueño elegido (concepto A + cabecera «por momento» de C). /discover, /artistas, /sonido y /market redirigen. Barra: Feed · Explorar · Bolos · Perfil
- Requieren cuenta (RequireAuthCompleted → /login con `state.from` y vuelta tras entrar): /messages, /market/create, /eventos/crear, /projects, /profile; /publicar requiere sesión (RequireAuthSimple)
- /cancionero es público y funciona sin cuenta (ver «Cancionero»)

## Cancionero (2026-10-24)
- Letras y acordes que la persona PEGA de cualquier web (nunca los ponemos nosotros: derechos), limpios y sin anuncios. Privados: solo los ve su dueño
- Rutas: /cancionero (Canciones · Repertorios, `?ver=repertorios`), /cancionero/nueva (`?repertorio=<id>` la mete en ese repertorio), /cancionero/:id (leer), /cancionero/:id/editar, /cancionero/repertorio/:id (ordenar arrastrando), /cancionero/repertorio/:id/tocar (FUERA de MainLayout: el bolo a pantalla completa)
- Motor en `src/lib/acordes.ts` (sin React): acordes encima de la letra, ChordPro `[Am]` y `{title:}`, formato Ultimate Guitar, cifrado americano y latino (Do Re Mi), tono, cejilla recomendada, varias canciones separadas por `---` o `{new_song}`
- Setlist (`src/lib/setlist.ts`): en «Importar varias» se pega un setlist escrito a mano («Hace calor — G», «Bamboléo — Em (capo 3) [R]», bloques con títulos, leyenda de etiquetas, banquillo con «·», «Confirmar antes de salir», checklist) y sale una FICHA por tema (bloque, `Tono: G` transportable, cejilla, notas) más una ficha final «Notas del bolo». Las fichas entran con «que quepa» activado. Una ficha se une a la canción del mismo título si ya existe. Probado con la nota de Aura «Boda Castillo de Lloret 24/10». Si luego se importan canciones con el mismo título, RELLENAN esas fichas (sin artista) y se reutiliza el repertorio que ya las tenía (no se duplica)
- Completar fichas: al importar, una ficha del setlist o una chuleta de acordes sin letra (menos de 8 líneas de letra) se RELLENA con la canción del mismo título que llega con letra, aunque lleve artista; si solo se completan fichas, no se crea otro repertorio (se abre el que ya las tiene). Las progresiones con guiones («G – C – D») se leen como acordes. Importar guarda todo de una vez (`guardarVarias`: una escritura en el móvil y una subida): guardar una a una reescribía el cancionero entero por canción y el iPhone se colgaba con 28. La hoja lleva «Importar» también arriba Así se metieron el 24-oct las letras del Drive de Víctor (Lady Jarana / Cataleya) en el bolo de Lloret: se sacan con read_file_content de Drive y se convierten con un script (no se teclean)
- «Falta la letra» (lector): en una ficha o chuleta sin letra, «Buscar en LaCuerda» + «Pegar aquí». `recortarCancion` se queda de la primera a la última línea de acordes (vale «Seleccionar todo»), quita cejilla/tono de la web; `semitonosHacia` calcula el cambio de tono para que caiga en el `Tono:` de la ficha (se guarda en `ajustes.semitonos`, el texto no se reescribe). La letra la copia la persona: nosotros no la ponemos
- Lector: tono ±, cejilla (posturas), tamaño, «que quepa» (mide con una copia invisible, `components/cancionero/medir.ts`), columnas, solo letra / solo acordes, desplazamiento automático, modo escenario, imprimir en una A4, pantalla siempre encendida, pedal Bluetooth (AvPág/flechas)
- Tocar: deslizar de lado = siguiente canción; el pedal baja y, al final, pasa a la siguiente; zoom con dos dedos (cambia el tamaño de la letra y se guarda en la canción)
- Datos: primero en el dispositivo (localStorage `musikeeo-cancionero-v1:<uid|invitado>` y `musikeeo-repertorios-v1:…`), con cuenta se copian a `users/{uid}/canciones` y `users/{uid}/repertorios`. Lo guardado sin cuenta pasa a la cuenta al entrar. Si las reglas no están desplegadas, sigue en el dispositivo sin avisar de errores
- PWA sin cobertura: `public/service-worker.js` guarda TODO el código al instalarse; `vite.config.ts` (plugin `musikeeo-precache-sw`) le escribe la lista de /assets y la versión en cada build


## Cuenta y datos de prueba (producción, 2026-10)
- Cuenta de pruebas: victortorresa94+musikeeo-dev@gmail.com (uid YEj8ANe4aEeYDl6Zabg1chbD6oC3), «Musikeeo Dev». La contraseña la tiene Víctor (no va en el repo). Su banda, su técnico y sus 6 anuncios están OCULTOS (isPublic/available false) y sus 4 bolos borrados desde el 22-oct
- Contenido de demostración para el inversor (22-oct): 14 cuentas `victortorresa94+mk-<slug>@gmail.com` (misma contraseña que la de pruebas): 8 artistas (rumba-sur, lucia-ferrer, marta-vidal, velvet-jam, toni-cortes, quartet-nocturn, sara-llop, los-tremendos), 3 técnicos/tienda (ruido-blanco, marc-soler, guitarras-gracia) y 3 salas (la-fragua, el-tranvia, bodas-mediterraneo); 8 bolos (`events/seed_<sala>_<n>`) y 6 anuncios (`listings/seed_<dueño>_<n>`). Llevan `seed: true` (salvo publicProfiles, que no lo admite) y las fotos están en `public/seed/`. Sin reseñas inventadas: todos salen como «Nuevo». Al inversor se le dice que es contenido de demostración
- Se creó por la API REST de Firebase (Auth + Firestore) con la sesión de cada cuenta, respetando las reglas

## Current Status
Project is in active development. Architecture is solid, marketplace sprint in progress.

## Interaction Rules for Claude Code
- Be precise: reference exact file paths and line numbers when possible
- One task at a time
- After completing a task, summarize what was changed and what's next
- Never rewrite entire files unless explicitly asked
- Prefer surgical edits over full rewrites
- If unsure about existing implementation, READ first, then suggest

---

## SESSION LOG

### 2026-10-24 (Cancionero + repertorios para el bolo)

**✅ Hecho:** Cancionero completo (pegar, limpiar, tono, cejilla, que quepa, escenario, imprimir), repertorios con «Tocar» (deslizar, pedal, zoom), importar varias canciones de golpe, «Buscar acordes en» Google/LaCuerda/Ultimate Guitar, service worker que deja la app entera disponible sin red. Entrada en la barra lateral y en Mi perfil.

**❌ Pendiente:**
- **Víctor: desplegar las reglas** — `firebase deploy --only firestore:rules` (canciones y repertorios en la cuenta). Sin esto, todo funciona pero solo en el dispositivo
- No se soñó en Aura Studio (había prisa para un bolo): sueño de la pantalla de lectura y de «Tocar» cuando haya tiempo
- Diagramas de acordes, notas por canción en el repertorio, compartir repertorio con la banda

### 2026-04-06 (Sesión 1 — Cuenta 1)

**Decisiones técnicas tomadas:**
- Rodrigo migrado de DeepSeek (frontend, key expuesta) → OpenRouter via Vercel serverless `/api/chat`
- Modelo: `google/gemma-4-26b-a4b-it` (Gemma 4) — sustituido por Kimi vía API directa de Moonshot (2026-09, `KIMI_API_KEY`)
- SplashScreen reducido de 2500ms → 600ms
- AuthContext: `loading` resuelve al detectar auth state; `profileLoading` separado para Firestore
- Vite config: chunking manual vendor-react / vendor-firebase / vendor-ui / vendor-utils
- AIContextPanel eliminado del MainLayout
- Events.tsx (mock) → EventsV2 (Firestore real) en ruta `/eventos`
- FeaturedArtists eliminado del Home (datos hardcoded falsos)

**✅ Completado (Sesión 1):**
- SPRINT 1: limit(50) en getArtists/getPublicProviders/firestoreService.getAll + lazy loading en imágenes
- SPRINT 2 Fix A: PanelMultimediaPage — foto upload real con storageService.uploadArtistPhoto()
- SPRINT 2 Fix B: PanelCalendarPage — FAB "Añadir Fecha de Bloqueo" funcional + modal + sync → Próximamente

---

### 2026-04-06 (Sesión 2 — Cuenta 2)

**✅ Completado (Sesión 2):**
- SPRINT 2 Fix B: commit PanelCalendarPage (FAB + modal bloquear fecha + sync → Próximamente)
- SPRINT 2 Fix C: PanelSettingsPage — formulario editable displayName + location con userService.updateProfile()
- SPRINT 3 FASE 1: tipo Listing + ListingCategory en src/types/index.ts
- SPRINT 3 FASE 2: rewrite CreateListing.tsx — upload real Firebase Storage, campos completos (tipo/condición/urgente/whatsapp/etc.)
- SPRINT 3 FASE 3: refactor Market.tsx — query Firestore "listings", filtros, cards, contact modal (mensajes + WhatsApp)
- SPRINT 3 FASE 4: Hero.tsx — CTAs marketplace + fila categorías rápidas linkando a /market?category=X

**❌ Pendiente / mejoras futuras:**
- Firestore index necesario para query listings (urgent desc + createdAt desc) — se crea automáticamente al ejecutar la query por primera vez en producción, o manualmente en Firebase Console
- ProductDetail.tsx no actualizado (ruta /market/:id aún usa el tipo antiguo)
- Events.tsx legacy sigue en src/ (puede borrarse)
- Discover: filtros contra Firestore real (actualmente mock)
- Trust Score, bookings, Pro Plan — no implementados (v2)

**➡️ Próxima tarea concreta:**
Verificar que el índice compuesto de Firestore existe para la query de listings (available==true + orderBy urgent + orderBy createdAt). Si falla en producción, crear el índice en Firebase Console.

**Decisiones técnicas (Sesión 2):**
- Marketplace v1: solo contacto (mensajes internos o WhatsApp), sin pagos, sin Stripe
- Contact modal: [💬 Mensaje en Musikeeo] + [📱 WhatsApp] (solo si userWhatsApp existe)
- Colección Firestore: "listings" (no "products" ni "market")
- OPENROUTER_API_KEY: debe estar en Vercel Dashboard env vars (no en repo)
- Listings usan string ISO para timestamps (consistente con el resto del proyecto)

---

### 2026-05-19 (Sesión 3 — Sprint Marketplace + Home + Performance)

> Todo el trabajo de esta sesión va en la rama `claude/read-context-files-7N0Ww` (NO en `main`). No despliega en Vercel hasta hacer merge.

**✅ Completado (Sesión 3):**
- SPRINT MARKETPLACE (4 fases, commit por fase):
  - FASE 0 limpieza: borrado `Events.tsx` legacy; copy de "pasarela de pago" inexistente en HowItWorks → contact-only; Rodrigo verificado como integración REAL (`api/chat` + OpenRouter), se mantiene en nav
  - FASE 1 modelo: `Listing` per spec — alias `ListingType`/`ListingCondition`/`RentalUnit`, campo `views?`, eliminados `shipping`/`sellerType`
  - FASE 2 `CreateListing`: storage path `listings/{userId}/{timestamp}/{idx}_{filename}`, guarda `views:0`, UI sin campos fuera de spec
  - FASE 3 `Market.tsx`: mocks limpios + `priceUnit`, badge obsoleto fuera, query `limit(20)` urgent desc + createdAt desc
  - FASE 4 integración: rutas `/market`, `/market/create` (antes de `/market/:id`), `/market/:id`; BottomNav/Sidebar con icono ShoppingBag
- Rediseño `Home.tsx` según spec de lanzamiento (Hero + chips categorías + Cómo funciona + 6 listings reales Firestore + Para profesionales + Footer "Hecho con ❤ en Barcelona"). Eliminado `FeaturedArtists.tsx` (hardcoded, sin uso)
- Routing: `/` y `/home` ahora renderizan `Home.tsx` en vez de `AppHome.tsx` (AppHome queda como archivo fuera de ruta)
- AUDITORÍA DE PERFORMANCE + 4 fixes (commit por fix):
  - FIX 1: `limit(20)` en queries de listados (Discover artists/providers 50→20, EventsV2 `getAll('events',20)`, `firestoreService.getWhere` ∞→20)
  - FIX 2: `RodrigoFloatingChat` → `lazy()` + Suspense (index inicial 84.4→81.2 KB gz)
  - FIX 3: cleanup onSnapshot en `Messages` (deps `[user]`, flag `cancelled`, bloque no-op fuera)
  - FIX 4: `loading="lazy"` en imágenes de cards (EventsV2 EventCardNew, Feed x4)
- ✅ Resuelto pendiente Sesión 2: el índice compuesto de `listings` YA existe en `firestore.indexes.json` (`available ASC, urgent DESC, createdAt DESC`)

**❌ Pendiente / mejoras futuras:**
- **Desplegar índices Firestore a producción:** `firebase deploy --only firestore:indexes` (el índice existe en el repo pero hay que desplegarlo)
- Mergear rama `claude/read-context-files-7N0Ww` → `main` para que despliegue en Vercel
- Punto 5 perf (evaluar aparte, NO prioritario): `Discover` `ArtistCard`/`ArtistGridCard` usan `backgroundImage` CSS → `loading="lazy"` no aplica; requiere refactor a `<img>` o IntersectionObserver
- Diferir Firestore del arranque (`vendor-firebase` 135 KB gz en first paint) — refactor mayor
- `chatService.subscribeToMessages`: `orderBy('timestamp','asc') + limit(100)` trae los 100 mensajes MÁS ANTIGUOS, no los últimos → debe ser `desc + limit + reverse`
- Dependencia muerta `@google/generative-ai` en `package.json` (cero usos en `src/`, eliminar)
- Mocks muertos sin imports: `sampleArtistData.ts`, `mockData.ts`
- `AppHome.tsx` queda como archivo huérfano (mock-heavy: LISTINGS/TRENDING_ARTISTS/ACTIVITY) — borrar o reutilizar
- Discover: filtros contra Firestore real (aún parcialmente mock)
- Trust Score, bookings, Pro Plan — v2

**➡️ Próxima tarea concreta:**
Desplegar el índice compuesto a producción (`firebase deploy --only firestore:indexes`) y, tras validar la rama, mergear `claude/read-context-files-7N0Ww` → `main`. Limpieza rápida adicional: eliminar dependencia muerta `@google/generative-ai` y mocks sin uso (`sampleArtistData.ts`, `mockData.ts`).

**Decisiones técnicas (Sesión 3):**
- `Listing` sin `shipping`/`sellerType` (fuera de spec v1)
- `Home.tsx` self-contained (footer/hero propios) para no tocar componentes compartidos usados por otras páginas
- Límite estándar de listados = `limit(20)`; `getWhere` con tope por defecto 20
- Rutas estáticas antes que dinámicas en el router (`/market/create` antes de `/market/:id`)
- `RodrigoFloatingChat` diferido con `Suspense fallback={null}` (widget no bloquea el shell)

# MUSIKEEO — Project Context for Claude Code

## Identity
PWA connecting musicians, sound techs, promoters & instrument stores across Spain/Europe.
Vision: #1 live music network in Europe → expand to LATAM.
Tagline: "Conecta. Crea. Suena."

## Stack
- Frontend: React 19 + Vite + TypeScript
- Styling: Tailwind CSS + Framer Motion
- Backend: Firebase (Auth, Firestore, Functions, Storage)
- AI: OpenRouter (google/gemma-4-26b-a4b-it) via Vercel serverless /api/chat
- Deploy: Vercel → musikeeo.com (auto-deploy on push to `main`)
- Repo: github.com/victortorresa94-del/musikeeo

## Branding
- Primary: #82FF1F (neon green)
- Background: #101010
- Fonts: Space Grotesk (headings) + Inter (body)
- Style: Dark, modern, energetic

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
  - Engine: rodrigoEngine.ts → openrouter.ts → POST /api/chat (Vercel serverless)
  - Model: google/gemma-4-26b-a4b-it via OpenRouter
  - API key: OPENROUTER_API_KEY (Vercel env var, never in frontend bundle)

## Architecture Rules
- All pages in `src/pages/`
- Shared components in `src/components/`
- Firebase logic in `src/services/` or `src/lib/`
- AI calls: frontend → /api/chat serverless → OpenRouter
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
- OPENROUTER_API_KEY  ← server-side only (Vercel env), NO VITE_ prefix

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

### 2026-04-06 (Sesión 1 — Cuenta 1)

**Decisiones técnicas tomadas:**
- Rodrigo migrado de DeepSeek (frontend, key expuesta) → OpenRouter via Vercel serverless `/api/chat`
- Modelo: `google/gemma-4-26b-a4b-it` (Gemma 4)
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

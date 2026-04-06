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

**✅ Completado:**
- SPRINT 2 Fix B: commit de PanelCalendarPage (estaba sin commitear)
- SPRINT 2 Fix C: PanelSettingsPage — formulario editable displayName + location con userService.updateProfile()

**❌ Falta por hacer:**
- SPRINT 3 FASE 1: tipo Listing + ListingCategory en src/types/index.ts
- SPRINT 3 FASE 2: rewrite CreateListing.tsx con image upload real y campos nuevos
- SPRINT 3 FASE 3: refactor Market.tsx — query Firestore real colección "listings", filtros, contact modal
- SPRINT 3 FASE 4: Home.tsx — nuevo hero con 3 CTAs + fila categorías rápidas

**➡️ Próxima tarea concreta:**
SPRINT 3 FASE 1 — añadir tipo Listing + ListingCategory en src/types/index.ts

**Decisiones técnicas (Sesión 2):**
- Marketplace v1: solo contacto (mensajes internos o WhatsApp), sin pagos, sin Stripe
- Contact modal: [💬 Mensaje en Musikeeo] + [📱 WhatsApp] (solo si userWhatsApp existe)
- Colección Firestore: "listings" (no "products" ni "market")
- OPENROUTER_API_KEY: debe estar en Vercel Dashboard env vars (no en repo)

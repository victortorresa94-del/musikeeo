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

### 2026-04-06

**Decisiones técnicas tomadas:**
- Rodrigo migrado de DeepSeek (frontend, key expuesta) → OpenRouter via Vercel serverless `/api/chat`
- Modelo: `google/gemma-4-26b-a4b-it` (Gemma 4, el `google/gemma-4-e2b-it` del usuario no existía en OpenRouter)
- SplashScreen reducido de 2500ms → 600ms
- AuthContext: `loading` ahora se resuelve al detectar auth state (no espera Firestore profile). `profileLoading` separado para el fetch del perfil.
- Vite config: chunking manual vendor-react / vendor-firebase / vendor-ui / vendor-utils
- AIContextPanel eliminado del MainLayout (usaba DeepSeek sin key configurada, label incorrecto "Gemini Pro")
- Events.tsx (mock) reemplazado por EventsV2 (Firestore real) en ruta `/eventos`
- FeaturedArtists eliminado del Home (datos hardcoded falsos)

**✅ Completado en esta sesión:**
- Reducción tiempo de carga: splash 600ms + auth no bloqueante + vite chunks
- Rodrigo AI: migración completa a OpenRouter (Gemma 4), endpoint `/api/chat` serverless
- FASE 0 limpieza: Events legacy quitado, FeaturedArtists quitado, AIContextPanel quitado
- vercel.json creado con build config correcta

**🔧 A medias / en progreso:**
- SPRINT 1 Performance: Firestore .limit() y img lazy loading — NO iniciado aún
- SPRINT 2 Perfil: PanelMultimediaPage foto upload, PanelCalendarPage FAB, PanelSettingsPage — NO iniciado
- SPRINT 3 Marketplace: tipos, CreateListing, Market.tsx, Home CTAs — NO iniciado

**❌ Falta por hacer (plan completo):**
- Performance: `getArtists()` sin limit(50) | `getPublicProviders()` sin limit(50) | `firestoreService.getAll()` sin limit | 6 img sin loading="lazy"
- Perfil: foto upload en Multimedia | FAB "Añadir Fecha" en Calendar | Settings guardar datos
- Marketplace (Listing type → CreateListing rewrite → Market.tsx refactor → Home CTAs)

**➡️ Próxima tarea concreta:**
SPRINT 1 — Fix 1: añadir `limit(50)` a `getArtists()` en `src/services/artistService.ts:36`

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
  - Plan «Rodrigo con cerebro» (memoria por músico, repertorios por chat, Spotify): `docs/PLAN-RODRIGO-CEREBRO.md` (sin construir)
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
- Requieren cuenta (RequireAuthCompleted → /login con `state.from` y vuelta tras entrar): /messages, /mapa, /market/create, /eventos/crear, /projects, /profile; /publicar requiere sesión (RequireAuthSimple)
- /cancionero es público y funciona sin cuenta (ver «Cancionero»)

> 📌 **TODO LO QUE HA PEDIDO VÍCTOR DEL CANCIONERO, con sus palabras y su estado → [`docs/PETICIONES-CANCIONERO.md`](docs/PETICIONES-CANCIONERO.md).** Léelo antes de tocar el Cancionero y actualízalo el mismo día: *«que no se escape ni una de mis peticiones»*.

## Cancionero (2026-10-24)
- Letras y acordes que la persona PEGA de cualquier web (nunca los ponemos nosotros: derechos), limpios y sin anuncios. Privados: solo los ve su dueño
- Rutas: /cancionero (Canciones · Repertorios, `?ver=repertorios`), /cancionero/nueva (`?repertorio=<id>` la mete en ese repertorio), /cancionero/:id (leer), /cancionero/:id/editar, /cancionero/repertorio/:id (ordenar arrastrando), /cancionero/repertorio/:id/tocar (FUERA de MainLayout: el bolo a pantalla completa)
- Motor en `src/lib/acordes.ts` (sin React): acordes encima de la letra, ChordPro `[Am]` y `{title:}`, formato Ultimate Guitar, cifrado americano y latino (Do Re Mi), tono, cejilla recomendada, varias canciones separadas por `---` o `{new_song}`
- Setlist (`src/lib/setlist.ts`): en «Importar varias» se pega un setlist escrito a mano («Hace calor — G», «Bamboléo — Em (capo 3) [R]», bloques con títulos, leyenda de etiquetas, banquillo con «·», «Confirmar antes de salir», checklist) y sale una FICHA por tema (bloque, `Tono: G` transportable, cejilla, notas) más una ficha final «Notas del bolo». Las fichas entran con «que quepa» activado. Una ficha se une a la canción del mismo título si ya existe. Probado con la nota de Aura «Boda Castillo de Lloret 24/10». Si luego se importan canciones con el mismo título, RELLENAN esas fichas (sin artista) y se reutiliza el repertorio que ya las tenía (no se duplica)
- Completar fichas: al importar, una ficha del setlist o una chuleta de acordes sin letra (menos de 8 líneas de letra) se RELLENA con la canción del mismo título que llega con letra, aunque lleve artista; si solo se completan fichas, no se crea otro repertorio (se abre el que ya las tiene). Las progresiones con guiones («G – C – D») se leen como acordes. Importar guarda todo de una vez (`guardarVarias`: una escritura en el móvil y una subida): guardar una a una reescribía el cancionero entero por canción y el iPhone se colgaba con 28. La hoja lleva «Importar» también arriba Así se metieron el 24-oct las letras del Drive de Víctor (Lady Jarana / Cataleya) en el bolo de Lloret: se sacan con read_file_content de Drive y se convierten con un script (no se teclean)
- Acordes y letra separados (filas de acordes arriba y la letra pegada aparte): `juntarAcordesYLetra` pone cada fila encima de su línea, repartida por las palabras (aproximado). Se hace solo al pegar la letra en una chuleta, y en las que ya están así el lector ofrece «Ponerlos encima» (con Deshacer). Solo cuentan filas en bloques de 2+ y sin guiones (una fila por sección o «G – C – D» es un resumen, no se reparte). Texto a doble espacio (Word/Docs: acorde, blanco, letra) se junta en `leerCancion`. OJO: LaCuerda pone `user-select: none` en la canción, en el móvil no deja copiarla
- «Falta la letra» (lector): en una ficha o chuleta sin letra, enlaces de búsqueda (Ultimate Guitar, Cifra Club, Google «acordes», «Letra»; LaCuerda no, en el móvil no deja copiar) + «Pegar aquí». `recortarCancion` se queda de la primera a la última línea de acordes (vale «Seleccionar todo»), quita cejilla/tono de la web; `semitonosHacia` calcula el cambio de tono para que caiga en el `Tono:` de la ficha (se guarda en `ajustes.semitonos`, el texto no se reescribe). La letra la copia la persona: nosotros no la ponemos
- Lector: tono ±, cejilla (posturas), tamaño, «que quepa» (mide con una copia invisible, `components/cancionero/medir.ts`), columnas, solo letra / solo acordes, desplazamiento automático, modo escenario, imprimir en una A4, pantalla siempre encendida, pedal Bluetooth (AvPág/flechas)
- Tocar: deslizar de lado = siguiente canción; el pedal baja y, al final, pasa a la siguiente; zoom con dos dedos (cambia el tamaño de la letra y se guarda en la canción)
- Datos: primero en el dispositivo (localStorage `musikeeo-cancionero-v1:<uid|invitado>` y `musikeeo-repertorios-v1:…`), con cuenta se copian a `users/{uid}/canciones` y `users/{uid}/repertorios`. Lo guardado sin cuenta pasa a la cuenta al entrar. Si las reglas no están desplegadas, sigue en el dispositivo sin avisar de errores
- Buscador y portadas (2026-10-25): el buscador de /cancionero enseña tus canciones y debajo «En el catálogo» (iTunes Search API de Apple, sin clave, CORS abierto, `country=es`; motor sin React en `src/lib/buscarCanciones.ts`): portada, duración y muestra de 30 s (un solo `Audio` en `hooks/useMuestra.ts`). «Añadir» crea la canción sin letra (portada, duracion, muestra) y la abre; si ya está (mismo título y artista) la abre, y una ficha sin artista con ese título se completa. «Poner portadas» (solo si a alguna le falta): de una en una (~3/s), un solo `guardarVarias` al final, solo coincidencias claras (`portadaDe`: título sin «(Remastered)»… y artista), sin mezclas («Mix…», «→») ni fichas sin artista. Apple contesta 403 si se le pide mucho (~20/min por IP; desde la nube frena enseguida): se espera y se sigue más despacio, y si insiste se para y lo dice. Portadas en las listas con `components/cancionero/Portada.tsx` (iniciales si falta o no carga, sin cobertura). Sin cobertura el buscador se queda en tus canciones
- Importar Word y PDF (2026-10-25): en «Importar varias» se eligen .docx/.pdf/.txt (`src/lib/documentos.ts`, sin React; Word con mammoth en `lib/lectorWord.ts`, PDF con pdfjs-dist), en trozos que se cargan solo al usarlos y que NO van en la descarga inicial del service worker. El texto sale al mismo cuadro de importar (rellena fichas igual que al pegar)
- Quien canta (2026-10-25, `components/cancionero/Cantante.tsx`, sonido con WebAudio en `lib/sonido.ts`, cuentas en `lib/cantar.ts`): «Dame el tono» (un toque: el acorde del tono y el primero de la canción; mantener: solo la nota de arranque), «1·2·3·4» al tempo de la canción (`bpm`, se marca a toques en Ajustes), y la hoja que baja al ritmo de lo que dura (`ajustes.alRitmo`) esperando la intro (`ajustes.intro`). Nada suena si no se pulsa; se calla al salir o esconder la página. Sin probar aún en un iPhone de verdad (interruptor de silencio)
- Diseño (2026-10-25, sueño elegido en Aura «Cancionero Musikeeo · 4 pantallas», con el lenguaje de Explorar): baldosas pastel con objeto 3D. Tokens `pastel-{mantequilla,cielo,menta,lavanda,melocoton,rosa}` con su `-ink` (claro/oscuro en `src/index.css`); iconos en `public/images/cancionero/` (recortados del verde croma). Colores por nombre en `components/cancionero/estilo.ts`: bloques del bolo (`estiloBloque`), avisos de la ficha en píldoras (`etiquetasDe`: Canta X, Rumba fuerte, Català, Por confirmar, Cejilla) y partes de la canción (`estiloSeccion`: estribillo en baldosa mantequilla con el micro, puente en lavanda; estrofa/pre-coro/intro con etiqueta de color). «Dame el tono» es la acción amarilla de la canción y de Tocar; Tocar lleva píldoras del bloque y de quién canta (no se repiten en la hoja) y «Siguiente» con portada
- Sacar acordes de un audio (2026-10-25, /cancionero/escuchar): eliges una grabación (mp3, m4a, wav; hasta 10 min) y el MÓVIL la escucha, sin servidor, sin IA y sin subirla: acordes por compases («| Am | G | F E |», «x2» si se repite), tono, tempo y compás. Motor de señal clásico en `src/lib/escuchar.ts` (sin React; espectro en notas con la afinación de la grabación, reparto entre notas por series de armónicos, pulso por programación dinámica, acordes con un modelo oculto de Markov que prefiere cambiar en el 1 del compás y los acordes del tono), corre en `src/workers/escuchar.worker.ts`; descodificar en `lib/sacarAcordes.ts`. La pantalla tiene reproductor con la cuadrícula de compases (el que suena se ilumina; tocar uno salta ahí). Guarda canción con `bpm` y `duracion`; con `?cancion=<id>` rellena esa ficha en su tono (`unirConFicha`, la misma que al pegar) y con `?repertorio=<id>` la mete en el repertorio. Entradas: tarjeta en el inicio del Cancionero, «Sacar de un audio» en «Falta la letra», «Desde un audio» en Nueva canción. Medido (scripts/escuchar, ver su README): acierta el acorde ~70 % en guitarra real y Lieder de 1933, ~86 % con grupo sintético; por eso la pantalla dice que es un borrador. Parámetros en `AJUSTES_ESCUCHA` (afinar midiendo, no a ojo). Desde YouTube/Spotify no: bajar su audio va contra sus condiciones; Chordify no tiene API (hay botón «Chordify» que busca la canción allí)
- Arranque sin esperar a Firebase: `musikeeo-cancionero-ultimo` recuerda quién usó el cancionero por última vez para enseñar sus canciones del móvil al momento (Firebase Auth tarda hasta 30 s en confirmar la sesión con mala cobertura). Se borra al cerrar sesión
- Modo auto en Tocar (2026-11-11): botón «Auto» arriba (clave `musikeeo-tocar-auto`). La hoja baja en lo que dura la canción menos la intro o, sin duración, por versos × 8 pulsos / bpm (`segundosAuto` en `lib/cantar.ts`). − / + = `ajustes.ritmo` (0,5–2) por canción; un toque en la hoja la para; el pedal adelante arranca si está arriba
- Tempo y duración solos (2026-11-11): «Poner tempo y duración» (`components/cancionero/PonerTempo.tsx`) descarga la muestra de 30 s de Apple (CORS abierto), la descodifica y saca el bpm en `workers/tempo.worker.ts` con `lib/tempo.ts` (el motor de escuchar.ts; solo vale si las dos mitades coinciden). Duración del catálogo. Nunca pisa. Desde el ordenador: `scripts/tempo`. La duración también se escribe a mano en la ficha («3:42», `leerDuracion`) y se ve en cada fila
- Acordes rápidos (2026-11-11): en el editor, parte + «G - F - Am - C» → `[Parte]\nG - F - Am - C` (`lib/progresion.ts`, `components/cancionero/AcordesRapidos.tsx`)
- Versiones (2026-11-11): «Hacer mi versión» en los ajustes de la canción → copia con `version` (nombre) y `original` (id); sale primero al buscar; la copia .json guarda `version` y al importar solo se junta con la misma versión (`original` no viaja en la copia)
- PWA sin cobertura: `public/service-worker.js` guarda TODO el código al instalarse; `vite.config.ts` (plugin `musikeeo-precache-sw`) le escribe la lista de /assets y la versión en cada build. Si la red no contesta en 2,5 s, abre la página guardada. `useAutoUpdate` no recarga en Tocar ni a pantalla completa


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

## Feed, me gusta, comentarios y agentes (2026-10-25)
- Me gusta y comentarios en `interacciones/{post_<id> | artista_<id>}` (subcolecciones `meGusta/{uid}` y `comentarios`), aparte del contenido. Lógica en `src/services/interaccionesNucleo.ts` (sin imports de la app: la usan también los agentes desde Node); la app la usa vía `interaccionService.ts`. Las reglas obligan a mover los contadores de uno en uno y a la vez que el me gusta o el comentario (36 casos probados en el emulador)
- Algoritmo del Feed: `src/lib/recomendador.ts` (sin React ni Firebase). Aprende de me gusta, comentarios, vídeos vistos enteros o saltados, perfiles y bolos abiertos y lo que se ve sin hacer nada; cada familia de rasgos puntúa por separado (estilo, autor, ciudad, tipo, formato, categoría) más novedad, comunidad y descubrimiento, sin repetir autor seguido. Gustos en el móvil (`musikeeo-gustos-v1:<uid|invitado>`) y con cuenta en `users/{uid}/gustos/perfil`. El orden se calcula al entrar y no se mueve mientras miras
- Agentes que prueban la app: `docs/AGENTES.md` (simulación, red social de agentes en emulador o en el Firebase de pruebas, MiroFish). Nunca en producción: los scripts se niegan con `musikeeo-8e766`. Fotos y vídeos de los agentes en `scripts/agentes/medios.json`
- `VITE_EMULADORES=1` (solo `npm run dev`) conecta a los emuladores; `VITE_FIREBASE_*` + `VITE_ENTORNO=pruebas` montan el entorno de pruebas con la misma app

## SESSION LOG

### 2026-11-12 (Cancionero, sesión 1: papeles en su tono, pegar bien y rediseño, a `main`)

**✅ Hecho:**
- Importar papeles de Drive (`lib/papeles.ts`): quita el número («12 - …»), reconoce alias entre paréntesis y erratas de una letra, mixes («+») como «Mix: …»; cada papel cae en el tono de su ficha (`tonoDelPapel`: respeta el capo; si duda, no lo mueve y le pone la etiqueta «Revisar tono»). Pruebas en `scripts/importar/papeles.test.ts`.
- Pegar desde webs de acordes con su formato (`lib/pegado.ts`), LaCuerda la primera con logo en «Falta la letra», y «Completar letras» (`components/cancionero/CompletarLetras.tsx`). No se baja nada de esas webs (decisión de Víctor, informe en `docs/LEGAL-CANCIONERO.md`).
- Rediseño (sueños en Aura, lienzo «Cancionero · color»; detalle en `docs/PETICIONES-CANCIONERO.md` §14): cabecera del repertorio con «Tocar» grande; barra de 5 botones en la canción (`PanelAjustes` con `seccion`); filtros en iconos y mantenimiento detrás de ⋯ en Canciones; Tocar con anterior · Auto (amarillo) · siguiente y el resto en ⋯.
- Teleprompter «Línea a línea» en Tocar (⋯; clave `musikeeo-tocar-linea`, `lib/teleprompter.ts`): línea de ahora en negrita (`data-linea`/`data-ahora` en `HojaCancion`, estilos `.teleprompter` en `index.css`), por tiempo con Auto, corregida tocando o con el pedal; sin red.

**❌ Pendiente:**
- Duración de la versión estimada y «medir grabándote» (abrir `microphone=(self)` en `vercel.json`).
- Listas personalizadas y Cancionero a lo ancho en PC (§21c).
- Víctor: elegir si le gusta la mezcla del rediseño; desplegar reglas.

### 2026-11-11 (Cancionero: editor con formato y enlace para los músicos, a `main`)

**✅ Hecho (segunda sesión del día, en paralelo a la de importar/ajustes/teleprompter):**
- **Letra con formato ligero** (lo respeta `lib/acordes.ts`): `**negrita**`, `==resaltado==` (también partidos por un acorde: `formatearTrozos`), `# Título` (sale como sección) y `> Aviso` (baldosa melocotón, `nota` con `aviso`). Botones encima del texto en el editor (`components/cancionero/FormatoLetra.tsx`). La letra sigue siendo texto plano: tono, cejilla, «que quepa», Tocar y sin red, igual.
- **Notas con formato** (Tiptap 3, `components/notas/EditorNotas.tsx`, extensiones `Aviso` y `Tinta` en `extensiones.ts`): títulos, negrita/cursiva/subrayado/tachado, resaltado y color de texto con los pastel, listas, casillas, avisos, enlaces, deshacer; «/» abre el menú de bloques; en el móvil la barra va encima del teclado (visualViewport, en un portal). Se guarda el JSON del documento en texto: `Cancion.notas` (Notas de la canción) y `Repertorio.notas` (Hoja del bolo). Se pintan con `NotasRicas` (React, sin innerHTML, sin cargar Tiptap). Salen en el lector, el escenario, Tocar y el enlace del grupo. Reglas: `notas` string ≤ 30 000 en canciones y repertorios. El editor (~135 kB gz) va en su trozo y entra en el precache.
- **Compartir con el grupo** (`lib/compartir.ts`, `components/cancionero/CompartirGrupo.tsx`, página `/grupo` en `pages/cancionero/Grupo.tsx`, fuera de MainLayout, sin cookies ni Rodrigo): el repertorio entero comprimido (fflate, base64url) tras `#` → no viaja al servidor, funciona sin reglas desplegadas y sin red una vez abierto. Cifrado por defecto (`soloCifrado`: partes, avisos y acordes; filas iguales seguidas → «(x2)»); letra si se elige. Lleva `s` = semitonos para que suene en su tono. Página oscura: lista (tono, capo, canta, estilo, bpm, duración, total, hoja del bolo) y escenario deslizando con tono ± y tamaño ± (se recuerda), pedal/flechas.
- Probado con Playwright en iPhone 13 simulado (editor, «/», lector, Tocar, enlace en otro navegador sin datos) y sin red (enlace y editor abren). Sin errores en consola.

- **Después, la misma noche (peticiones nuevas de Víctor):**
  - `ficha.etiquetas: string[]` y `ficha.enlace?: string` (editor de la ficha, lector, filtros y agrupar en `biblioteca.ts`, reglas; al importar, las etiquetas se SUMAN en `unirFichas`; directivas `{etiquetas:}`, `{apto para:}`, `{enlace:}`).
  - Vistas con `components/cancionero/SelectorVista.tsx` (Lista · Cifrado · Bloques), en el repertorio (`?vista=`) y en Canciones. **Cifrado** = `HojaSet` (`VistaCifrado.tsx`): el set seguido con tono grande, ficha, notas, partes y avisos, sin letra (`temaDe`/`soloCifrado` en `lib/compartir.ts`: un dibujo de 1-4 filas que se repite → «(xN)»). Tocar un título abre la canción y al volver la hoja sigue donde estaba (sessionStorage). «En directo» (`CifradoEnDirecto`): pantalla completa, oscura, Auto con velocidad, tamaño, pedal y pantalla encendida. El enlace del grupo usa el mismo componente.
  - **Hueco del bolo** (`repertorio.hueco`, minutos, en reglas): «Te pasas 4 min» / «Te sobran X» / «Clavado al hueco».
  - **Diagramas de acordes** (`lib/diagramas.ts`): posturas calculadas (máx. 4 dedos, cejilla, abertura de 4 trastes, bajo correcto) y las de siempre primero; SVG en `Diagrama.tsx`. Tocar un acorde en cualquier `HojaCancion` (data-acorde, el nombre que se ve: con tono y cejilla) abre `VisorDiagramas` (montado una vez en `App.tsx`, avisado por `lib/verAcorde.ts`) con «Cambiar»; «Ver acordes» en la canción los enseña todos.
  - **Bloques** (`TableroBloques.tsx`, `lib/tablero.ts`): columnas por Estilo · Grupo · Canta · Tono · Energía · Estado · Etiquetas (en el repertorio también por bloque del set). Arrastrar por el asa (pointer events, sirve en el táctil) cambia ese dato de la ficha, con Deshacer; en el set, cambia el «[Bloque]» de la primera línea y lo coloca tras el último tema de ese bloque. «Añadir aquí» abre Nueva canción con `?campo=&valor=`.

- **Noche del 11 al 12-nov (Víctor durmiendo; el bolo es el sábado 14):**
  - **Vista Tabla** (`components/cancionero/TablaCanciones.tsx`), como la de Notion:
    - celdas editables;
    - ordenar, agrupar y elegir columnas, que se recuerdan (`musikeeo-tabla-set` / `-biblioteca`);
    - título fijo al deslizar de lado.
  - **Versiones ⭐**:
    - `cancion.favorita`, con `versionesDe`/`pesoVersion` en `biblioteca.ts`;
    - `ficha.tonoAlt`;
    - cejilla «Suena | Formas»: `ajustes.cejillaGuardada`, `cejillaDeFicha`, `hooks/useFormas.ts` y `SuenaFormas`.
  - **Desplegar filas**: `FilaDesplegable.tsx`, en la Lista del repertorio y de Canciones.
  - **Repertorios sin fecha**: van a «Archivados» y no cuentan como «Próximo bolo».
  - **Copia .json**: guarda `notas`, `favorita`, `hueco` y la hoja del bolo. Falta que el importador de la sesión 1 los lea; se le pasaron los cambios exactos.
  - **Enlace del grupo**:
    - QR (`CodigoQR.tsx`, `qrcode-generator`);
    - «Formas» en la página del músico;
    - aviso «Solo para tu grupo» al compartir con letra;
    - `/grupo` sin indexar (meta robots y `X-Robots-Tag` en `vercel.json`);
    - probado en producción con 18 temas (1.723 caracteres).
  - **Legal**: `/avisos-derechos` (`pages/legal/AvisosDerechos.tsx`) y el apartado «7 bis. Cancionero» de los términos.
  - **Ordenador**: el Cifrado sale en una cuadrícula de 2-3 columnas (`HojaSet ancho`), y Tabla, Bloques y Cifrado van a lo ancho con `xl:-mx-24 min-[1400px]:-mx-40 2xl:-mx-44` (medido a 1280, 1366, 1400 y 1536 px: ya no se meten bajo la barra lateral). La hoja de Importar se ensancha en el PC (`lg:max-w-2xl`). Importar y abrir sin red, probado el 12-nov.

**❌ Pendiente:**
- Víctor: desplegar reglas (ahora también `notas`, `hueco` y `ficha.etiquetas`/`ficha.enlace`, `favorita`, `ficha.tonoAlt`).
- Desplegar una fila de la Lista del repertorio para ver sus acordes sin salir (no hecho).
- Diagramas: solo guitarra (no ukelele ni piano).
- No se pudo añadir el repo de Aura a la sesión (permiso denegado): el editor está hecho desde cero con la misma base (Tiptap 3).
- Enlace corto que se actualice solo (documento público `compartidos/{id}`: get público, list solo del dueño) cuando haya reglas; hoy hay que reenviar el enlace si cambia el set.
- Con formato en la letra, el acorde se coloca sobre el texto sin marcas: puede correrse un par de letras. No se soñó en Aura Studio (prisa por el bolo del 14).

### 2026-11-11 (Cancionero: ficha, biblioteca con filtros y repertorios, a `main`)

**✅ Hecho:**
- Rama `claude/brave-johnson-n6gnpi` revisada (build, eslint) y pasada a `main` en avance directo (a95361b).
- Probado con Playwright en un iPhone 13 simulado: biblioteca → filtro por grupo → «Elegir» → repertorio nuevo → Tocar, y luego con la red cortada (inicio, repertorio, Tocar y canción abren). Sin errores en consola.
- Arreglo: en Tocar sale «Canta X» según la ficha (antes solo si venía escrito en el texto).

**❌ Pendiente:**
- Víctor: desplegar reglas (`git pull origin main` + `firebase deploy --only firestore --project musikeeo-8e766`); sin eso el mapa da «No se ha podido guardar» y el cancionero no sube a la cuenta. Propuesta: GitHub Action con cuenta de servicio (no creada hasta que diga).
- Hecho después, el mismo día (todo en `main`, probado en iPhone simulado y sin red): modo auto en Tocar, «Poner tempo y duración», duración en cada fila y a mano, acordes rápidos por partes, versiones. Bpm de los 32 temas de Pallejà sacados con `scripts/tempo` y mandados a Víctor (no van al repo).
- Siguiente: teleprompter (investigar Web Speech en iPhone y sin red antes de construir), enlace del repertorio para los músicos (cuando Víctor corrija tonos y orden).
- Más adelante: Rodrigo con Claude (Anthropic) en vez de Kimi: Víctor dice que ya puso la clave en Vercel; comprobar el NOMBRE de la variable (nunca el valor), cambiar `/api/chat` y probar que contesta. Plan general en `docs/PLAN-RODRIGO-CEREBRO.md`.

### 2026-10-26 (Dossier v3, mapa de musikeers y rellenar el perfil con tu web)

**✅ Hecho:**
- **Todo pasado a `main` el 26-oct** (avance directo de `claude/optimistic-davinci-cd20p2`, sin mezclas) y desplegado en musikeeo.com. **Pendientes de Víctor, ordenados:** `docs/PENDIENTES-VICTOR.md`.
- **Dossier v3** (27 láminas, en Trabajos de Aura, `trb_11czx4n0nh7wq7`):
  - nuevas: «¿Por qué el mundo necesita Musikeeo?», con 10 problemas (a quién le pasa, un caso y qué hace Musikeeo, marcado «Ya» o «En camino»), y «Por qué sabemos que va a funcionar»;
  - las láminas de cifras salen de `docs/pitch/rentabilidad_consejo.py`; fuera los múltiplos de valoración.
- **Mapa «Musikeers cerca»** (`/mapa`, con cuenta). Lo hizo un agente: `src/pages/mapa`, `src/components/mapa`, `src/lib/{geohash,mapa,barrios,ubicacion}.ts` y `src/services/mapaService.ts`.
  - Solo aparece quien lo activa, en una celda geohash de 6 letras; la posición exacta no sale del móvil.
  - Dos modos: «Mi zona» y «Estoy aquí ahora», que caduca a las 4 h.
  - Al tocar a alguien sale su micro perfil con «Escribir» (lleva al chat).
  - Reglas en `firestore.rules` (`mapa/{uid}`).
  - Leaflet va en un trozo aparte y no entra en el precache.
  - Pruebas en `scripts/mapa/`.
- **«Rellénalo con tu web o tu Instagram»** en `/panel/perfil` y en el onboarding del músico. Lo hizo otro agente.
  - `api/leer-perfil.ts` descarga la página con protecciones (`api/_descargar.ts`: nada de IPs privadas, como mucho 3 redirecciones, 8 s y 1,5 MB) y saca los campos con reglas (`src/lib/leerPerfil.ts`) y, si hay clave, con Kimi (`api/_kimi.ts`, compartido con `/api/chat`).
  - Nada se guarda sin que la persona acepte. Las redes van en `Artist.redes`.
  - De Instagram solo se leen las metaetiquetas públicas, una vez. En la práctica casi siempre pide iniciar sesión, y entonces se ofrece pegar la bio.
  - Pruebas en `scripts/leer-perfil/`.

**❌ Pendiente:**
- **Víctor: desplegar las reglas** (`firebase deploy --only firestore --project musikeeo-8e766`), incluida la nueva de `mapa`.
- **Víctor: crear la clave gratuita de CARTO** (carto.com/basemaps/apikey) y ponerla en Vercel como `VITE_CARTO_KEY`. Sin ella, el mapa sale con la marca de agua «API key required».
- Vista previa de Vercel (26-oct): `/api/chat` y `/api/leer-perfil` arrancan bien (los imports `.js` → `.ts` se resuelven). Falta probar una lectura real con Kimi y una web de verdad.
- Ninguna de las dos pantallas nuevas se soñó en Aura Studio (había prisa).
- Mapa: la zona fija vive en cada dispositivo; los «ahora» caducados se quedan en Firestore hasta que su dueño vuelve a abrir la app; el nombre y la foto del mapa no siguen al perfil.
- El técnico no tiene «Rellénalo con tu web»: su ficha no tiene bio ni ciudad.

### 2026-10-25 (Cómo cobrar: consejo de 10 expertos y contacto escondido en el chat)

**✅ Hecho:**
- `docs/REFERENCIAS-MONETIZACION.md`: cómo cobran 20 plataformas.
- **Consejo de 10 agentes expertos** (5 de finanzas y 5 de viabilidad) → `docs/DECISIONES-COBRO.md`. Los informes están en `docs/pitch/consejo/` y el modelo en `docs/pitch/modelo_consejo.py`.
- **En una frase:** se cobra la primera vez y la herramienta, nunca la repetición.
  - Bares y salas: 10 % + IVA solo la primera vez con cada artista, cobrado al aceptar.
  - Bodas: gestión y garantía que paga el cliente (10 % + IVA de lanzamiento, luego 12 %); el músico, 0 %.
  - Suscripciones: Plan Sala 29 €, Pro 7,99 €, Cancionero Pro 24,99 €/año.
  - **Fuera la postulación destacada:** inflaba el modelo y es cobrar a quien busca trabajo.
- **Cifras nuevas del año 5 (base, 60 % del volumen):** 1,96 M€ de ingresos y 669 k€ de margen; una estructura de 25 k€/mes se cubre desde el mes 41. El modelo de hoy (4,47 M€ y 1,96 M€) estaba inflado.
- **Lo que más pesa:** lo que cuesta conseguir unos novios (tope de 50 €).
- **En la app:** teléfonos, emails, @usuarios y enlaces a WhatsApp, Telegram y redes se ocultan en el chat hasta aceptar una propuesta (`src/lib/fuga.ts`). Lo hace el móvil y no se guarda lo oculto; al aceptar, el chat queda con `contactoLibre`. Probado con dos cuentas en el emulador.
- Privacidad y condiciones al día con esa regla.

**❌ Pendiente:**
- ~~El dossier sigue con las cifras viejas~~: hecho el 26-oct (dossier v3).
- **Antes del primer euro** (lista en `DECISIONES-COBRO.md`):
  - SL;
  - dictamen de un asesor laboral y fiscal;
  - modelo 040 (DAC7);
  - Stripe Connect;
  - 18 años para cobrar y contratar.
- **Primer euro posible:** la mesa de eventos de empresa (Mobile World Congress, marzo de 2027), facturando un 12 %. La vende Víctor.
- **App:**
  - contar las propuestas y los avisos, y preguntar «¿con factura?»;
  - regla de Firestore de respaldo para el chat;
  - repertorios de banda (base del Cancionero Pro);
  - preventa Pro Fundadores.

### 2026-10-25 (Operación Inversores Manu: demo, vídeos y presentación)

**✅ Hecho:** recorrido de la app como la verá Manu (móvil y ordenador, datos de demostración de producción): todo funciona; el botón flotante de Rodrigo tapaba «Buscar» en la portada y se montaba en el Feed (ahora sale al bajar del hero y no sale en el Feed). Vídeo largo v2 (52 s) y vídeo corto (17 s) con pantallas reales, Cancionero y Feed (`docs/VIDEOS.md`). Dossier para inversores de 24 láminas en PDF con la línea de la app: fuente en `docs/pitch/presentacion/` (ver su LEEME), cifras de `docs/pitch/investigacion.md` y `docs/pitch/modelo_financiero.py` (traídos de la rama del 22-oct). NO pide una cantidad (Víctor: «no es para pedir x dinero, es para presentarla como rentable»): previsiones de ingresos a 5 años en 3 escenarios, margen de contribución (44 % en el año 5, base), desde qué mes paga una estructura fija de 10/25/50 k€ al mes (base: mes 22/29/37), LTV/CAC, sensibilidad, valor de la empresa y riesgos; las láminas financieras se generan del modelo (`docs/pitch/rentabilidad.py`). La historia de la correa: el cinturón de seguridad del coche de la madre de Víctor (no de un colega del público). Todo en Trabajos del Studio de Aether Labs (proyecto Musikeeo). La presentación del 22-oct no apareció (ni Aura personal ni de empresa, ni Drive): se hizo nueva.

**❌ Pendiente:**
- **Víctor: desplegar las reglas de verdad.** El 25-oct se lanzó `firebase deploy --only firestore` desde el PC, pero esa copia de `main` era vieja (último cambio de reglas 245fdf3): no subió nada nuevo y `posts` sigue dando permiso denegado. Antes: `git pull origin main` en `C:\Users\Usuario\Desktop\Dev\Musikeeo`, y luego `firebase deploy --only firestore --project musikeeo-8e766`. Sin esto, en musikeeo.com no se ven publicaciones ni funcionan me gusta, comentarios ni el Cancionero en la cuenta
- Dossier: el papel de Adrián y de David y el apellido de David (lámina 13). Los costes fijos del modelo del 22-oct (equipo de 3 a 26 personas) ya no se enseñan: «no necesitamos tanta pasta»
- Para la demo en el móvil: el Cancionero de Víctor (repertorio de Lloret) vive en SU móvil; el de las capturas es un repertorio de ejemplo con canciones inventadas, solo en el navegador de las capturas

### 2026-10-25 (Feed con me gusta y comentarios, algoritmo «Para ti», agentes y MiroFish)

**✅ Hecho:** me gusta y comentarios de verdad en publicaciones, tarjetas y vídeos de artista (también en el visor y /reels); algoritmo personalizado probado con agentes simulados (con el perfil vacío pasa del 18 % al 34 % de acierto en dos semanas, techo 36 %; `docs/SIMULACION-FEED.md`); red social de agentes sobre el emulador, vista en la app con capturas; entorno de pruebas preparado (config por variables, píldora «Entorno de pruebas», tarea de GitHub cada 4 h); MiroFish instalado y semilla de Musikeeo escrita. 8 retratos generados para los agentes (0,40 €) + 21 clips y fotos reutilizados de Aura Studio.

**❌ Pendiente:**
- **Víctor: desplegar reglas e índices** — `firebase deploy --only firestore` (en producción: posts, interacciones, gustos, índice de meGusta). Sin esto, en musikeeo.com no se pueden leer publicaciones ni dar me gusta ni comentar (hoy `posts` da permiso denegado)
- **Víctor: crear el Firebase `musikeeo-pruebas`** y los secretos (pasos en `docs/AGENTES.md` §3)
- **Víctor: claves** `LLM_API_KEY` (Kimi; en Vercel está como «sensible» y no se puede leer) y `ZEP_API_KEY` (gratis) como variables del entorno de Claude, para comentarios con IA y para lanzar MiroFish
- No se soñó en Aura Studio la hoja de comentarios ni la columna de acciones (siguen el lenguaje de la hoja de publicar y del visor)

### 2026-10-25 (Cancionero: color, buscador, quien canta, rendimiento)

**✅ Hecho (rama `cancionero-color`):** sueño en Aura Studio (los 4 primeros conceptos, sin referencias, se descartaron: «ninguno tiene el branding»; se rehízo con el sueño de Explorar como referencia y gustó). Inicio con baldosas y la tarjeta del próximo bolo, repertorio por bloques de color, canción con partes de color y «Dame el tono», Tocar en claro. Equipo en paralelo: buscador con el catálogo de Apple y portadas, herramientas de quien canta, importar Word/PDF, rendimiento (el cancionero sale en <1 s aunque Firebase tarde; deslizar en Tocar sin tirones).

Después, el mismo día: pegar letra sola de una web con «Seleccionar todo» entra limpia (`recortarLetra`), enlace a Chordify, y **Sacar acordes de un audio** (nuestro «Chordify» en el móvil, ver arriba). Para medirlo, un corpus de 114 grabaciones con acordes conocidos (GuitarSet CC BY 4.0, Winterreise 1933 dominio público, 30 sintéticas); se regenera con `scripts/escuchar`.

**❌ Pendiente:**
- **Víctor: desplegar las reglas** (`portada`, `duracion`, `muestra`, `bpm` en canciones) — `firebase deploy --only firestore:rules`
- Sacar acordes: probar en un iPhone de verdad (tiempo con una canción de 4 min, mp3/m4a de Archivos); secciones (estrofa/estribillo) por repetición; escuchar con el micro (habría que abrir `microphone` en `vercel.json`)
- Probar en un iPhone de verdad el sonido (interruptor de silencio, Bluetooth) y el pedal
- El buscador vuelve a pintar las 53 filas en cada tecla; Firebase en el arranque (~0,5 s)
- `vercel.json` manda `Permissions-Policy: microphone=()`: si algún día se usa el micro (afinador), hay que abrirlo

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

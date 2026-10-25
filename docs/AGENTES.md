# Agentes que prueban Musikeeo

Personas simuladas que usan la app de verdad: suben vídeos y fotos, publican bolos y anuncios,
miran el Feed «Para ti», dan me gusta y comentan. Sirven para probar la app y el algoritmo del
Feed con movimiento real, **sin tocar musikeeo.com**.

> Regla: los agentes nunca entran en producción. En musikeeo.com no se inventa actividad (ni me
> gusta, ni comentarios, ni reseñas): quien llega tiene que ver gente real. Los scripts se
> niegan a usar el Firebase de producción (`musikeeo-8e766`).

## Las tres piezas

| Pieza | Qué hace | Dónde |
|---|---|---|
| Simulación del Feed | Agentes que «usan» el Feed 14 días en memoria y miden si el algoritmo les enseña lo que les gusta. Sin Firebase, en 2 s. | `scripts/agentes/simular-feed.ts` → informe en `docs/SIMULACION-FEED.md` |
| Red de agentes | Agentes con cuenta propia en un Firebase de pruebas que publican, miran el Feed (ordenado por el algoritmo de la app) y dan me gusta y comentan con el mismo código y las mismas reglas que la app. | `scripts/agentes/red-social.ts` |
| MiroFish | Motor de enjambre (github.com/666ghj/MiroFish) que inventa a cientos de personas de la escena a partir de un documento y simula cómo reaccionan a Musikeeo. Sus agentes se pueden poner a usar el Feed. | `scripts/agentes/mirofish/` |

Los agentes propios están en `scripts/agentes/personas.ts` (rumbero de Gràcia, DJ de bodas de
Girona, técnico de sonido, sala del Poblenou, wedding planner, guitarrista de jazz de Madrid,
tienda de guitarras y dúo de pop de Valencia). Cada uno tiene lo que pone en su perfil y lo que
le gusta de verdad, que el algoritmo tiene que descubrir.

Sus fotos y vídeos están en `scripts/agentes/medios.json`: los 8 retratos generados para ellos
(GPT Image 2.5 Flare, 0,05 € cada uno) y los clips y fotos que ya había en Aura Studio (Studio de
Aether Labs, proyecto Musikeeo, lienzos «Visuales de la web» y «Red de agentes (pruebas)»). Para
añadir más, se genera en Aura y se apunta la URL en ese fichero.

## 1. Simulación del Feed (sin nada que instalar)

```bash
node scripts/agentes/simular-feed.ts                         # agentes propios, catálogo sintético
node scripts/agentes/simular-feed.ts --produccion            # + artistas, bolos y anuncios reales (solo lectura)
node scripts/agentes/simular-feed.ts --mirofish=perfiles.json  # + los agentes de MiroFish
node scripts/agentes/simular-feed.ts --informe=docs/SIMULACION-FEED.md
```

Compara el algoritmo con «solo perfil», «por fecha» (como era el Feed), «al azar» y el techo
posible. Resultado del 25-oct: con el perfil vacío (lo normal), el algoritmo pasa del 18 % al
34 % de acierto en dos semanas, cerca del techo (36 %). Por fecha se queda en el 18 %.

## 2. Red de agentes en tu ordenador (emulador)

```bash
npx firebase-tools emulators:start --only auth,firestore      # terminal 1, déjalo abierto
node scripts/agentes/red-social.ts --sembrar                   # copia el catálogo público y crea los agentes
node scripts/agentes/red-social.ts --rondas=20 --cada=30       # 20 rondas, una cada 30 s
VITE_EMULADORES=1 npm run dev                                  # terminal 2 → http://localhost:5173/feed
```

Para entrar en la app como un agente: `rumbero-bcn@agentes.musikeeo.test` (o el id de cualquier
persona) con la contraseña `agente-musikeeo`. Arriba sale la píldora «Entorno de pruebas».

## 3. Entorno de pruebas permanente (lo que te toca hacer, Víctor)

Es la misma app con su propio Firebase. Los agentes viven ahí y una tarea de GitHub
(`.github/workflows/red-de-agentes.yml`) los pone a publicar, mirar y comentar cada 4 horas.

1. **Firebase nuevo** (gratis, 5 min): console.firebase.google.com → Añadir proyecto →
   `musikeeo-pruebas`. Dentro: Authentication → Correo y contraseña → activar. Firestore
   Database → crear (Europa). Configuración del proyecto → Tus apps → Web → registrar → copia
   el bloque `firebaseConfig`.
2. **Reglas e índices** desde tu PC, en la carpeta del repo:
   `firebase deploy --only firestore -P musikeeo-pruebas`
3. **Secretos en GitHub** (repo → Settings → Secrets and variables → Actions):
   `PRUEBAS_FIREBASE_PROJECT_ID`, `PRUEBAS_FIREBASE_API_KEY`, `PRUEBAS_FIREBASE_AUTH_DOMAIN`
   (del bloque `firebaseConfig`) y `LLM_API_KEY` (la clave de Kimi, para que comenten con IA;
   sin ella comentan con frases de plantilla).
4. **Web de pruebas en Vercel**: proyecto nuevo `musikeeo-pruebas` desde el mismo repo, con las
   variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` y
   `VITE_ENTORNO=pruebas`. Sin esas variables la app usa producción, así que musikeeo.com no cambia.
5. En GitHub → Actions → «Red de agentes (pruebas)» → Run workflow, para la primera ronda.

## 4. MiroFish

Se instaló sin problemas en la sesión del 24-25 oct (backend con Python 3.12 + OASIS, frontend Vue), pero todavía no se ha lanzado ninguna simulación: faltan las dos claves.
Necesita dos claves: un modelo de texto con formato OpenAI (Kimi vale: `LLM_API_KEY`) y Zep para
la memoria de los agentes (`ZEP_API_KEY`, plan gratis en app.getzep.com).

```bash
LLM_API_KEY=… ZEP_API_KEY=… bash scripts/agentes/mirofish/preparar.sh
cd ~/mirofish && npm run dev        # http://localhost:3000
```

En su web: idioma Español, subir `semilla-musikeeo.md`, pegar `requisito.md` como lo que se
quiere predecir y empezar con pocas rondas (gasta tokens). Devuelve un informe y se puede
hablar con cada agente. Sus agentes (`backend/uploads/simulations/<id>/reddit_profiles.json`)
pueden usar el Feed: `--mirofish=<ese fichero>` en la simulación o en la red de agentes.

MiroFish es AGPL-3.0: se usa como herramienta aparte, su código no se copia a este repo.

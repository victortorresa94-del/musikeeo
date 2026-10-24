// Vercel Serverless Function — Rodrigo AI via Kimi (Moonshot AI, API directa)
// POST /api/chat  { message: string, history: {role, content}[] }
// POST /api/chat  { mode: 'filtros', message, categoria, opciones, hoy } → { filtros, explicacion } (Explorar)

const RODRIGO_SYSTEM_PROMPT = `
IDENTIDAD PROFUNDA, FILOSOFÍA Y ESTÁNDARES DE RODRIGO

Eres Rodrigo, el asistente experto de Musikeeo, especializado exclusivamente en música en vivo, eventos reales y contratación de músicos.

No eres un chatbot genérico.
No eres un asistente conversacional pasivo.
No estás aquí para entretener, rellenar silencios ni sonar simpático.

Tu rol es el de un manager musical con experiencia real, alguien que ha tratado con músicos, promotores, bares, bodas, ayuntamientos y eventos privados. Conoces cómo funcionan los bolos, los cachés, las prisas, los cambios de última hora y la falta de claridad de muchos clientes.

Tu función es ordenar el caos, guiar decisiones y conectar personas con música en directo de forma eficiente y humana.

MISIÓN PRINCIPAL

Tu misión es siempre empujar la conversación hacia una acción real dentro de Musikeeo.
Objetivos válidos:

1. Ayudar a crear un evento musical o publicar un bolo
2. Ayudar a encontrar músicos adecuados para un evento
3. Ayudar a un músico a encontrar bolos u oportunidades
4. Crear el perfil de artista del usuario
5. Publicar un anuncio de equipo en el mercado (vender, alquilar o prestar)

Si una respuesta tuya no contribuye directa o indirectamente a uno de esos objetivos, esa respuesta es incorrecta.

MENTALIDAD (CÓMO PIENSAS)

- Sabes que la gente no suele tener toda la información clara.
- Sabes que muchos usuarios van con prisa, escriben mal o se frustran rápido.
- Sabes que hacer 5 preguntas seguidas mata cualquier conversación.
- Tu prioridad no es la perfección del dato, sino el avance de la conversación.

TONO Y PERSONALIDAD

Hablas en español natural, cercano, claro y directo.
Tu tono es profesional pero humano, seguro sin ser arrogante, cercano sin ser payaso.
No usas lenguaje corporativo, frases de marketing ni disclaimers innecesarios.
Emojis: muy pocos, solo cuando encajan con música o eventos.

REGLAS ABSOLUTAS DE DIÁLOGO

1. Nunca repites lo que dice el usuario.
2. Nunca usas frases genéricas como "Sobre X…", "Tengo algunas recomendaciones…"
3. Nunca haces más de una pregunta por mensaje.
4. Cada mensaje tuyo debe mostrar progreso.
5. Si el usuario ya ha dado un dato, queda prohibido volver a preguntarlo.

DETECCIÓN DE INTENCIÓN

Antes de responder, detecta la intención: SALUDO / CREAR EVENTO o PUBLICAR BOLO / BUSCAR MÚSICOS / SOY MÚSICO BUSCO BOLOS / CREAR MI PERFIL / VENDER-ALQUILAR EQUIPO / AYUDA / AMBIGUO.
Si es clara, entra directamente en el flujo. Si es ambigua, haz UNA sola pregunta aclaratoria.

RITMO: 1 dato por turno, 1 pregunta por turno, 1 avance visible por turno.

RECOMENDAR ARTISTAS Y BOLOS — SOLO LOS QUE EXISTEN

Al final de estas instrucciones tienes el CATÁLOGO REAL de Musikeeo: los artistas con perfil público y los bolos abiertos ahora mismo.
REGLA DURA: nunca inventes un artista, un bolo, un precio, una reseña ni un enlace. Solo puedes recomendar lo que sale en el catálogo, con sus datos tal cual.
Si nada del catálogo encaja (otra ciudad, otro estilo) dilo claro y en una frase, y propón lo útil: publicar el bolo para que le escriban los artistas (deja el borrador [PUBLISH_EVENT]) o buscar en Explorar (/discover).

Formato para un artista del catálogo:

[ARTISTA]
Nombre: {nombre tal cual}
Formato: {si se sabe; si no, omite la línea}
Estilo: {sus géneros}
Por qué encaja: {explicación breve con lo que te ha contado el usuario}
Precio orientativo: {"desde X €" si el catálogo lo dice; si no, "a consultar"}
Link: /artist/{slug del catálogo}
[/ARTISTA]

Muestra máximo 3 artistas.

Formato para un bolo del catálogo:

[BOLO]
Título: {título tal cual}
Fecha: {fecha}
Ubicación: {ciudad}
Formato buscado: {si se sabe; si no, omite la línea}
Caché: {"X €" si el catálogo lo dice; si no, "a consultar"}
Link: /eventos/{id del catálogo}
[/BOLO]

PUBLICAR DESDE EL CHAT — BORRADORES

Puedes dejar preparados tres tipos de borrador. La app los muestra como una tarjeta y el USUARIO decide publicarlos pulsando un botón.
Nunca digas que algo "ya está publicado": tú solo lo dejas listo.
Pide lo que falte de uno en uno (una pregunta por mensaje). En cuanto tengas lo mínimo, genera el bloque; lo demás lo completas tú con sentido común.
Cuando generes un bloque, tu texto es una sola frase corta, por ejemplo: "Te lo he dejado listo. Revísalo y dale a publicar." No añadas [ARTISTA] ni [BOLO] en ese mensaje.

1) ANUNCIO DEL MERCADO — mínimo: qué es, si se vende/alquila/presta, precio (salvo préstamo) y ciudad.

[CREAR_ANUNCIO]
Título: {título claro, marca y modelo si los hay}
Tipo: {venta | alquiler | prestamo}
Categoría: {guitarras | bajos | teclados | bateria | viento | accesorios | pa_sonido | iluminacion | recording | partituras | cuerdas | otros}
Estado: {nuevo | como_nuevo | bueno | aceptable}
Precio: {número en euros, 0 si es préstamo}
Unidad: {dia | semana | total — solo si es alquiler}
Ciudad: {ciudad}
Descripción: {2-3 frases útiles para el comprador, en una sola línea}
Urgente: {sí | no}
[/CREAR_ANUNCIO]

2) BOLO / EVENTO — mínimo: qué música buscan, fecha, ciudad y presupuesto aproximado.

[PUBLISH_EVENT]
Título: {título claro, p. ej. "Banda de rumba para boda en Sitges"}
Fecha: {YYYY-MM-DD}
Hora: {HH:MM}
Ubicación: {ciudad o lugar}
Descripción: {resumen en una línea}
Tipo: {gig | jam | session | festival}
Géneros: {lista separada por comas}
Presupuesto: {cifra numérica aproximada}
[/PUBLISH_EVENT]

3) PERFIL DE ARTISTA — mínimo: nombre artístico, formato, estilos y ciudad.

[CREAR_PERFIL]
Nombre artístico: {nombre}
Ciudad: {ciudad}
Formato: {solista | dúo | trío | banda | DJ | otro}
Géneros: {lista separada por comas}
Bio: {2 frases en primera persona, cercanas, en una sola línea, basadas SOLO en lo que te ha contado}
Precio desde: {número en euros o vacío}
Extras: {equipo propio, viaja, idiomas… separados por comas o vacío}
[/CREAR_PERFIL]

Nunca inventes datos que el usuario no te ha dado (precios, fechas, nombres). Si falta algo imprescindible, pregúntalo.
`;

// --- Limites defensivos -----------------------------------------------------
// Para produccion real conviene un store distribuido (p.ej. Upstash Redis).
// Esto es defensa basica in-memory: efectiva contra rafagas en un mismo
// contenedor caliente; en multi-instancia el limite real es N * RATE_LIMIT.
const RATE_LIMIT = 20;          // peticiones permitidas por ventana
const RATE_WINDOW_MS = 60_000;  // ventana de 60s
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_CHARS = 6000; // suma de contenidos en history

// API de Kimi (Moonshot AI), compatible con el formato OpenAI.
// Modelo y endpoint configurables desde Vercel sin tocar codigo.
// Si un endpoint devuelve 401 se prueba el siguiente: una key de platform.moonshot.cn
// solo vale en .cn y una de Kimi Code en api.kimi.com. KIMI_BASE_URL (si existe) va primero.
const MODEL = process.env.KIMI_MODEL || 'kimi-k2-turbo-preview';
const KIMI_ENDPOINTS: { baseUrl: string; model: string }[] = [
  ...(process.env.KIMI_BASE_URL ? [{ baseUrl: process.env.KIMI_BASE_URL.replace(/\/$/, ''), model: MODEL }] : []),
  { baseUrl: 'https://api.moonshot.ai/v1', model: MODEL },
  { baseUrl: 'https://api.moonshot.cn/v1', model: MODEL },
  { baseUrl: 'https://api.kimi.com/coding/v1', model: 'kimi-for-coding' },
].filter((e, i, a) => a.findIndex((x) => x.baseUrl === e.baseUrl) === i);
const MAX_TOKENS = 800;

// Si el endpoint acepta la key pero el modelo da 404 ("Not found the model ... or
// Permission denied"), la cuenta no tiene acceso a ese modelo: se prueban estos.
const FALLBACK_MODELS = ['kimi-k2-0905-preview', 'kimi-k2-0711-preview', 'kimi-latest', 'moonshot-v1-8k'];

// Endpoint y modelo que funcionaron la ultima vez (contenedor caliente): se prueban primero.
let workingEndpoint = 0;
let workingModel: string | null = null;

// Limpia la key pegada en Vercel: espacios, comillas envolventes y prefijo "Bearer ".
function cleanApiKey(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
}

const rateStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: any): string {
  const fwd = (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return fwd || (req.headers?.['x-real-ip'] as string | undefined) || 'unknown';
}

function rateLimit(ip: string) {
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + RATE_WINDOW_MS;
    rateStore.set(ip, { count: 1, resetAt });
    return { ok: true, remaining: RATE_LIMIT - 1, resetAt };
  }
  if (entry.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

// Poda oportunista para que el Map no crezca indefinidamente.
function pruneRateStore() {
  if (rateStore.size < 500) return;
  const now = Date.now();
  for (const [k, v] of rateStore) {
    if (v.resetAt <= now) rateStore.delete(k);
  }
}

// ─── Catálogo real para que Rodrigo no se invente nada ──────────────────────
// Lectura pública de Firestore por REST (las mismas reglas que ve cualquier visitante).
const FB_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || 'musikeeo-8e766';
const FB_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDTak4DoBdDDcQKqCS5bKVsDwAEYBs52RI';
const CATALOG_TTL_MS = 5 * 60 * 1000;
let catalogCache: { text: string; at: number } | null = null;

const fsVal = (v: any): any => {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
  return undefined;
};

async function runQuery(collectionId: string, extra: Record<string, unknown> = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], limit: 40, ...extra } }),
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) throw new Error(`Firestore ${collectionId} ${r.status}`);
  const rows: any[] = await r.json();
  return rows.filter(x => x.document).map(x => {
    const f = x.document.fields || {};
    const out: Record<string, any> = { id: x.document.name.split('/').pop() };
    for (const k of Object.keys(f)) out[k] = fsVal(f[k]);
    return out;
  });
}

// Lo que escriben los usuarios (nombres, títulos, ciudades) entra en el prompt de Rodrigo:
// como texto de una línea, sin marcas de bloque, con tope de largo y del tipo esperado.
const enCatalogo = (v: unknown, max: number) => limpio(v, max).replace(/[[\]]/g, '');
const listaCatalogo = (v: unknown, n: number, max: number) =>
  Array.isArray(v) ? v.map(x => enCatalogo(x, max)).filter(Boolean).slice(0, n).join(', ') : '';
const ID_CATALOGO = /^[A-Za-z0-9_-]{1,80}$/;
// Solo se piden a Firestore los campos que se usan
const soloCampos = (campos: string[]) => ({ select: { fields: campos.map(fieldPath => ({ fieldPath })) } });

async function getCatalog(): Promise<string> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.text;
  try {
    const [artists, events] = await Promise.all([
      runQuery('artists', {
        ...soloCampos(['artistName', 'slug', 'city', 'genres', 'priceFrom', 'bio']),
        where: { fieldFilter: { field: { fieldPath: 'isPublic' }, op: 'EQUAL', value: { booleanValue: true } } },
      }),
      runQuery('events', soloCampos(['title', 'date', 'location', 'price', 'description'])),
    ]);
    const now = Date.now() - 86400000;
    const test = (x: any) => /Contenido de prueba de Musikeeo/.test(`${x.bio || ''} ${x.description || ''}`) ? ' (PRUEBA)' : '';
    const a = artists
      .filter(x => enCatalogo(x.artistName, 100) && typeof x.slug === 'string' && ID_CATALOGO.test(x.slug))
      .slice(0, 30).map(x => {
        const precio = aEuros(x.priceFrom);
        return `- ${enCatalogo(x.artistName, 100)}${test(x)} · ${[enCatalogo(x.city, 40), listaCatalogo(x.genres, 4, 30)].filter(Boolean).join(' · ')}${precio ? ` · desde ${precio} €` : ''} · slug: ${x.slug}`;
      });
    const e = events
      .filter(x => enCatalogo(x.title, 120) && ID_CATALOGO.test(x.id) && (!x.date || new Date(x.date).getTime() >= now))
      .slice(0, 20).map(x => {
        const precio = aEuros(x.price);
        return `- ${enCatalogo(x.title, 120)}${test(x)} · ${x.date ? new Date(x.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'fecha a concretar'} · ${enCatalogo(x.location, 60) || 'ubicación a concretar'}${precio ? ` · ${precio} €` : ''} · id: ${x.id}`;
      });
    const text = `CATÁLOGO REAL DE MUSIKEEO (actualizado ${new Date().toLocaleString('es-ES')})

ARTISTAS CON PERFIL PÚBLICO:
${a.length ? a.join('\n') : '(todavía ninguno)'}

BOLOS ABIERTOS:
${e.length ? e.join('\n') : '(todavía ninguno)'}

Los marcados (PRUEBA) son de ejemplo: si los recomiendas, avisa de que son de prueba.`;
    catalogCache = { text, at: Date.now() };
    return text;
  } catch (err) {
    console.warn('Catálogo de Rodrigo no disponible:', err);
    return 'CATÁLOGO REAL DE MUSIKEEO: no disponible ahora mismo. No recomiendes artistas ni bolos concretos; manda al usuario a /discover o /eventos.';
  }
}

// Llama a Kimi probando endpoints (ante 401) y modelos (ante 404). Lo usan el chat y los filtros.
// Cada llamada tiene un tiempo máximo: una respuesta colgada no retiene la función.
async function callKimiWithFallbacks(apiKey: string, messages: { role: string; content: string }[], maxTokens: number, extra: Record<string, unknown> = {}, timeoutMs = 60_000) {
  const callKimi = (baseUrl: string, model: string) =>
    fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, ...extra }),
      signal: AbortSignal.timeout(timeoutMs),
    });

  const order = [workingEndpoint, ...KIMI_ENDPOINTS.keys()].filter((v, i, a) => a.indexOf(v) === i);
  const tried: string[] = [];
  const triedModels: string[] = [];
  let upstream: Response | null = null;
  let endpoint = KIMI_ENDPOINTS[0];
  let model = endpoint.model;

  // 1) Endpoint: el primero que no rechace la key (401)
  for (const idx of order) {
    endpoint = KIMI_ENDPOINTS[idx];
    model = workingModel ?? endpoint.model;
    tried.push(endpoint.baseUrl);
    upstream = await callKimi(endpoint.baseUrl, model);
    if (upstream.status !== 401) {
      workingEndpoint = idx;
      break;
    }
    console.error('Kimi 401 en', endpoint.baseUrl);
  }

  // 2) Modelo: si da 404 (sin acceso al modelo), probar los de respaldo
  if (upstream?.status === 404) {
    triedModels.push(model);
    for (const candidate of [endpoint.model, ...FALLBACK_MODELS]) {
      if (triedModels.includes(candidate)) continue;
      console.error('Kimi 404 con modelo', model, '-> probando', candidate);
      model = candidate;
      triedModels.push(model);
      upstream = await callKimi(endpoint.baseUrl, model);
      if (upstream.status !== 404) break;
    }
  }
  if (upstream?.ok) workingModel = model;
  return { upstream, endpoint, model, tried, triedModels };
}

// ─── Modo «filtros»: una frase de Explorar → filtros en JSON ────────────────
// POST /api/chat { mode: 'filtros', message, categoria: {slug, nombre, tipo}, opciones, hoy }
// → { filtros: {...}, explicacion }. Solo JSON, validado y limpio aquí.
type TipoCat = 'artistas' | 'tecnicos' | 'salas' | 'equipo';
const TIPOS_CAT: TipoCat[] = ['artistas', 'tecnicos', 'salas', 'equipo'];
const CLAVES_FILTRO: Record<TipoCat, string[]> = {
  artistas: ['ciudad', 'fecha', 'precioMin', 'precioMax', 'estilos', 'musicos', 'extras', 'idealPara', 'texto'],
  tecnicos: ['ciudad', 'servicios', 'equipo', 'precioMin', 'precioMax', 'texto'],
  salas: ['ciudad', 'texto'],
  equipo: ['ciudad', 'tipo', 'estado', 'precioMin', 'precioMax', 'urgente', 'texto'],
};

const limpio = (v: unknown, max = 40) =>
  typeof v === 'string' ? [...v].map(c => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || '<>`'.includes(c) ? ' ' : c)).join('').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const limpios = (v: unknown, max = 6) =>
  Array.isArray(v) ? [...new Set(v.map(x => limpio(x)).filter(Boolean))].slice(0, max) : [];
const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const aEuros = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 100000 ? Math.round(n) : null;
};
/** El valor tal cual está en las opciones, si casa sin mayúsculas ni tildes */
const comoOpcion = (v: string, opciones: string[]) => opciones.find(o => sinTildes(o) === sinTildes(v)) ?? v;

function opcionesDe(raw: any): Record<string, string[]> {
  const o: Record<string, string[]> = {};
  for (const k of ['ciudades', 'estilos', 'idealPara', 'servicios', 'equipo']) {
    o[k] = Array.isArray(raw?.[k]) ? raw[k].map((x: unknown) => limpio(x)).filter(Boolean).slice(0, 30) : [];
  }
  return o;
}

/** Deja solo las claves de la categoría, con tipos y valores válidos */
export function limpiarFiltros(raw: any, tipo: TipoCat, opciones: Record<string, string[]>) {
  const permitidas = new Set(CLAVES_FILTRO[tipo]);
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  // Por si el modelo los anida en «filtros»
  const src = base.filtros && typeof base.filtros === 'object' && !Array.isArray(base.filtros) ? { ...base, ...base.filtros } : base;
  const f: Record<string, unknown> = {};
  const poner = (k: string, v: unknown) => {
    if (permitidas.has(k) && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) f[k] = v;
  };

  const ciudad = limpio(src.ciudad);
  if (ciudad) poner('ciudad', comoOpcion(ciudad, opciones.ciudades || []));
  const fecha = sinTildes(limpio(src.fecha, 12));
  if (fecha === 'sabado' || fecha === 'finde') poner('fecha', fecha);
  else if (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha))) poner('fecha', fecha);
  let min = aEuros(src.precioMin), max = aEuros(src.precioMax);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  poner('precioMin', min);
  poner('precioMax', max);
  poner('estilos', limpios(src.estilos).map(e => comoOpcion(e, opciones.estilos || [])));
  const musicos = sinTildes(limpio(src.musicos, 8));
  if (['solista', 'duo', '3-5', '6+'].includes(musicos)) poner('musicos', musicos);
  poner('extras', limpios(src.extras).map(sinTildes).filter(e => ['sonido', 'viajan', 'video'].includes(e)));
  poner('idealPara', limpios(src.idealPara).map(e => comoOpcion(e, opciones.idealPara || [])));
  poner('servicios', limpios(src.servicios).map(e => comoOpcion(e, opciones.servicios || [])));
  poner('equipo', limpios(src.equipo).map(e => comoOpcion(e, opciones.equipo || [])));
  const t = sinTildes(limpio(src.tipo, 10));
  if (['venta', 'alquiler', 'prestamo'].includes(t)) poner('tipo', t);
  poner('estado', limpios(src.estado).map(e => sinTildes(e).replace(/\s+/g, '_')).filter(e => ['nuevo', 'como_nuevo', 'bueno', 'aceptable'].includes(e)));
  if (src.urgente === true) poner('urgente', true);
  poner('texto', limpio(src.texto));

  return { filtros: f, explicacion: limpio(src.explicacion, 160) };
}

/** El primer objeto JSON de la respuesta (por si el modelo lo envuelve en ``` o en una frase) */
export function extraerJson(content: string): any | null {
  const sinBloques = content.replace(/```(?:json)?/gi, '');
  const a = sinBloques.indexOf('{'), b = sinBloques.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(sinBloques.slice(a, b + 1)); } catch { return null; }
}

function promptFiltros(cat: { nombre: string; tipo: TipoCat }, opciones: Record<string, string[]>, hoy: string) {
  const lista = (xs: string[] | undefined) => (xs && xs.length ? xs.join(', ') : '(ninguna)');
  const d = new Date(`${hoy}T12:00:00`);
  const hoyBonito = Number.isNaN(d.getTime()) ? hoy : d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const claves: Record<string, string> = {
    ciudad: `string. Usa una de estas si encaja: ${lista(opciones.ciudades)}. Si el lugar es un pueblo o un barrio cerca de una de ellas (p. ej. Sitges → Barcelona), pon esa ciudad y dilo en la explicación.`,
    fecha: '"sabado" (este sábado), "finde" (este fin de semana) o una fecha "YYYY-MM-DD".',
    precioMin: 'número en euros (lo mínimo).',
    precioMax: 'número en euros (el presupuesto máximo: «menos de 1.500 €» → 1500).',
    estilos: `array de estilos musicales. Usa estos nombres si encajan: ${lista(opciones.estilos)}.`,
    musicos: '"solista" | "duo" | "3-5" | "6+".',
    extras: 'array con "sonido" (llevan sonido propio), "viajan" (se desplazan) o "video" (tienen vídeo).',
    idealPara: `array, solo de: ${lista(opciones.idealPara)} (p. ej. «para una boda» → "Bodas").`,
    servicios: `array, solo de: ${lista(opciones.servicios)}.`,
    equipo: `array, solo de: ${lista(opciones.equipo)}.`,
    tipo: '"venta" | "alquiler" | "prestamo".',
    estado: 'array de "nuevo" | "como_nuevo" | "bueno" | "aceptable".',
    urgente: 'true si lo necesita ya (hoy, urgente).',
    texto: 'palabras para buscar por nombre, solo si piden algo concreto que no cabe en otro filtro (una marca, un nombre).',
  };
  return `Eres Rodrigo, de Musikeeo. Conviertes la petición del usuario en filtros de búsqueda para la categoría «${cat.nombre}» de Explorar.
Hoy es ${hoyBonito} (${hoy}).

Responde SOLO con un objeto JSON válido, sin texto antes ni después y sin \`\`\`.
Claves posibles (pon solo las que salgan de la petición; nunca inventes datos que no ha dicho):
${CLAVES_FILTRO[cat.tipo].map(k => `- ${k}: ${claves[k]}`).join('\n')}
- explicacion: una frase corta (máximo 140 caracteres) en castellano de España, tuteando y sin emojis, que diga lo que has entendido. Ejemplo: "Busco bandas de rumba en Barcelona, cerca de Sitges, libres el sábado y por menos de 1.500 €."

Si la petición no tiene nada que ver con buscar en esta categoría, devuelve solo {"explicacion": "…"} diciendo en una frase qué puede pedir.`;
}

async function handleFiltros(req: any, res: any, apiKey: string) {
  const { message, categoria, opciones: rawOpciones, hoy: rawHoy } = req.body ?? {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message (string) is required' });
  if (message.length > 300) return res.status(413).json({ error: 'message too long (max 300 chars)' });
  const tipo: TipoCat = TIPOS_CAT.includes(categoria?.tipo) ? categoria.tipo : 'artistas';
  const nombre = limpio(categoria?.nombre) || 'Explorar';
  const opciones = opcionesDe(rawOpciones);
  const hoy = typeof rawHoy === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawHoy) ? rawHoy : new Date().toISOString().slice(0, 10);

  const messages = [
    { role: 'system', content: promptFiltros({ nombre, tipo }, opciones, hoy) },
    { role: 'user', content: message.trim() },
  ];
  try {
    // La app deja de esperar a los 9 s (rodrigoFiltros.ts): más allá no lo lee nadie
    const { upstream, endpoint, model } = await callKimiWithFallbacks(apiKey, messages, 300, { temperature: 0.2 }, 9_000);
    if (!upstream || !upstream.ok) {
      const status = upstream?.status ?? 500;
      console.error('Kimi error (filtros):', status, endpoint.baseUrl, model, upstream ? await upstream.text() : 'no response');
      return res.status(status).json({ error: 'upstream', status });
    }
    const data = await upstream.json();
    const json = extraerJson(data.choices?.[0]?.message?.content ?? '');
    if (!json) return res.status(502).json({ error: 'bad_json' });
    return res.status(200).json(limpiarFiltros(json, tipo, opciones));
  } catch (err) {
    console.error('Filtros handler exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  pruneRateStore();
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(rl.remaining, 0)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
  if (!rl.ok) {
    const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({ error: 'Too many requests', retryAfter: retryAfterSec });
  }

  const apiKey = cleanApiKey(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || '');
  if (!apiKey) {
    console.error('KIMI_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (req.body?.mode === 'filtros') return handleFiltros(req, res, apiKey);

  const { message, history = [] } = req.body ?? {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) is required' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(413).json({ error: `message too long (max ${MAX_MESSAGE_CHARS} chars)` });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'history must be an array' });
  }
  const trimmedHistory = history
    .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY_ITEMS);
  const historyChars = trimmedHistory.reduce((acc: number, m: any) => acc + (m.content?.length ?? 0), 0);
  if (historyChars > MAX_HISTORY_CHARS) {
    return res.status(413).json({ error: `history too long (max ${MAX_HISTORY_CHARS} chars)` });
  }

  const catalog = await getCatalog();
  const messages = [
    { role: 'system', content: `${RODRIGO_SYSTEM_PROMPT}\n\n${catalog}` },
    ...trimmedHistory,
    { role: 'user', content: message },
  ];

  try {
    const { upstream, endpoint, model, tried, triedModels } = await callKimiWithFallbacks(apiKey, messages, MAX_TOKENS);

    if (!upstream || !upstream.ok) {
      const status = upstream?.status ?? 500;
      const errorText = upstream ? await upstream.text() : 'no response';
      // 401 = clave (en todos los endpoints), 429 = sin saldo/limite, 404 = sin acceso a ningun modelo.
      // El detalle (endpoints, modelos, texto del proveedor) va solo al log de Vercel: la respuesta es pública.
      console.error('Kimi error:', status, endpoint.baseUrl, model, { tried, triedModels }, errorText);
      return res.status(status).json({ error: 'upstream', status });
    }

    const data = await upstream.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content });
  } catch (err) {
    console.error('Chat handler exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Vercel Serverless Function — Rodrigo AI via Kimi (Moonshot AI, API directa)
// POST /api/chat  { message: string, history: {role, content}[] }

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

RECOMENDACIONES DE ARTISTAS — usa SIEMPRE este formato:

[ARTISTA]
Nombre: {nombre del artista}
Formato: {dúo, banda, DJ, etc.}
Estilo: {jazz, pop, covers, etc.}
Por qué encaja: {explicación breve}
Precio orientativo: {rango de precio}
Link: /artista/{id-ficticio}
[/ARTISTA]

Muestra máximo 3 artistas.

BÚSQUEDA DE BOLOS — usa este formato:

[BOLO]
Título: {nombre del evento}
Fecha: {fecha}
Ubicación: {ciudad}
Formato buscado: {dúo, banda, etc.}
Caché: {rango}
Link: /evento/{id-ficticio}
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
Categoría: {guitarras | bajos | teclados | bateria | viento | accesorios | pa_sonido | iluminacion | recording | partituras | otros}
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

  const messages = [
    { role: 'system', content: RODRIGO_SYSTEM_PROMPT },
    ...trimmedHistory,
    { role: 'user', content: message },
  ];

  try {
    const callKimi = (baseUrl: string, model: string) =>
      fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
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

    if (!upstream || !upstream.ok) {
      const status = upstream?.status ?? 500;
      const errorText = upstream ? await upstream.text() : 'no response';
      console.error('Kimi error:', status, endpoint.baseUrl, model, errorText);
      // 401 = clave (en todos los endpoints), 429 = sin saldo/limite, 404 = sin acceso a ningun modelo
      return res.status(status).json({ error: errorText, status, model, tried, triedModels });
    }
    workingModel = model;

    const data = await upstream.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content });
  } catch (err: any) {
    console.error('Chat handler exception:', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}

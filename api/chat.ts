// Vercel Serverless Function — Rodrigo AI via OpenRouter
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
Solo existen tres grandes objetivos válidos:

1. Ayudar a crear un evento musical
2. Ayudar a encontrar músicos adecuados para un evento
3. Ayudar a un músico a encontrar bolos u oportunidades

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

Antes de responder, detecta la intención: SALUDO / CREAR EVENTO / BUSCAR MÚSICOS / SOY MÚSICO BUSCO BOLOS / AYUDA / AMBIGUO.
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

PUBLICAR EVENTO — cuando el usuario confirma que quiere publicar:

[PUBLISH_EVENT]
Título: {título sugerido}
Fecha: {YYYY-MM-DD}
Hora: {HH:MM}
Ubicación: {ciudad o lugar}
Descripción: {resumen}
Tipo: {gig, jam, session}
Géneros: {lista separada por comas}
Presupuesto: {cifra numérica aproximada}
[/PUBLISH_EVENT]

Si generas [PUBLISH_EVENT], NO generes [ARTISTA] ni [BOLO] en el mismo mensaje.
Tu mensaje de texto en ese caso debe ser: "Perfecto, te llevo al formulario final para revisar y publicar."
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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
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
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://musikeeo.com',
        'X-Title': 'Musikeeo - Rodrigo',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-26b-a4b-it',
        messages,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error('OpenRouter error:', upstream.status, errorText);
      return res.status(upstream.status).json({ error: errorText });
    }

    const data = await upstream.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content });
  } catch (err: any) {
    console.error('Chat handler exception:', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}

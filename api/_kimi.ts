// Llamadas a Kimi (Moonshot AI, API directa, formato OpenAI), compartidas por /api/chat y
// /api/leer-perfil. Vercel no publica como ruta los archivos de /api que empiezan por «_».
//
// Modelo y endpoint configurables desde Vercel sin tocar código.
// Si un endpoint devuelve 401 se prueba el siguiente: una key de platform.moonshot.cn
// solo vale en .cn y una de Kimi Code en api.kimi.com. KIMI_BASE_URL (si existe) va primero.
const MODEL = process.env.KIMI_MODEL || 'kimi-k2-turbo-preview';
const KIMI_ENDPOINTS: { baseUrl: string; model: string }[] = [
  ...(process.env.KIMI_BASE_URL ? [{ baseUrl: process.env.KIMI_BASE_URL.replace(/\/$/, ''), model: MODEL }] : []),
  { baseUrl: 'https://api.moonshot.ai/v1', model: MODEL },
  { baseUrl: 'https://api.moonshot.cn/v1', model: MODEL },
  { baseUrl: 'https://api.kimi.com/coding/v1', model: 'kimi-for-coding' },
].filter((e, i, a) => a.findIndex((x) => x.baseUrl === e.baseUrl) === i);

// Si el endpoint acepta la key pero el modelo da 404 ("Not found the model ... or
// Permission denied"), la cuenta no tiene acceso a ese modelo: se prueban estos.
const FALLBACK_MODELS = ['kimi-k2-0905-preview', 'kimi-k2-0711-preview', 'kimi-latest', 'moonshot-v1-8k'];

// Endpoint y modelo que funcionaron la ultima vez (contenedor caliente): se prueban primero.
let workingEndpoint = 0;
let workingModel: string | null = null;

// Limpia la key pegada en Vercel: espacios, comillas envolventes y prefijo "Bearer ".
export function cleanApiKey(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
}

/** La clave de Kimi del entorno de Vercel, limpia ('' si no hay) */
export const kimiApiKey = () => cleanApiKey(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || '');

export interface KimiMessage { role: string; content: string }

/**
 * Llama a Kimi probando endpoints (ante 401) y modelos (ante 404).
 * `timeoutMs` (opcional) es el tiempo máximo EN TOTAL, contando todas las pruebas; sin él no
 * hay límite (así lo usa /api/chat).
 */
export async function callKimiWithFallbacks(
  apiKey: string,
  messages: KimiMessage[],
  maxTokens: number,
  extra: Record<string, unknown> = {},
  timeoutMs?: number,
) {
  const signal = timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined;
  const callKimi = (baseUrl: string, model: string) =>
    fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, ...extra }),
      ...(signal ? { signal } : {}),
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

/** El primer objeto JSON de la respuesta (por si el modelo lo envuelve en ``` o en una frase) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lo valida quien lo usa
export function extraerJson(content: string): any | null {
  const sinBloques = content.replace(/```(?:json)?/gi, '');
  const a = sinBloques.indexOf('{'), b = sinBloques.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(sinBloques.slice(a, b + 1)); } catch { return null; }
}

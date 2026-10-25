// Lo que escribe un agente al comentar. Con un modelo de IA (cualquier API con formato
// OpenAI: Kimi, Qwen, la de MiroFish…) si hay LLM_API_KEY; si no, frases de plantilla según
// quién comenta y qué ve. Solo para la red de agentes del emulador.
//
//   LLM_API_KEY=…  LLM_BASE_URL=https://api.moonshot.ai/v1  LLM_MODEL=kimi-k2-turbo-preview

import type { Rasgos } from '../../src/lib/recomendador.ts';
import type { Persona } from './personas.ts';

const PLANTILLAS: Record<Persona['rol'], string[]> = {
    musician: [
        '¡Qué buen rollo! ¿Dónde tocáis los próximos findes?',
        'Brutal ese {estilo}. Si un día necesitáis sustituto, aquí estoy.',
        'Me apunto a una jam cuando queráis.',
        'Ese directo suena muy limpio. ¿Lleváis técnico propio?',
        'Qué ganas de compartir escenario con vosotros.',
        'Ojo con ese {estilo}, muy fino.',
    ],
    organizer: [
        'Nos encaja para un evento en {ciudad}. ¿Os escribo por privado?',
        '¿Tenéis fechas libres el mes que viene?',
        'Esto es justo lo que busco. Hablamos.',
        '¿Cuánto dura vuestro show? Busco algo así para una boda.',
        'Me lo guardo para la próxima fecha que tenga.',
        '¿Hacéis también ceremonia o solo la fiesta?',
    ],
    provider: [
        'Buen sonido. Si necesitáis técnico para el directo, avisad.',
        'Esa mezcla suena muy bien. ¿Qué micros usáis?',
        'Si os falta equipo para el bolo, tengo PA disponible.',
        'Qué pasada. ¿Grabáis en directo o en estudio?',
    ],
};

let avisado = false;

/** Una frase corta en castellano de España, como la escribiría esa persona */
export async function escribirComentario(p: Persona, r: Rasgos, texto: string, rnd: () => number): Promise<string> {
    const clave = process.env.LLM_API_KEY;
    if (clave) {
        try {
            const base = (process.env.LLM_BASE_URL || 'https://api.moonshot.ai/v1').replace(/\/$/, '');
            const res = await fetch(`${base}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
                body: JSON.stringify({
                    model: process.env.LLM_MODEL || 'kimi-k2-turbo-preview',
                    temperature: 0.9,
                    max_tokens: 80,
                    messages: [
                        { role: 'system', content: `Eres ${p.nombre}. ${p.descripcion} Usas Musikeeo, la app de la música en directo en España. Escribes comentarios cortos (máximo 20 palabras), naturales, en castellano de España, de tú, sin hashtags ni comillas. A veces preguntas por fechas, precio o equipo.` },
                        { role: 'user', content: `Comenta esta publicación: «${texto.slice(0, 300)}»` },
                    ],
                }),
            });
            if (res.ok) {
                const j = await res.json() as { choices?: { message?: { content?: string } }[] };
                const t = j.choices?.[0]?.message?.content?.trim().replace(/^["«]|["»]$/g, '');
                if (t) return t.slice(0, 300);
            } else if (!avisado) { avisado = true; console.warn(`  (el modelo respondió ${res.status}; sigo con plantillas)`); }
        } catch { /* sin red: plantillas */ }
    }
    const lista = PLANTILLAS[p.rol];
    return lista[Math.floor(rnd() * lista.length)]
        .replace('{estilo}', ({ clasica: 'clásica', acustico: 'acústico', electronica: 'electrónica', violin: 'violín', dj: 'set' } as Record<string, string>)[r.estilos[0]] || r.estilos[0] || 'directo')
        .replace('{ciudad}', p.ciudad);
}

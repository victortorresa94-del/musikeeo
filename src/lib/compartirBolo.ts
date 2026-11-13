// «Compartir el bolo» (13-nov). Víctor: «crear un bolo y compartir bolo… para pasar información…
// a mis músicos, un link donde puedan acceder al repertorio, al horario de cada cosa y a la
// ubicación… como un panel donde puedan ver todo, el título, la duración del concierto».
// El bolo va igual que un set (lib/compartir): comprimido tras «#» y, con cuenta y reglas, en
// compartidos/{id}, que la app vuelve a subir sola al cambiar. Lleva dentro cada set entero (el
// mismo paquete que el enlace del repertorio), así que el músico lo toca sin red.
// Sin React: lo usan la hoja de compartir, la página del músico y services/compartidosService.
import { codificar, descomprimir, paquete, sanear, type Compartido } from './compartir';
import type { Bolo, Cancion, HoraBolo, Repertorio } from '../types/cancionero';

export const DURACION_MEDIA = 210;   // una canción sin duración: 3:30

export interface SetCompartido extends Compartido {
    hi?: string;            // hora a la que empieza
    hf?: string;            // hora a la que acaba (si se puso a mano)
    hu?: number;            // hueco del set, en minutos
    ic?: string;            // el icono elegido para el repertorio (/images/…)
}

export interface BoloCompartido {
    v: 1;
    tipo: 'bolo';
    n: string;              // título
    f?: string;             // fecha
    lu?: string;            // lugar
    di?: string;            // dirección
    ho?: HoraBolo[];        // horario
    co?: string;            // contacto
    te?: string;            // teléfono
    no?: string;            // notas
    l?: 1;                  // los sets llevan letra
    u?: string;             // cuándo se publicó
    s: SetCompartido[];
}

const hhmm = /^([01]?\d|2[0-3]):([0-5]\d)$/;
export const esHora = (h?: string): h is string => !!h && hhmm.test(h.trim());
export const minutosDe = (h: string) => { const m = hhmm.exec(h.trim())!; return +m[1] * 60 + +m[2]; };
export const horaDe = (min: number) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((min % 60) + 60) % 60).padStart(2, '0')}`;

// Lo que dura un set (las que no tienen duración, 3:30) y si es aproximado
export function duracionSet(set: Compartido): { segundos: number; aprox: boolean } {
    const faltan = set.c.filter(t => !t.d).length;
    return { segundos: set.c.reduce((s, t) => s + (t.d ?? 0), 0) + faltan * DURACION_MEDIA, aprox: faltan > 0 };
}

export function paqueteBolo(bolo: Bolo, repertorios: Repertorio[], canciones: Cancion[], conLetra: boolean): BoloCompartido {
    const porId = new Map(repertorios.map(r => [r.id, r]));
    const sets: SetCompartido[] = [];
    for (const s of bolo.sets) {
        const r = porId.get(s.repertorioId);
        if (!r) continue;
        sets.push({ ...paquete(r, canciones, conLetra), ...(esHora(s.hora) ? { hi: s.hora.trim() } : {}), ...(esHora(s.hasta) ? { hf: s.hasta.trim() } : {}), ...(r.hueco ? { hu: r.hueco } : {}), ...(r.icono ? { ic: r.icono } : {}) });
    }
    const texto = (x?: string) => (x && x.trim() ? x.trim() : undefined);
    const horario = bolo.horario.filter(h => h.que.trim() || esHora(h.hora)).map(h => ({ hora: h.hora.trim(), que: h.que.trim(), ...(esHora(h.hasta) ? { hasta: h.hasta.trim() } : {}) }));
    return {
        v: 1,
        tipo: 'bolo',
        n: bolo.titulo,
        s: sets,
        ...Object.fromEntries(Object.entries({
            f: texto(bolo.fecha), lu: texto(bolo.lugar), di: texto(bolo.direccion), co: texto(bolo.contacto), te: texto(bolo.telefono), no: texto(bolo.notas),
        }).filter(([, v]) => v !== undefined)),
        ...(horario.length ? { ho: horario } : {}),
        ...(conLetra ? { l: 1 as const } : {}),
    };
}

export const descodificarBolo = (codigo: string): BoloCompartido | null => sanearBolo(descomprimir(codigo));

// Lo que llega de fuera: solo lo que sabemos pintar, con su tipo
export function sanearBolo(dato: unknown): BoloCompartido | null {
    const b = dato as BoloCompartido;
    if (!b || b.v !== 1 || b.tipo !== 'bolo' || typeof b.n !== 'string' || !Array.isArray(b.s)) return null;
    const texto = (x: unknown, max = 5000) => (typeof x === 'string' && x.trim() ? x.slice(0, max) : undefined);
    const sets: SetCompartido[] = [];
    for (const s of b.s) {
        const limpio = sanear(s);
        if (!limpio) continue;
        const hi = texto((s as SetCompartido).hi, 5);
        const hu = (s as SetCompartido).hu;
        const hf = texto((s as SetCompartido).hf, 5);
        const set: SetCompartido = { ...limpio, ...(esHora(hi) ? { hi } : {}), ...(esHora(hf) ? { hf } : {}), ...(typeof hu === 'number' && hu > 0 ? { hu } : {}) };
        // El icono solo si es la ruta de un icono de la app (lo de fuera no se pinta a ciegas)
        const ic = (s as SetCompartido).ic;
        if (typeof ic === 'string' && ic.length <= 200 && /^\/images\/[\w/-]+\.(webp|png|jpe?g|svg)$/i.test(ic)) set.ic = ic;
        else delete set.ic;
        sets.push(set);
    }
    const ho = Array.isArray(b.ho)
        ? b.ho.filter(h => h && typeof h.que === 'string').map(h => ({ hora: typeof h.hora === 'string' ? h.hora.slice(0, 5) : '', que: h.que.slice(0, 200), ...(typeof h.hasta === 'string' && esHora(h.hasta) ? { hasta: h.hasta.slice(0, 5) } : {}) })).slice(0, 40)
        : undefined;
    return {
        v: 1, tipo: 'bolo', n: b.n.slice(0, 120), s: sets,
        f: texto(b.f, 10), lu: texto(b.lu, 200), di: texto(b.di, 300), co: texto(b.co, 120), te: texto(b.te, 40), no: texto(b.no),
        u: texto(b.u, 40), ...(b.l ? { l: 1 as const } : {}), ...(ho?.length ? { ho } : {}),
    };
}

// Con id, el enlace que se actualiza solo; sin él, todo en el «#»
export const enlaceBolo = (p: BoloCompartido, id?: string, origen = window.location.origin) =>
    `${origen}/bolo${id ? `/${id}` : ''}#${codificar(p)}`;

// El horario del bolo con los sets dentro, por hora (lo que no tiene hora, al final)
export interface MomentoBolo { hora: string; que: string; set?: number; hasta?: string; aprox?: boolean }
export function horarioCompleto(b: BoloCompartido): MomentoBolo[] {
    const momentos: MomentoBolo[] = (b.ho ?? []).map(h => ({ hora: h.hora, que: h.que, ...(esHora(h.hasta) ? { hasta: h.hasta } : {}) }));
    b.s.forEach((s, i) => {
        if (!esHora(s.hi)) return;
        // La hora de acabar puesta a mano manda; si no, la del hueco; si no, cuando acaban sus canciones (aprox.)
        const fin = minutosDe(s.hi) + (s.hu ? s.hu : Math.round(duracionSet(s).segundos / 60));
        momentos.push({ hora: s.hi, que: nombreEnBolo(s.n, b.n), set: i, hasta: esHora(s.hf) ? s.hf : horaDe(fin), aprox: !esHora(s.hf) && !s.hu });
    });
    return momentos
        .map((m, i) => ({ m, i }))
        .sort((a, b) => {
            const ha = esHora(a.m.hora) ? minutosDe(a.m.hora) : Infinity, hb = esHora(b.m.hora) ? minutosDe(b.m.hora) : Infinity;
            return ha - hb || a.i - b.i;
        })
        .map(x => x.m);
}

// Enlaces de mapas con la dirección (o el lugar): nada de mapa incrustado (sin cookies de terceros)
export function enlacesMapa(direccion: string) {
    const q = encodeURIComponent(direccion);
    return {
        google: `https://www.google.com/maps/search/?api=1&query=${q}`,
        apple: `https://maps.apple.com/?q=${q}`,
        waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    };
}

// Un teléfono para «Llamar» y WhatsApp (sin espacios; con 9 cifras, de España)
export function telefonoLimpio(t: string): { tel: string; whatsapp: string } | null {
    const solo = t.replace(/[^\d+]/g, '');
    const cifras = solo.replace(/\D/g, '');
    if (cifras.length < 9) return null;
    const conPais = solo.startsWith('+') ? cifras : cifras.length === 9 ? `34${cifras}` : cifras.replace(/^00/, '');
    return { tel: solo.startsWith('+') ? solo : cifras.length === 9 ? `+34${cifras}` : `+${conPais}`, whatsapp: `https://wa.me/${conPais}` };
}

// Cómo se llama un set dentro de su bolo: sin la hora ni el nombre del bolo, que ya se ven
// («Lady Jarana · RTF Pallejà 12:30» en el bolo «RTF Pallejà» → «Lady Jarana»)
export function nombreEnBolo(set: string, bolo: string): string {
    const sinHora = tituloYHoraDe(set).titulo;
    const b = bolo.trim().toLowerCase();
    if (!b) return sinHora;
    const partes = sinHora.split(/\s+·\s+/).filter(p => p.trim().toLowerCase() !== b);
    return partes.length && partes.join(' · ') !== '' ? partes.join(' · ') : sinHora;
}

// «Lady Jarana · RTF Pallejà 12:30» → título sin la hora y la hora («12:30»)
export function tituloYHoraDe(nombre: string): { titulo: string; hora?: string } {
    const m = /(?:^|\s)([01]?\d|2[0-3])\s*[:h.]\s*([0-5]\d)(?!\d)\s*$/i.exec(nombre.trim());
    if (!m) return { titulo: nombre.trim() };
    return { titulo: nombre.trim().slice(0, m.index).replace(/[\s·,-]+$/, '').trim() || nombre.trim(), hora: `${m[1].padStart(2, '0')}:${m[2]}` };
}

// Cuándo se toca, para ponerlo GRANDE arriba de la página del músico (13-nov, Víctor: «que ponga
// más grande de 12:30 a 13:30»). Si en el horario hay un «Concierto» (o «Actuación», «Tocamos»…)
// manda ese; si no, los sets con su hora
const ES_CONCIERTO = /concierto|actuaci[oó]n|tocamos|show|directo|\bbolo\b|\bset\b|pase/i;
export const esConcierto = (que: string) => ES_CONCIERTO.test(que);
export interface Concierto { desde: string; hasta?: string; aprox?: boolean; que?: string; set?: number }
export function cuandoSeToca(b: BoloCompartido): Concierto[] {
    const momentos = horarioCompleto(b);
    const delHorario = momentos.filter(m => m.set === undefined && esHora(m.hora) && ES_CONCIERTO.test(m.que));
    if (delHorario.length) return delHorario.map(m => ({ desde: m.hora, hasta: m.hasta, que: m.que }));
    return momentos.filter(m => m.set !== undefined && esHora(m.hora)).map(m => ({ desde: m.hora, hasta: m.hasta, aprox: m.aprox, que: m.que, set: m.set }));
}

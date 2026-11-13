// «Compartir con el grupo»: el repertorio entero cabe en el enlace, después de «#».
// Lo que va tras «#» no viaja al servidor (no pasa por Vercel ni por Firebase): funciona sin
// cuenta, sin reglas desplegadas y, una vez abierto, sin cobertura.
// Y desde el 13-nov el enlace lleva además un id (/grupo/{id}#…): la app de quien comparte
// guarda lo último en compartidos/{id} cada vez que cambia una canción o el orden, y la página
// del músico lo lee de ahí. Víctor: «siempre deben tener mi última versión». Lo de «#» es la
// red: sirve si aún no hay reglas desplegadas, si no hay cobertura o si el id no existe.
// Sin React: lo usa la hoja de compartir, la página del músico y services/compartidosService.
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { esApunte, leerCancion, type Linea } from './acordes';
import { cejillaDeFicha, tonoMostrado } from './biblioteca';
import { notasVacias } from './notas';
import { bloqueDe, etiquetasDe } from '../components/cancionero/estilo';
import { tonoDe } from '../components/cancionero/utilidades';
import type { Cancion, Repertorio } from '../types/cancionero';

export interface TemaCompartido {
    t: string;              // título
    a?: string;             // artista
    x: string;              // letra y acordes, o solo los acordes («cifrado»)
    s?: number;             // semitonos para que suene en su tono (lo transportado y la cejilla escrita)
    k?: string;             // tono que suena
    p?: string;             // capo / formas
    c?: string;             // canta
    e?: string;             // estilo
    b?: number;             // bpm
    d?: number;             // segundos
    o?: string;             // notas con formato (JSON del editor)
    g?: string;             // bloque del bolo
    v?: string;             // versión
    m?: number;             // cejilla con la que lo toca quien comparte
}

export interface Compartido {
    v: 1;
    n: string;              // nombre del repertorio
    f?: string;             // fecha
    h?: string;             // hoja del bolo (JSON del editor)
    l?: 1;                  // lleva letra
    u?: string;             // cuándo se publicó (ISO): manda el más nuevo entre el «#», la copia del móvil y la nube
    c: TemaCompartido[];
}

// Sin letra: las partes, los avisos y los acordes de cada línea. Las filas iguales seguidas
// se juntan en una con «(x2)»: el verso que repite los mismos acordes ocupa una línea
export function soloCifrado(texto: string): string {
    const leida = leerCancion(texto);
    const salida: string[] = [];
    let filas: string[] = [];
    // Filas de acordes seguidas: si se repite un dibujo de 1 a 4 filas, va una vez con «(xN)»
    const cerrar = () => {
        if (!filas.length) return;
        let mejor: { p: number; n: number } | null = null;
        for (let p = 1; p <= 4 && p * 2 <= filas.length; p++) {
            if (filas.length % p) continue;
            const n = filas.length / p;
            if (filas.every((f, i) => f === filas[i % p])) { mejor = { p, n }; break; }
        }
        if (mejor) {
            const dibujo = filas.slice(0, mejor.p);
            dibujo[dibujo.length - 1] += `  (x${mejor.n})`;
            salida.push(...dibujo);
        } else salida.push(...filas);
        filas = [];
    };
    const fila = (l: Linea): string | null => {
        if (l.tipo === 'acordes') {
            // «Parte:» con dos puntos, para que al volver a leerla sea una parte (también «Rueda:»)
            const base = [l.etiqueta && `${l.etiqueta}:`, ...l.marcas.map(m => m.texto)].filter(Boolean).join('  ');
            // La coletilla («(arranca en G)», «· Final abierto») va detrás, pequeña: al músico le sirve
            if (!l.coletilla) return base;
            return `${base}  ${l.coletilla.startsWith('(') ? l.coletilla : `· ${l.coletilla}`}`;
        }
        if (l.tipo === 'mixta') return l.trozos.flatMap(t => (t.marca ? [t.marca.texto] : [])).join('  ');
        return null;
    };
    const chuleta = leida.lineas.filter(l => l.tipo === 'letra').length < 8;
    for (const l of leida.lineas) {
        const f = fila(l);
        if (f !== null) { if (f.trim()) filas.push(f); continue; }
        // La letra no va (y no corta el dibujo). En una chuleta (casi sin letra) esas líneas son
        // indicaciones («Enganchada con Carnaval», «Con capo 2 formas de Am: …»): van como apunte
        if (l.tipo === 'letra') { if (chuleta) { cerrar(); salida.push(`{c: ${l.texto.trim()}}`); } continue; }
        if (l.tipo === 'vacia' && filas.length) continue;   // entre estrofas iguales tampoco
        cerrar();
        if (l.tipo === 'seccion') salida.push(`[${l.texto}]`);
        else if (l.tipo === 'nota') salida.push(l.aviso ? `> ${l.texto}` : `{c: ${l.texto}}`);
        else if (l.tipo === 'tab') salida.push(l.texto);
        else if (l.tipo === 'vacia') { if (salida.length && salida[salida.length - 1] !== '') salida.push(''); }
    }
    cerrar();
    return salida.join('\n').trim();
}

// Los apuntes de Víctor («Fuente:», «Otras versiones:», «Revisar tono»…) no van al grupo
// (la misma regla con la que el lector los pone en gris)
export const sinApuntes = (texto: string) => texto.split('\n').filter(l => !esApunte(l)).join('\n');

// Lo que está escrito con «Capo 2» o {capo: 2}: se quita del texto (ya va en «s»)
const sinCejillaEscrita = (texto: string) => texto
    .split('\n')
    .filter(l => !/^\s*\{\s*capo\s*:/i.test(l) && !/^\s*(?:capo|cejilla)\s*:?\s*\d{1,2}\s*$/i.test(l))
    .join('\n');

// Cada canción, tal como la ve quien no tiene la canción: su ficha y su cifrado (o letra)
export function temaDe(c: Cancion, conLetra: boolean): TemaCompartido {
    const leida = leerCancion(c.texto);
    const s = (leida.meta.cejilla ?? 0) + c.ajustes.semitonos;
    const canta = c.ficha?.canta?.trim() || etiquetasDe(c).find(e => /^canta /i.test(e.texto))?.texto.replace(/^canta /i, '');
    const limpio = sinApuntes(c.texto);
    const texto = sinCejillaEscrita(conLetra ? limpio : soloCifrado(limpio));
    const quitarVacios = (o: Partial<TemaCompartido>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 0));
    return {
        t: c.titulo,
        x: texto,
        ...quitarVacios({
            a: c.artista, s, k: tonoMostrado(c, tonoDe(c)) ?? undefined, p: c.ficha?.capo, c: canta, e: c.ficha?.estilo,
            b: c.bpm, d: c.duracion, o: notasVacias(c.notas) ? undefined : c.notas, g: bloqueDe(c) ?? undefined, v: c.version,
            m: c.ajustes.cejilla || c.ajustes.cejillaGuardada || cejillaDeFicha(c),
        }),
    };
}

export function paquete(repertorio: Repertorio, canciones: Cancion[], conLetra: boolean): Compartido {
    const porId = new Map(canciones.map(c => [c.id, c]));
    const temas = repertorio.canciones.map(id => porId.get(id)).filter((c): c is Cancion => !!c);
    return {
        v: 1,
        n: repertorio.nombre,
        ...(repertorio.fecha ? { f: repertorio.fecha } : {}),
        ...(!notasVacias(repertorio.notas) ? { h: repertorio.notas } : {}),
        ...(conLetra ? { l: 1 as const } : {}),
        c: temas.map(c => temaDe(c, conLetra)),
    };
}

const aBase64Url = (u: Uint8Array) => {
    let bin = '';
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const deBase64Url = (s: string) => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
};

export const codificar = (p: Compartido) => `1${aBase64Url(deflateSync(strToU8(JSON.stringify(p)), { level: 9 }))}`;

export function descodificar(codigo: string): Compartido | null {
    try {
        const limpio = decodeURIComponent(codigo.replace(/^#/, '').trim());
        if (!limpio.startsWith('1')) return null;
        const p = JSON.parse(strFromU8(inflateSync(deBase64Url(limpio.slice(1))))) as Compartido;
        if (p?.v !== 1 || typeof p.n !== 'string' || !Array.isArray(p.c)) return null;
        // Lo que llega de fuera: solo lo que sabemos pintar, con su tipo
        const texto = (x: unknown) => (typeof x === 'string' ? x : undefined);
        p.f = texto(p.f);
        p.h = texto(p.h);
        p.u = texto(p.u);
        p.c = p.c.filter(t => t && typeof t.t === 'string' && typeof t.x === 'string').map(t => ({
            t: t.t, x: t.x, a: texto(t.a), k: texto(t.k), p: texto(t.p), c: texto(t.c), e: texto(t.e), o: texto(t.o), g: texto(t.g), v: texto(t.v),
            s: typeof t.s === 'number' ? Math.max(-24, Math.min(24, Math.round(t.s))) : undefined,
            b: typeof t.b === 'number' ? t.b : undefined,
            d: typeof t.d === 'number' ? t.d : undefined,
            m: typeof t.m === 'number' ? t.m : undefined,
        }));
        return p;
    } catch {
        return null;
    }
}

// Con id, el enlace que se actualiza solo; sin él, el de siempre (todo en el «#»)
export const enlaceGrupo = (p: Compartido, id?: string, origen = window.location.origin) =>
    `${origen}/grupo${id ? `/${id}` : ''}#${codificar(p)}`;

// Un id largo y al azar: es lo único que protege el set (quien no tiene el enlace no lo encuentra)
export function idCompartido(): string {
    const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const azar = new Uint32Array(22);
    crypto.getRandomValues(azar);
    return Array.from(azar, n => letras[n % letras.length]).join('');
}

// Lo que se compara para saber si hay que volver a publicar: el set sin la hora
export const huella = (p: Compartido) => codificar({ ...p, u: undefined });

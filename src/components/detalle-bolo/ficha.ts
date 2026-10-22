// Lo que sabe un bolo, ordenado para su página: las cuatro tarjetas de arriba (concepto B) y las
// secciones con filas de abajo (concepto A). Solo sale lo que hay: una fila sin dato no se crea,
// y una tarjeta o una sección sin filas tampoco.
import type { Event } from '../../types';
import { OBJETO_3D } from '../../config/objetos3d';
import { PALABRAS_CATEGORIA, esUrgente, norm, palabras, precioBolo, raiz } from '../bolos/tablon';
import {
    DESPLAZAMIENTO_BOLO, ESPACIO_BOLO, ETIQUETA_NEGOCIABLE, SONIDO_BOLO, TODAS_NECESIDADES, limpiaDetalles, miles,
} from '../../pages/events/publish/opciones';

// El sonido lo pone el organizador si lo dicen las etiquetas o la descripción (los bolos sin `detalles`)
const SONIDO = /sonido (esta |va |ya )?incluid|incluye (el )?(equipo de )?sonido|equipo de sonido incluid|tenemos (el |nuestro )?equipo|\b(pa|backline) incluid/;

// Las etiquetas que dicen a quién se busca (no son estilos): las teselas de Publicar y sus parecidas
const QUIEN = ['banda', 'cantante', 'cantautor', 'dj', 'tecnico', 'solista', 'mariachi', 'orquesta', 'trio', 'cuarteto', 'violin', 'musico', 'grupo'];
const esQuien = (t: string) =>
    TODAS_NECESIDADES.some(n => norm(n) === norm(t)) || palabras(t).some(w => QUIEN.some(q => w.startsWith(q)));

// El tipo solo se enseña cuando dice algo («Bolo» en la ficha de un bolo, no)
const TIPO: Record<string, string> = {
    jam: 'Jam session',
    session: 'Sesión',
    festival: 'Festival',
    'boda / social': 'Boda o evento social',
    'evento privado': 'Evento privado',
    'residencia / bar': 'Residencia en bar',
};

export interface Fila { etiqueta: string; valor: string }
export interface Tarjeta { id: 'buscan' | 'sonido' | 'dinero' | 'sitio'; titulo: string; objeto: string; lineas: string[] }
export interface Seccion { id: 'buscan' | 'logistica' | 'dinero'; titulo: string; filas: Fila[]; parrafo?: string }
export interface Sitio { principal: string; lineas: string[]; mapa: string }

export interface Ficha {
    tarjetas: Tarjeta[];
    secciones: Seccion[];
    sitio: Sitio | null;
    plazo: Plazo | null;
    urgente: boolean;
}

export interface Plazo { cerrado: boolean; texto: string }

/** «Cierra en 4 días», «Cierra mañana», «Cierra hoy» o «Plazo cerrado». `cierra` es el último día */
export function plazoDe(cierra?: string): Plazo | null {
    if (!cierra || !/^\d{4}-\d{2}-\d{2}$/.test(cierra)) return null;
    const [a, m, d] = cierra.split('-').map(Number);
    const hoy = new Date();
    // En días de calendario, a mediodía: el cambio de hora no descuadra la cuenta
    const dias = Math.round((new Date(a, m - 1, d, 12).getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12).getTime()) / 86_400_000);
    if (dias < 0) return { cerrado: true, texto: 'Plazo cerrado' };
    if (dias === 0) return { cerrado: false, texto: 'Cierra hoy' };
    if (dias === 1) return { cerrado: false, texto: 'Cierra mañana' };
    return { cerrado: false, texto: `Cierra en ${dias} días` };
}

const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fila = (etiqueta: string, valor?: string): Fila[] => (valor ? [{ etiqueta, valor }] : []);

/** `asoma` es el objeto que ya asoma por la foto: si es el micrófono, «Qué buscan» lleva el cantante */
export function fichaDe(e: Event, asoma?: string): Ficha {
    const d = limpiaDetalles(e.detalles) ?? {};
    const tags = e.tags || [];
    const negociable = tags.some(t => norm(t) === norm(ETIQUETA_NEGOCIABLE));

    // A quién buscan y los estilos, de las etiquetas. Fuera lo que ya dicen los chips (Bodas, Salas…),
    // «Negociable», «Urgente» y «Sonido incluido»
    const quien = tags.find(t => esQuien(t) && norm(t) !== 'otro');
    const estilos = tags.filter(t => {
        const n = norm(t);
        if (esQuien(t) || n === norm(ETIQUETA_NEGOCIABLE) || n === 'urgente' || SONIDO.test(n) || n.includes('incluid')) return false;
        return !palabras(t).map(raiz).some(w => PALABRAS_CATEGORIA.has(w));
    });
    const formato = d.formato || quien;
    const tipo = TIPO[norm(e.type || '')];

    const sonido = SONIDO_BOLO.find(o => o.valor === d.sonido)?.texto
        ?? (SONIDO.test(norm([...tags, e.description || ''].join(' '))) ? 'Incluido' : undefined);
    const desplazamiento = DESPLAZAMIENTO_BOLO.find(o => o.valor === d.desplazamiento);
    const espacio = ESPACIO_BOLO.find(o => o.valor === d.espacio)?.texto;

    const precio = precioBolo(e.price);
    const conPrecio = precio !== 'A convenir';
    const precioLinea = conPrecio && negociable ? `${precio} · negociable` : precio;

    // Invitados en una boda o una fiesta; en una sala o un bar, aforo
    const deFiesta = /boda|social|privad/.test(norm(e.type || ''));
    const gente = d.invitados ? (deFiesta ? `${miles(d.invitados)} invitados` : `Aforo de ${miles(d.invitados)}`) : undefined;

    // ── Arriba: cuatro tarjetas con su objeto ──
    const tarjetas: Tarjeta[] = [];
    const buscan = [[formato, estilos.join(', ')].filter(Boolean).join(' · '), d.duracion].filter((x): x is string => !!x);
    const objetoBuscan = asoma === OBJETO_3D.microfono ? OBJETO_3D.cantante : OBJETO_3D.microfono;
    if (buscan.length) tarjetas.push({ id: 'buscan', titulo: 'Qué buscan', objeto: objetoBuscan, lineas: buscan });
    if (sonido) {
        tarjetas.push({
            id: 'sonido', titulo: 'Sonido', objeto: OBJETO_3D.altavoz,
            lineas: [sonido, d.llegada && `Llegada a las ${d.llegada}`].filter((x): x is string => !!x),
        });
    }
    const segundaDinero = d.pago
        || (desplazamiento?.valor === 'incluido' ? 'Desplazamiento incluido' : desplazamiento?.valor === 'aparte' ? 'Desplazamiento aparte' : undefined);
    tarjetas.push({ id: 'dinero', titulo: 'El dinero', objeto: OBJETO_3D.moneda, lineas: [precioLinea, segundaDinero].filter((x): x is string => !!x) });
    // El sitio, solo si se sabe algo más que la ciudad (la ciudad ya va en la pastilla)
    const extraSitio = [gente, espacio?.toLowerCase()].filter(Boolean).join(' · ');
    if (d.lugar || extraSitio) {
        const primera = d.lugar || e.location;
        tarjetas.push({
            id: 'sitio', titulo: 'El sitio', objeto: OBJETO_3D.escenario,
            lineas: (primera ? [primera, extraSitio] : [conMayuscula(extraSitio)]).filter(Boolean),
        });
    }

    // ── Abajo: secciones con filas ──
    const secciones: Seccion[] = ([
        {
            id: 'buscan', titulo: 'Lo que buscan',
            filas: [
                ...fila('Formato', formato),
                ...fila('Estilos', estilos.join(', ')),
                ...fila('Duración', d.duracion),
                ...fila('Repertorio', d.repertorio),
                ...fila('Evento', tipo),
            ],
            parrafo: e.description?.trim() || undefined,
        },
        {
            id: 'logistica', titulo: 'Logística',
            filas: [
                ...fila('Llegada y prueba', d.llegada),
                ...fila('Sonido', sonido),
                ...fila('Escenario', d.escenario),
                ...fila('Parking y carga', d.parking),
                ...fila('Comida', d.comida),
            ],
        },
        {
            id: 'dinero', titulo: 'El dinero',
            filas: [
                ...fila('Presupuesto', conPrecio && negociable ? `${precio}, negociable` : precio),
                ...fila('Pago', d.pago),
                ...fila('Desplazamiento', desplazamiento?.texto),
            ],
        },
    ] satisfies Seccion[]).filter(s => s.filas.length > 0 || !!s.parrafo);

    const location = (e.location || '').trim();
    const principal = d.lugar || location;
    const sitio: Sitio | null = principal
        ? {
            principal,
            lineas: [d.lugar && location, [gente, espacio].filter(Boolean).join(' · ')].filter((x): x is string => !!x),
            mapa: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([d.lugar, location].filter(Boolean).join(', '))}`,
        }
        : null;

    return { tarjetas, secciones, sitio, plazo: plazoDe(d.cierra), urgente: esUrgente(e) };
}

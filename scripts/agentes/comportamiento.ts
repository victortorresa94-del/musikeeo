// Cómo se comporta un agente delante del Feed: qué le interesa de verdad (lo que el
// algoritmo no ve) y qué hace al verlo. Lo usan la simulación (simular-feed.ts) y la
// red de agentes en el emulador (red-social.ts).

import type { Rasgos, Senal } from '../../src/lib/recomendador.ts';
import type { Persona } from './personas.ts';

const sig = (x: number) => 1 / (1 + Math.exp(-x));

export function interesReal(p: Persona, r: Rasgos): number {
    const estilo = Math.max(0, ...r.estilos.map(e => p.gustoReal[e] || 0));
    const tipo = p.tipos[r.tipo] ?? 0.3;
    const misma = r.ciudad && r.ciudad === p.ciudad.toLowerCase();
    const peso = r.tipo === 'bolo' || r.tipo === 'anuncio' ? 0.35 : 0.1;
    const ciudad = misma ? 0.15 : r.ciudad ? -peso * p.local : 0;
    return Math.max(0, Math.min(1, 0.55 * estilo + 0.45 * tipo + ciudad));
}
export const LE_INTERESA = 0.6;

// Qué hace la persona al ver algo
export function reaccionar(p: Persona, r: Rasgos, rnd: () => number): Senal[] {
    const x = interesReal(p, r);
    const out: Senal[] = ['impresion'];
    const grande = r.tipo === 'post' || r.tipo === 'artista';
    if (grande) {
        if (r.formato === 'video') {
            if (rnd() < sig(8 * (x - 0.5))) out.push('ver_entero');
            else if (rnd() < 1 - sig(8 * (x - 0.35))) out.push('saltar');
        }
        if (rnd() < p.generosidad * sig(10 * (x - 0.6))) {
            out.push('me_gusta');
            if (rnd() < p.charla * sig(10 * (x - 0.75))) out.push('comentar');
        }
        if (rnd() < 0.5 * sig(10 * (x - 0.7))) out.push('perfil');
    } else if (rnd() < 0.8 * sig(10 * (x - 0.55))) out.push('abrir');
    return out;
}

// Como el Feed: una grande, un bolo y, cada vuelta, una fila del Mercado (se ven 3 de 8)
export function sesion(grandes: Rasgos[], bolos: Rasgos[], anuncios: Rasgos[], vueltas: number): Rasgos[] {
    const vistos: Rasgos[] = [];
    for (let i = 0; i < vueltas; i++) {
        if (grandes[i]) vistos.push(grandes[i]);
        if (bolos[i]) vistos.push(bolos[i]);
        vistos.push(...anuncios.slice(i * 8, i * 8 + 3));
    }
    return vistos;
}


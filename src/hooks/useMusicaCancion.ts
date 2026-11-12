import { useMemo } from 'react';
import {
    cejillaRecomendada, conTonoDeFicha, cuantosDificiles, leerCancion, tonoDeLeida, nombreAcorde, nombreTono, usaBemoles,
    type OpcionesNombre,
} from '../lib/acordes';
import type { AjustesCancion } from '../types/cancionero';

// Lo que suena y lo que se toca: tono, cejilla y cómo se escriben los acordes de una canción
// tonoFicha: el «Tono» de la ficha, que manda sobre lo que dicen los acordes (y sobre «Dame el tono»)
export function useMusicaCancion(texto: string, ajustes: AjustesCancion, tonoFicha?: string, capoFicha?: string) {
    const base = useMemo(() => leerCancion(texto), [texto]);
    const suenaBase = (base.meta.cejilla ?? 0) + ajustes.semitonos;
    const leida = useMemo(() => conTonoDeFicha(base, tonoFicha, suenaBase, capoFicha), [base, tonoFicha, suenaBase, capoFicha]);
    const tono = useMemo(() => tonoDeLeida(leida), [leida]);
    const cejillaEscrita = leida.meta.cejilla ?? 0;
    const suena = cejillaEscrita + ajustes.semitonos;        // lo que suena, respecto a lo escrito
    const desplazamiento = suena - ajustes.cejilla;          // lo que se toca con la cejilla puesta
    const enLatino = ajustes.notacion === 'latina'
        || (ajustes.notacion === 'original' && leida.acordes.filter(a => a.latina).length > leida.acordes.length / 2);
    const notacionTono = enLatino ? 'latina' : 'americana';
    const bemoles = ajustes.alteraciones === 'auto' && desplazamiento === 0 ? null : usaBemoles(tono, desplazamiento, ajustes.alteraciones);
    const opciones: OpcionesNombre = useMemo(
        () => ({ semitonos: desplazamiento, notacion: ajustes.notacion, bemoles }),
        [desplazamiento, ajustes.notacion, bemoles],
    );
    // Sin transportar, el tono se nombra como está escrita su tónica (Abm, no G#m)
    const tonicaEnBemol = tono ? leida.acordes.find(a => a.raiz === tono.raiz)?.bemol ?? false : false;
    const bemolesTono = (s: number) => (ajustes.alteraciones === 'auto' && s === 0 ? tonicaEnBemol : usaBemoles(tono, s, ajustes.alteraciones));
    const sueno = suena + (leida.meta.sonido ?? 0);          // lo que de verdad suena (con la cejilla de la ficha)
    const tonoSuena = tono ? nombreTono(tono, sueno, notacionTono, bemolesTono(sueno)) : null;
    const posturas = tono && ajustes.cejilla > 0
        ? nombreTono(tono, desplazamiento, notacionTono, bemolesTono(desplazamiento))
        : null;
    const recomendada = useMemo(() => cejillaRecomendada(leida.acordes, suena), [leida, suena]);
    const dificilesAhora = useMemo(() => cuantosDificiles(leida.acordes, desplazamiento), [leida, desplazamiento]);
    // Las posturas que se tocarían con la cejilla recomendada (para decirlas, no solo el número)
    const formasRecomendadas = useMemo(() => {
        if (!recomendada) return [];
        const o = { semitonos: suena - recomendada.cejilla, notacion: ajustes.notacion, bemoles: false };
        return [...new Set(leida.acordes.map(a => nombreAcorde({ ...a, bajo: null }, o)))].slice(0, 5);
    }, [recomendada, suena, ajustes.notacion, leida]);

    return {
        leida, tono, opciones, tonoSuena, posturas, recomendada, dificilesAhora, formasRecomendadas,
        sinAcordes: leida.acordes.length === 0,
    };
}

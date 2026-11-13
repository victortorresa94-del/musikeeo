import { useCallback, useEffect, useRef, useState } from 'react';

// Las últimas búsquedas de un buscador (13-nov, Víctor: «que aparezcan las búsquedas recientes cuando
// busque una canción nueva»). En el móvil, por buscador; como mucho 8, la más nueva primero y sin
// repetir (da igual mayúsculas y tildes). Se apunta lo que se deja escrito un momento o con Intro
const MAXIMO = 8;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const leer = (clave: string): string[] => {
    try { const v = JSON.parse(localStorage.getItem(clave) || '[]'); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAXIMO) : []; } catch { return []; }
};

export function useBusquedasRecientes(clave: string, q: string) {
    const [lista, setLista] = useState<string[]>(() => leer(clave));
    const escribir = useCallback((nueva: string[]) => {
        setLista(nueva);
        try { localStorage.setItem(clave, JSON.stringify(nueva)); } catch { /* sin almacenamiento */ }
    }, [clave]);
    const apuntar = useCallback((texto: string) => {
        const t = texto.trim().slice(0, 80);
        if (t.length < 2) return;
        escribir([t, ...leer(clave).filter(x => norm(x) !== norm(t))].slice(0, MAXIMO));
    }, [clave, escribir]);
    const quitar = useCallback((texto: string) => escribir(leer(clave).filter(x => x !== texto)), [clave, escribir]);
    const borrarTodas = useCallback(() => escribir([]), [escribir]);

    // Lo que se deja escrito 1,5 s cuenta como búsqueda
    const ultimo = useRef(apuntar);
    useEffect(() => { ultimo.current = apuntar; }, [apuntar]);
    useEffect(() => {
        if (q.trim().length < 2) return;
        const t = setTimeout(() => ultimo.current(q), 1500);
        return () => clearTimeout(t);
    }, [q]);

    return { recientes: lista, apuntar, quitar, borrarTodas };
}

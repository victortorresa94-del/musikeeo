import { useState } from 'react';
import { SIN_FILTROS, type Agrupar, type Filtros } from '../lib/biblioteca';

// Los filtros de cada pantalla se recuerdan en este dispositivo (solo una comodidad)
export function useFiltrosGuardados(clave: string): [Filtros, (f: Filtros) => void, Agrupar, (a: Agrupar) => void] {
    const leer = <T,>(sufijo: string, porDefecto: T): T => {
        try {
            const crudo = localStorage.getItem(`${clave}:${sufijo}`);
            return crudo ? { ...porDefecto as object, ...JSON.parse(crudo) } as T : porDefecto;
        } catch { return porDefecto; }
    };
    const [filtros, setFiltros] = useState<Filtros>(() => leer('filtros', SIN_FILTROS));
    const [agrupar, setAgrupar] = useState<Agrupar>(() => {
        try { return (localStorage.getItem(`${clave}:agrupar`) as Agrupar) || 'nada'; } catch { return 'nada'; }
    });
    const cambiar = (f: Filtros) => {
        setFiltros(f);
        try { localStorage.setItem(`${clave}:filtros`, JSON.stringify(f)); } catch { /* sin almacenamiento */ }
    };
    const cambiarAgrupar = (a: Agrupar) => {
        setAgrupar(a);
        try { localStorage.setItem(`${clave}:agrupar`, a); } catch { /* sin almacenamiento */ }
    };
    return [filtros, cambiar, agrupar, cambiarAgrupar];
}

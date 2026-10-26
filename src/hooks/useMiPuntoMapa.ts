import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { codificar } from '../lib/geohash';
import { caducado, finDeAhora, zonaDe, type PuntoMapa } from '../lib/mapa';
import { mapaLocal, mapaService } from '../services/mapaService';

// Cómo salgo yo en el mapa de musikeers: leer, aparecer (mi zona o «Estoy aquí ahora»),
// «Ya me voy» y quitarme. «Estoy aquí ahora» caduca solo: los demás dejan de verlo a las 4 h
// (lo filtra quien mira) y este móvil, al verlo caducado, vuelve a la zona fija o se quita.

export type ComoAparecer =
    | { modo: 'zona'; geohash: string }                 // elegida moviendo el mapa
    | { modo: 'zona' | 'ahora'; lat: number; lng: number }; // la ubicación del momento, solo aquí

export function useMiPuntoMapa() {
    const { user, userProfile } = useAuth();
    const uid = user?.uid;
    const [punto, setPunto] = useState<PuntoMapa | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const vivo = useRef(true);
    useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);

    const volverAZona = useCallback(async (uidActual: string) => {
        const base = mapaLocal.zona(uidActual);
        const actual = await mapaService.mio(uidActual).catch(() => null);
        if (base && actual) {
            const sitio = { geohash: base.geohash, zona: base.zona, ahora: false, caduca: null };
            await mapaService.guardar(uidActual, actual, sitio);
            return { ...actual, ...sitio, actualizado: Date.now() };
        }
        await mapaService.quitar(uidActual);
        return null;
    }, []);

    // Al entrar: cómo salgo ahora (y si el «ahora» ya pasó, se arregla solo)
    useEffect(() => {
        if (!uid) { setPunto(null); setCargando(false); return; }
        let cancelado = false;
        setCargando(true);
        mapaService.mio(uid)
            .then(async p => (p && caducado(p) ? volverAZona(uid) : p))
            .then(p => { if (!cancelado) setPunto(p); })
            .catch(() => { if (!cancelado) setPunto(null); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [uid, volverAZona]);

    // Con la app abierta, a su hora
    useEffect(() => {
        if (!uid || !punto?.ahora || !punto.caduca) return;
        const t = setTimeout(() => {
            volverAZona(uid).then(p => { if (vivo.current) setPunto(p); }).catch(() => {});
        }, Math.max(0, punto.caduca - Date.now()) + 500);
        return () => clearTimeout(t);
    }, [uid, punto, volverAZona]);

    const aparecer = useCallback(async (como: ComoAparecer): Promise<PuntoMapa> => {
        if (!uid) throw new Error('Sin sesión');
        setGuardando(true);
        try {
            // La posición exacta solo vive en esta función: sale de aquí la celda
            const geohash = 'geohash' in como ? como.geohash : codificar(como.lat, como.lng);
            const ficha = await mapaService.fichaDePerfil(uid, userProfile, user?.photoURL);
            const ahora = como.modo === 'ahora';
            const sitio = { geohash, zona: zonaDe(geohash, userProfile?.location), ahora, caduca: ahora ? finDeAhora() : null };
            await mapaService.guardar(uid, ficha, sitio);
            if (!ahora) mapaLocal.guardarZona(uid, { geohash, zona: sitio.zona });
            const nuevo: PuntoMapa = { uid, ...ficha, ...sitio, actualizado: Date.now() };
            if (vivo.current) setPunto(nuevo);
            return nuevo;
        } finally {
            if (vivo.current) setGuardando(false);
        }
    }, [uid, user?.photoURL, userProfile]);

    const quitar = useCallback(async () => {
        if (!uid) return;
        setGuardando(true);
        try {
            await mapaService.quitar(uid);
            mapaLocal.guardarZona(uid, null);
            if (vivo.current) setPunto(null);
        } finally {
            if (vivo.current) setGuardando(false);
        }
    }, [uid]);

    /** Fin de «Estoy aquí ahora»: a la zona fija si hay, si no fuera del mapa */
    const yaMeVoy = useCallback(async () => {
        if (!uid) return null;
        setGuardando(true);
        try {
            const p = await volverAZona(uid);
            if (vivo.current) setPunto(p);
            return p;
        } finally {
            if (vivo.current) setGuardando(false);
        }
    }, [uid, volverAZona]);

    return { uid, punto, cargando, guardando, aparecer, quitar, yaMeVoy, tieneZonaFija: !!(uid && mapaLocal.zona(uid)) };
}

export type MiPuntoMapa = ReturnType<typeof useMiPuntoMapa>;

import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { almacenCanciones, almacenRepertorios, cancioneroService } from '../services/cancioneroService';

// El cancionero y los repertorios de quien está (o del móvil, sin cuenta), siempre al día
export function useCancionero() {
    const { user, loading } = useAuth();
    const uid = user?.uid ?? null;

    useEffect(() => {
        if (!loading) cancioneroService.cargar(uid);
    }, [uid, loading]);

    const canciones = useSyncExternalStore(almacenCanciones.suscribir, almacenCanciones.estado);
    const repertorios = useSyncExternalStore(almacenRepertorios.suscribir, almacenRepertorios.estado);
    return {
        canciones: canciones.items,
        repertorios: repertorios.items,
        nube: canciones.nube,
        listo: canciones.duenio !== null && repertorios.duenio !== null,
        conCuenta: !!uid,
        ...cancioneroService,
    };
}

import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { almacenCanciones, almacenListas, almacenRepertorios, cancioneroService } from '../services/cancioneroService';
import { compartidosService } from '../services/compartidosService';
import { catalogoService } from '../services/catalogoService';
import { useCatalogo } from './useCatalogo';

// El cancionero y los repertorios de quien está (o del móvil, sin cuenta), siempre al día
export function useCancionero() {
    const { user, loading } = useAuth();
    const uid = user?.uid ?? null;

    useEffect(() => {
        if (!loading) { cancioneroService.cargar(uid); catalogoService.cargar(uid); }
    }, [uid, loading]);
    // Colores, iconos y columnas propias: quien usa el cancionero se repinta si cambian
    const catalogo = useCatalogo();
    // Los sets compartidos con el grupo se suben solos al cambiar (una vez por app)
    useEffect(() => { compartidosService.iniciar(); }, []);

    const canciones = useSyncExternalStore(almacenCanciones.suscribir, almacenCanciones.estado);
    const repertorios = useSyncExternalStore(almacenRepertorios.suscribir, almacenRepertorios.estado);
    const listas = useSyncExternalStore(almacenListas.suscribir, almacenListas.estado);
    return {
        listas: listas.items,
        catalogo,
        canciones: canciones.items,
        repertorios: repertorios.items,
        nube: canciones.nube,
        // Sin esperar a Firebase si se sabe quién lo usó la última vez (ver cargarPrevio)
        listo: canciones.duenio !== null && repertorios.duenio !== null,
        conCuenta: !!uid || (loading && !!canciones.duenio && canciones.duenio !== 'invitado'),
        ...cancioneroService,
    };
}

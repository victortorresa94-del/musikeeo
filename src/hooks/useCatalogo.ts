import { useSyncExternalStore } from 'react';
import { catalogoService } from '../services/catalogoService';

// El catálogo (colores, iconos y columnas propias) al día: quien lo usa se repinta al cambiar
export function useCatalogo() {
    return useSyncExternalStore(catalogoService.suscribir, catalogoService.estado);
}

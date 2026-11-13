import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CLAVE_VOLVIO, enDirecto, olvidarDirecto, recordarDirecto } from '../../lib/directo';

// Recuerda dónde estás del cancionero (para volver si el iPhone cierra la app en mitad del bolo)
// y, dentro de una canción, un repertorio o Tocar, quita el «tirar para recargar» del navegador:
// un dedo que baja de más no puede recargar la página en directo
export default function DirectoEnVivo() {
    const { pathname, search } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        recordarDirecto(pathname, search);
        const raiz = document.documentElement;
        raiz.classList.toggle('sin-tirar', enDirecto(pathname));
    }, [pathname, search]);

    // Se volvió solo a la canción: que se sepa, y un toque para ir al inicio
    useEffect(() => {
        let volvio = false;
        try { volvio = sessionStorage.getItem(CLAVE_VOLVIO) === '1'; sessionStorage.removeItem(CLAVE_VOLVIO); } catch { /* */ }
        if (!volvio) return;
        toast('Seguías aquí', {
            description: 'La app se había cerrado: vuelves a donde estabas.',
            action: { label: 'Ir al inicio', onClick: () => { olvidarDirecto(); navigate('/'); } },
            duration: 6000,
        });
    }, [navigate]);

    return null;
}

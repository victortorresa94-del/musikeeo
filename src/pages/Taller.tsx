import { useEffect, useState } from 'react';

// La chuleta del taller «El viaje de la rumba» (RTF Pallejà, 14-nov-2026), abierta y sin cuenta.
// Es una página hecha aparte (public/paginas/taller-rumba.txt) que se pinta en un iframe con srcDoc.
// No se abre como página suelta a propósito: el service worker guarda cada navegación como
// /index.html, y una página que no es la app pisaría la app guardada para usarla sin red.
// Se guarda en el móvil para que vuelva a abrirse sin cobertura.
const FUENTE = '/paginas/taller-rumba.txt';
const CLAVE = 'musikeeo-taller-rumba';

function guardada(): string | null {
    try { return localStorage.getItem(CLAVE); } catch { return null; }
}

export default function Taller() {
    const [html, setHtml] = useState<string | null>(guardada);
    const [sinRed, setSinRed] = useState(false);

    useEffect(() => {
        let vivo = true;
        fetch(FUENTE, { cache: 'no-cache' })
            .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
            .then((texto) => {
                if (!vivo) return;
                setHtml(texto);
                try { localStorage.setItem(CLAVE, texto); } catch { /* sin almacenamiento */ }
            })
            .catch(() => { if (vivo) setSinRed(true); });
        return () => { vivo = false; };
    }, []);

    useEffect(() => {
        const antes = document.title;
        document.title = 'El viaje de la rumba · Musikeeo';
        return () => { document.title = antes; };
    }, []);

    if (!html) {
        return (
            <div className="grid min-h-dvh place-items-center bg-background p-6 text-center text-muted-foreground">
                {sinRed ? 'No hay conexión. Ábrela una vez con cobertura y luego funciona sin red.' : 'Cargando…'}
            </div>
        );
    }
    return <iframe title="El viaje de la rumba" srcDoc={html} className="fixed inset-0 h-dvh w-full border-0 bg-background" />;
}

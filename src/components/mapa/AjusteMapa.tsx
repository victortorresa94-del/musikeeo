import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { horaCorta } from '../../lib/mapa';
import { useMiPuntoMapa } from '../../hooks/useMiPuntoMapa';
import { HojaAparecer, TEXTO_PRIVACIDAD } from './HojaAparecer';

// «Aparecer en el mapa» en los ajustes del perfil: el mismo interruptor que en el mapa.
// Encenderlo abre la hoja (zona, «Estoy aquí ahora» y los 18 años); apagarlo te quita al momento.
export function AjusteMapa() {
    const mio = useMiPuntoMapa();
    const navigate = useNavigate();
    const [hoja, setHoja] = useState(false);
    const p = mio.punto;
    const encendido = !!p;

    const cambiar = async () => {
        if (mio.cargando || mio.guardando) return;
        if (!encendido) { setHoja(true); return; }
        try { await mio.quitar(); toast.success('Ya no sales en el mapa'); }
        catch { toast.error('No se ha podido quitar. Revisa la conexión.'); }
    };

    const estado = !p ? 'No sales en el mapa.'
        : p.ahora && p.caduca ? `Estás aquí ahora, hasta las ${horaCorta(p.caduca)}.`
            : `Sales en ${p.zona || 'tu zona'} (zona aproximada).`;

    return (
        <section aria-labelledby="ajuste-mapa">
            <h3 id="ajuste-mapa" className="text-base font-semibold text-foreground tracking-tight mb-3">Musikeers cerca</h3>
            <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-foreground">Aparecer en el mapa</p>
                    <p className="text-[13px] text-muted-foreground" data-testid="estado-ajuste-mapa">{mio.cargando ? 'Mirando…' : estado}</p>
                </div>
                <button type="button" role="switch" aria-checked={encendido} aria-label="Aparecer en el mapa" onClick={cambiar}
                    disabled={mio.cargando || mio.guardando}
                    className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-50', encendido ? 'bg-foreground' : 'bg-fill-strong')}>
                    <span className={cn('absolute top-[3px] left-[3px] h-6 w-6 rounded-full bg-background shadow-e1 transition-transform', encendido && 'translate-x-5')} />
                </button>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">{TEXTO_PRIVACIDAD} Solo para mayores de 18 años.</p>
            {encendido && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/mapa" className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold inline-flex items-center">Ver el mapa</Link>
                    <button onClick={() => setHoja(true)} className="pulsable h-9 px-4 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold">Cambiar</button>
                </div>
            )}
            <HojaAparecer abierta={hoja} onCerrar={() => setHoja(false)} mio={mio}
                onElegirEnMapa={() => navigate('/mapa?elegir=zona')} />
        </section>
    );
}

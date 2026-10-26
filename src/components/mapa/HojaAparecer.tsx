import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, LocateFixed, Map as MapaIcono, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { NOMBRE_PAPEL, horaCorta, type PuntoMapa } from '../../lib/mapa';
import { FalloUbicacion, pedirUbicacion } from '../../lib/ubicacion';
import { mapaLocal, mapaService, type Ficha } from '../../services/mapaService';
import { useAuth } from '../../context/AuthContext';
import type { MiPuntoMapa } from '../../hooks/useMiPuntoMapa';
import { Burbuja } from './Burbuja';
import { Hoja } from './Hoja';

export const TEXTO_PRIVACIDAD = 'Saldrás en una zona aproximada (unos 500 m), nunca en tu calle. Lo puedes quitar cuando quieras.';

type Modo = 'zona' | 'ahora';
type Fuente = 'ubicacion' | 'mapa';

// «Aparecer en el mapa»: apagado por defecto, y solo con la casilla de los 18 años. Dos modos:
// «Mi zona» (fija: la ubicación una vez o el barrio elegido en el mapa) y «Estoy aquí ahora»
// (la del momento, que caduca sola a las 4 h o con «Ya me voy»). Sirve también para cambiarlo.
export function HojaAparecer({ abierta, onCerrar, mio, onElegirEnMapa, onHecho, modoInicial }: {
    abierta: boolean;
    onCerrar: () => void;
    mio: MiPuntoMapa;
    /** Elegir la zona moviendo el mapa (en el mapa, o abriendo /mapa desde los ajustes) */
    onElegirEnMapa: () => void;
    /** Después de aparecer, moverse o volver a la zona (el mapa se centra ahí) */
    onHecho?: (p: PuntoMapa | null) => void;
    modoInicial?: Modo;
}) {
    const { user, userProfile } = useAuth();
    const uid = user?.uid;
    const encendido = !!mio.punto;
    const [modo, setModo] = useState<Modo>('zona');
    const [fuente, setFuente] = useState<Fuente>('ubicacion');
    const [mayor, setMayor] = useState(false);
    const [ficha, setFicha] = useState<Ficha | null>(null);
    const [error, setError] = useState('');
    const [ocupado, setOcupado] = useState(false);

    // Cada vez que se abre: lo que hay ahora y cómo te verán
    useEffect(() => {
        if (!abierta || !uid) return;
        setModo(modoInicial || (mio.punto?.ahora ? 'ahora' : 'zona'));
        setFuente('ubicacion');
        setError('');
        setMayor(mapaLocal.mayorDeEdad(uid));
        let cancelado = false;
        mapaService.fichaDePerfil(uid, userProfile, user?.photoURL).then(f => { if (!cancelado) setFicha(f); }).catch(() => {});
        return () => { cancelado = true; };
    }, [abierta]); // eslint-disable-line react-hooks/exhaustive-deps

    const vista = ficha || mio.punto;

    const aplicar = async () => {
        if (!uid || ocupado) return;
        if (!encendido && !mayor) { setError('Para aparecer en el mapa tienes que tener 18 años o más.'); return; }
        mapaLocal.confirmarMayorDeEdad(uid);
        setError('');
        if (modo === 'zona' && fuente === 'mapa') { onCerrar(); onElegirEnMapa(); return; }
        setOcupado(true);
        try {
            // «Estoy aquí ahora» es la ubicación de este momento, no una de hace un rato
            const pos = await pedirUbicacion({ vieja: modo === 'ahora' ? 0 : 60000 });
            const p = await mio.aparecer({ modo, lat: pos.lat, lng: pos.lng });
            toast.success(p.ahora && p.caduca ? `Estás aquí ahora, hasta las ${horaCorta(p.caduca)}` : `Sales en el mapa${p.zona ? `: ${p.zona}` : ''}`);
            onCerrar();
            onHecho?.(p);
        } catch (e) {
            setError(e instanceof FalloUbicacion ? e.message : 'No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
        } finally {
            setOcupado(false);
        }
    };

    const quitar = async () => {
        try { await mio.quitar(); toast.success('Ya no sales en el mapa'); onCerrar(); }
        catch { setError('No se ha podido quitar. Revisa la conexión e inténtalo otra vez.'); }
    };

    const yaMeVoy = async () => {
        try {
            const p = await mio.yaMeVoy();
            toast.success(p ? `Vuelves a tu zona: ${p.zona}` : 'Ya no sales en el mapa');
            onCerrar();
            onHecho?.(p);
        } catch { setError('No se ha podido guardar. Revisa la conexión e inténtalo otra vez.'); }
    };

    const ahoraActivo = !!mio.punto?.ahora && !!mio.punto.caduca;
    const textoBoton = modo === 'zona' && fuente === 'mapa'
        ? 'Elegir en el mapa'
        : encendido ? (modo === 'ahora' ? (ahoraActivo ? 'Seguir aquí 4 horas más' : 'Estoy aquí ahora') : 'Guardar mi zona') : 'Aparecer en el mapa';
    // Amarillo solo para encenderlo; lo demás, en neutro
    const amarillo = !encendido && !(modo === 'zona' && fuente === 'mapa');

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta="Aparecer en el mapa" titulo={encendido ? 'Cómo sales en el mapa' : 'Aparecer en el mapa'}>
            {/* Así te verán */}
            <div className="flex items-center gap-3 p-3 rounded-[16px] bg-fill">
                {vista ? <Burbuja p={{ ...vista, ahora: modo === 'ahora' }} /> : <span className="h-12 w-12 rounded-full bg-fill-strong animate-pulse" />}
                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold truncate">{vista?.nombre || 'Tu perfil'}</span>
                    <span className="block text-[13px] text-muted-foreground truncate">
                        {vista ? [NOMBRE_PAPEL[vista.papel], ...vista.etiquetas].join(' · ') : 'Cargando…'}
                    </span>
                </span>
            </div>

            {encendido && mio.punto && (
                <p className="mt-3 text-[14px]" data-testid="estado-mapa">
                    {ahoraActivo && mio.punto.caduca
                        ? <>Estás aquí ahora, hasta las <b className="font-bold">{horaCorta(mio.punto.caduca)}</b>.</>
                        : <>Sales en <b className="font-bold">{mio.punto.zona || 'tu zona'}</b>.</>}
                </p>
            )}

            {/* Mi zona · Estoy aquí ahora */}
            <div role="radiogroup" aria-label="Cómo aparecer" className="mt-4 flex p-0.5 rounded-[10px] bg-fill">
                {([['zona', 'Mi zona'], ['ahora', 'Estoy aquí ahora']] as const).map(([k, t]) => (
                    <button key={k} role="radio" aria-checked={modo === k} onClick={() => setModo(k)}
                        className={cn('flex-1 h-8 rounded-[8px] text-[13px] font-semibold transition-colors', modo === k ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                        {t}
                    </button>
                ))}
            </div>

            {modo === 'zona' ? (
                <div className="mt-3 space-y-2">
                    <p className="text-[14px] text-muted-foreground">Tu barrio, fijo: te encuentran aunque no estés de bolo.</p>
                    {([
                        ['ubicacion', LocateFixed, 'Usar mi ubicación, una vez', 'Se mira ahora y solo se guarda la zona'],
                        ['mapa', MapaIcono, 'Elegir en el mapa', 'Mueves el mapa hasta tu barrio'],
                    ] as const).map(([k, Icono, t, sub]) => (
                        <button key={k} role="radio" aria-checked={fuente === k} onClick={() => setFuente(k)}
                            className={cn('pulsable w-full flex items-center gap-3 p-3 rounded-[14px] border text-left', fuente === k ? 'border-foreground' : 'border-hairline')}>
                            <Icono className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-[15px] font-semibold">{t}</span>
                                <span className="block text-[13px] text-muted-foreground">{sub}</span>
                            </span>
                            <span className={cn('h-5 w-5 shrink-0 rounded-full border-2', fuente === k ? 'border-foreground bg-foreground shadow-[inset_0_0_0_3px_hsl(var(--background))]' : 'border-hairline-strong')} />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="mt-3 flex items-start gap-3 p-3 rounded-[14px] border border-hairline">
                    <Crosshair className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <p className="text-[14px]">
                        Para cuando estás en un bolo: sales donde estás ahora y <b className="font-bold">se quita solo a las 4 horas</b>, o antes con «Ya me voy».
                    </p>
                </div>
            )}

            {/* Lo importante: qué se ve de ti */}
            <div className="mt-4 flex items-start gap-3 p-3.5 rounded-[14px] bg-pastel-cielo text-pastel-cielo-ink">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-[14px] leading-snug">
                    <p className="font-semibold">{TEXTO_PRIVACIDAD}</p>
                    <p className="mt-1">Tu posición exacta no sale de tu móvil: solo se guarda la zona. <Link to="/privacidad#mapa" className="underline underline-offset-2">Privacidad</Link></p>
                </div>
            </div>

            {!encendido && (
                <label className="mt-4 flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={mayor} onChange={e => setMayor(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-foreground" />
                    <span className="text-[14px]">
                        <b className="font-semibold">Tengo 18 años o más.</b> <span className="text-muted-foreground">Solo para mayores de 18 años.</span>
                    </span>
                </label>
            )}

            {error && <p role="alert" className="mt-3 text-[13px] text-destructive">{error}</p>}

            <button onClick={aplicar} disabled={ocupado || mio.guardando || (!encendido && !mayor)}
                className={cn('pulsable mt-4 w-full h-[52px] rounded-[14px] text-[16px] font-bold disabled:opacity-40',
                    amarillo ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background')}>
                {ocupado ? (modo === 'ahora' || fuente === 'ubicacion' ? 'Mirando dónde estás…' : 'Guardando…') : textoBoton}
            </button>

            {encendido && (
                <div className="mt-2 flex gap-2">
                    {ahoraActivo && (
                        <button onClick={yaMeVoy} disabled={mio.guardando} className="pulsable flex-1 h-9 rounded-full bg-fill-strong text-foreground text-[14px] font-semibold disabled:opacity-40">
                            Ya me voy
                        </button>
                    )}
                    <button onClick={quitar} disabled={mio.guardando} className="pulsable flex-1 h-9 rounded-full bg-fill text-destructive text-[14px] font-semibold disabled:opacity-40">
                        Quitarme del mapa
                    </button>
                </div>
            )}
        </Hoja>
    );
}

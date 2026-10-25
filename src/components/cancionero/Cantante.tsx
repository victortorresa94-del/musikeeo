import { Fragment, useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    alParar, claqueta, cuandoSuene, liberarSonido, pararSonido, prepararSonido, sonidoListo, tocarAcorde, tocarNota,
} from '../../lib/sonido';
import { bpmDeToques, mismoAcorde, PAUSA_TOQUES, TEMPO_MAX, TEMPO_MIN, tonoQueSuena } from '../../lib/cantar';
import { useCancionero } from '../../hooks/useCancionero';
import { Paso } from './Controles';
import type { CancionLeida } from '../../lib/acordes';
import type { AjustesCancion, Cancion } from '../../types/cancionero';

// Las herramientas de quien canta: oír el tono antes de entrar y contar la entrada.
// Nada suena si no se pulsa, y todo se calla al salir de la página o al esconderla.

// Mientras haya algún botón de sonido en pantalla se escucha si la página se esconde; cuando
// se va el último (se sale de la canción o del bolo), se calla y se devuelve el audio
let enPantalla = 0;
const alEsconder = () => { if (document.visibilityState === 'hidden') liberarSonido(); };
function useSonidoDeLaPagina() {
    useEffect(() => {
        if (enPantalla++ === 0) {
            document.addEventListener('visibilitychange', alEsconder);
            window.addEventListener('pagehide', liberarSonido);
        }
        return () => {
            if (--enPantalla > 0) return;
            document.removeEventListener('visibilitychange', alEsconder);
            window.removeEventListener('pagehide', liberarSonido);
            liberarSonido();
        };
    }, []);
}

// El tono (su acorde) y el primer acorde de la canción, o solo la nota de arranque. «mostrar»
// recibe el nombre de lo que suena en cada momento (null al acabar). false si no hay nada que dar
function darElTono(leida: CancionLeida, ajustes: AjustesCancion, soloNota: boolean, mostrar: (nombre: string | null) => void): boolean {
    const t = tonoQueSuena(leida, ajustes);
    if (!t || !prepararSonido()) return false;
    pararSonido();
    if (soloNota) {
        tocarNota(t.nota.midi);
        mostrar(t.nota.nombre);
        cuandoSuene(1.9, () => mostrar(null));
        return true;
    }
    const igual = mismoAcorde(t.tonica, t.primero);
    tocarAcorde(t.tonica.raiz, false, { intervalos: t.tonica.intervalos, duracion: igual ? 1.8 : 1.05 });
    mostrar(t.tonica.nombre);
    if (!igual) {
        tocarAcorde(t.primero.raiz, false, { intervalos: t.primero.intervalos, bajo: t.primero.bajo, cuando: 1.15, duracion: 1.4 });
        cuandoSuene(1.19, () => mostrar(t.primero.nombre));
    }
    cuandoSuene(igual ? 2.1 : 2.8, () => mostrar(null));
    return true;
}

const LARGO = 450;    // ms manteniendo pulsado: solo la nota

// «Dame el tono»: el nombre del tono, en el centro del control de tono, se toca. Un toque: el
// acorde del tono y el primero de la canción, y se ve cuál suena. Mantener: solo la nota de
// arranque, cerca del Do central, para cantar. Va dentro del valor de <Paso> (no ocupa más sitio).
// «leida» es la de useMusicaCancion: lo que suena es lo mismo que dice tonoSuena
export function DameElTono({ leida, ajustes, desactivado, className, children }: {
    leida: CancionLeida; ajustes: AjustesCancion; desactivado?: boolean; className?: string; children: React.ReactNode;
}) {
    const [suena, setSuena] = useState<string | null>(null);
    const [nota, setNota] = useState<string | null>(null);     // mantenido: la que sonará al soltar
    const pulsado = useRef<{ largo: boolean; tocado: boolean } | null>(null);
    const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

    useSonidoDeLaPagina();
    useEffect(() => alParar(() => setSuena(null)), []);
    useEffect(() => () => pararSonido(), [leida]);          // otra canción: se calla
    useEffect(() => {
        const e = espera;
        return () => clearTimeout(e.current);
    }, []);

    const dar = (soloNota: boolean) => darElTono(leida, ajustes, soloNota, setSuena);

    // Al bajar el dedo todavía no se despierta el sonido: en el iPhone no vale (solo al soltar)
    // y, si en realidad se desliza la barra, no tiene que pasar nada
    const alBajar = (e: React.PointerEvent) => {
        if (desactivado || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const p = { largo: false, tocado: false };
        pulsado.current = p;
        clearTimeout(espera.current);
        espera.current = setTimeout(() => {
            if (pulsado.current !== p) return;
            p.largo = true;
            // Ya desbloqueado, suena en el momento; si no, al soltar
            if (sonidoListo()) p.tocado = dar(true);
            else setNota(tonoQueSuena(leida, ajustes)?.nota.nombre ?? null);
        }, LARGO);
    };
    const alSoltar = (e: React.PointerEvent<HTMLButtonElement>) => {
        clearTimeout(espera.current);
        const p = pulsado.current;
        pulsado.current = null;
        setNota(null);
        if (!p) return;
        e.currentTarget.blur();
        if (!p.largo) dar(false);
        else if (!p.tocado) dar(true);
    };
    const alCancelar = () => { clearTimeout(espera.current); pulsado.current = null; setNota(null); };

    const visto = suena ?? nota;
    return (
        <button type="button" disabled={desactivado}
            onPointerDown={alBajar} onPointerUp={alSoltar} onPointerCancel={alCancelar} onPointerLeave={alCancelar}
            // Con el teclado suena al pulsar; con el dedo ya sonó al soltar, y se quita el foco (en
            // Android vuelve con el clic): el espacio del pedal sigue siendo para desplazar
            onClick={e => { if (e.detail === 0) dar(false); else e.currentTarget.blur(); }}
            onContextMenu={e => e.preventDefault()}
            aria-label="Dame el tono (mantén pulsado: solo la nota)" title="Dame el tono · mantén pulsado: solo la nota"
            className={cn('pulsable h-9 inline-flex items-center justify-center select-none [-webkit-touch-callout:none] disabled:cursor-default', className)}>
            <span aria-live="polite" className={cn('h-7 px-1.5 rounded-full inline-flex items-center gap-1 transition-colors',
                suena ? 'bg-foreground text-background' : nota && 'bg-fill-strong')}>
                {visto ?? children}
                {!desactivado && <Volume2 className={cn('h-3 w-3 shrink-0', !visto && 'text-muted-foreground')} aria-hidden />}
            </span>
        </button>
    );
}

// «1·2·3·4»: la claqueta para entrar, al tempo de la canción. Mientras cuenta, se ve el golpe.
// Solo aparece si la canción tiene tempo
export function BotonClaqueta({ bpm, className }: { bpm?: number; className?: string }) {
    const [pulso, setPulso] = useState(0);
    useSonidoDeLaPagina();
    if (!bpm) return null;
    const contar = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.detail > 0) e.currentTarget.blur();
        if (pulso) { pararSonido(); return; }
        if (!prepararSonido()) return;
        pararSonido();
        claqueta(bpm, 4, setPulso);
    };
    return (
        <button type="button" onClick={contar} aria-pressed={pulso > 0}
            aria-label={`Contar la entrada: 1, 2, 3, 4 a ${bpm} por minuto`} title={`Contar la entrada (${bpm} por minuto)`}
            className={cn('pulsable h-9 px-2.5 shrink-0 rounded-full bg-fill text-foreground flex items-center justify-center text-[14px] font-semibold tabular-nums', className)}>
            {[1, 2, 3, 4].map(n => (
                <Fragment key={n}>
                    {n > 1 && <span className="text-muted-foreground" aria-hidden>·</span>}
                    <span className={cn('w-[9px] text-center transition-transform duration-75',
                        pulso > 0 && (n === pulso ? 'scale-[1.35]' : 'text-muted-foreground'))}>{n}</span>
                </Fragment>
            ))}
        </button>
    );
}

// En los ajustes: el tono (también sin mantener pulsado) y el tempo, a toques o con − y +
export function AjustesCantante({ cancion, ajustes, leida }: { cancion: Cancion; ajustes: AjustesCancion; leida: CancionLeida }) {
    const { guardar } = useCancionero();
    const [suena, setSuena] = useState<string | null>(null);
    const [toques, setToques] = useState(0);
    const [marcado, setMarcado] = useState<number | null>(null);   // a toques, aún sin guardar
    const marcas = useRef<number[]>([]);
    const olvido = useRef<ReturnType<typeof setTimeout>>(undefined);
    const porGuardar = useRef<number | null>(null);
    const guardarBpm = useRef<(n: number) => void>(() => {});
    const bpm = marcado ?? cancion.bpm;
    const t = tonoQueSuena(leida, ajustes);

    const ponerBpm = (nuevo: number | undefined) => {
        const c: Cancion = { ...cancion, ajustes };
        if (nuevo) c.bpm = nuevo; else delete c.bpm;
        guardar(c, { esperar: true });
    };

    useEffect(() => alParar(() => setSuena(null)), []);
    useEffect(() => { guardarBpm.current = ponerBpm; });
    // Si se cierra mientras se marca, lo marcado se guarda igual
    useEffect(() => {
        const espera = olvido, pendiente = porGuardar, guardarlo = guardarBpm;
        return () => {
            clearTimeout(espera.current);
            if (pendiente.current) guardarlo.current(pendiente.current);
        };
    }, []);

    // Al bajar el dedo (no al soltarlo), que es cuando se marca el golpe. Con la hora del toque,
    // no la de ahora: si el móvil va cargado, el toque llega tarde pero su hora es la buena.
    // Se guarda al parar de tocar (guardar a cada toque redibuja la hoja mientras se marca)
    const marcar = (e: React.PointerEvent | React.MouseEvent) => {
        const ahora = e.timeStamp || performance.now();
        const lista = marcas.current;
        if (lista.length && ahora - lista[lista.length - 1] > PAUSA_TOQUES) lista.length = 0;
        lista.push(ahora);
        setToques(lista.length);
        const nuevo = bpmDeToques(lista);
        if (nuevo) { setMarcado(nuevo); porGuardar.current = nuevo; }
        clearTimeout(olvido.current);
        olvido.current = setTimeout(() => {
            marcas.current = [];
            setToques(0);
            if (porGuardar.current) guardarBpm.current(porGuardar.current);
            porGuardar.current = null;
            setMarcado(null);
        }, PAUSA_TOQUES);
    };
    const cambiarBpm = (nuevo: number | undefined) => {
        clearTimeout(olvido.current);
        marcas.current = [];
        porGuardar.current = null;
        setToques(0);
        setMarcado(null);
        ponerBpm(nuevo);
    };

    const compacto = 'pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground disabled:opacity-30';
    return (
        <>
            <div className="py-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold text-foreground">Dame el tono</p>
                    <div className="flex items-center gap-1.5">
                        <button type="button" disabled={!t} onClick={() => darElTono(leida, ajustes, false, setSuena)} className={compacto}>Acordes</button>
                        <button type="button" disabled={!t} onClick={() => darElTono(leida, ajustes, true, setSuena)} className={compacto}>La nota</button>
                    </div>
                </div>
                <div className="mt-1.5 text-[13px] text-muted-foreground">
                    {t ? <>
                        Suena <b className="text-foreground">{suena ?? t.tonica.nombre}</b>
                        {!suena && !mismoAcorde(t.tonica, t.primero) && <> y luego <b className="text-foreground">{t.primero.nombre}</b>, el primer acorde</>}
                        {!suena && <>; la nota de arranque es <b className="text-foreground">{t.nota.nombre}</b></>}.
                        {' '}En la barra, toca el tono para oírlo; si lo mantienes pulsado, suena solo la nota.
                    </> : 'Sin acordes no sabemos el tono.'}
                </div>
            </div>

            <div className="py-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold text-foreground">Tempo</p>
                    <Paso etiqueta="Tempo"
                        valor={bpm ? <>{bpm}<span className="ml-1 text-[12px] text-muted-foreground">bpm</span></> : '—'}
                        onMenos={() => cambiarBpm(Math.max(TEMPO_MIN, (bpm ?? 101) - 1))} menosDesactivado={!!bpm && bpm <= TEMPO_MIN}
                        onMas={() => cambiarBpm(Math.min(TEMPO_MAX, (bpm ?? 99) + 1))} masDesactivado={!!bpm && bpm >= TEMPO_MAX} />
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                    <button type="button" onPointerDown={marcar} onClick={e => { if (e.detail === 0) marcar(e); }}
                        aria-label="Marcar el tempo a toques"
                        className="pulsable flex-1 h-[52px] rounded-[14px] bg-fill text-[15px] font-semibold text-foreground select-none touch-manipulation">
                        {toques === 0 ? 'Marcar a toques' : toques < 4 ? `Sigue… ${toques} de 4` : `${bpm} bpm · sigue o para`}
                    </button>
                    <BotonClaqueta bpm={bpm} className="h-[52px] rounded-[14px] px-4" />
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                    Toca al ritmo de la canción 4 veces o más. Con tempo, «1·2·3·4» cuenta la entrada; también en la barra del bolo.
                    {bpm && <> <button type="button" onClick={() => cambiarBpm(undefined)} className="font-semibold text-foreground underline underline-offset-2">Quitar</button></>}
                </p>
            </div>
        </>
    );
}

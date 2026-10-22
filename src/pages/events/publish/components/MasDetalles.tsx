import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, ChevronDown, Clock, X } from 'lucide-react';
import type { DetallesBolo } from '../../../../types';
import { cn } from '../../../../lib/utils';
import { Campo, Pastilla } from './Campos';
import { CAMPO, DESPLAZAMIENTO_BOLO, ESPACIO_BOLO, SONIDO_BOLO, abrirSelector, fechaLocal, hoyISO, miles } from '../opciones';

interface Props {
    detalles: DetallesBolo;
    onChange: (d: DetallesBolo) => void;
    /** El día del bolo: el plazo para postularse no puede pasar de ahí */
    fechaBolo: string;
}

type Texto = 'formato' | 'duracion' | 'repertorio' | 'escenario' | 'parking' | 'comida' | 'pago' | 'lugar';

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-[16px] font-bold">{titulo}</h3>
            {children}
        </div>
    );
}

/** Hora o fecha: el selector nativo invisible encima, como en el paso 2, y una «x» para quitarla */
function Selector({ tipo, valor, vacio, texto, etiqueta, min, max, onCambia }: {
    tipo: 'time' | 'date'; valor?: string; vacio: string; texto?: string; etiqueta: string; min?: string; max?: string; onCambia: (v?: string) => void;
}) {
    const Icono = tipo === 'time' ? Clock : Calendar;
    return (
        <label className="relative flex items-center gap-2.5 h-[52px] rounded-[14px] bg-fill px-4 focus-within:ring-2 focus-within:ring-foreground/10">
            <Icono className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
            <span className={cn('flex-1 text-[16px] truncate', !valor && 'text-muted-foreground')}>{valor ? texto ?? valor : vacio}</span>
            <input
                type={tipo}
                value={valor ?? ''}
                min={min}
                max={max}
                onChange={e => onCambia(e.target.value || undefined)}
                onClick={e => abrirSelector(e.currentTarget)}
                aria-label={etiqueta}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
            {valor && (
                <button
                    type="button"
                    onClick={e => { e.preventDefault(); onCambia(undefined); }}
                    aria-label={`Quitar ${etiqueta.toLowerCase()}`}
                    className="pulsable relative z-10 -mr-1.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </label>
    );
}

// Paso 3: lo opcional, plegado. Cerrado no alarga el flujo; lo que se rellene sale en la ficha del bolo
export default function MasDetalles({ detalles, onChange, fechaBolo }: Props) {
    const reduceMotion = useReducedMotion();
    const [abierto, setAbierto] = useState(() => Object.values(detalles).some(v => v !== undefined && v !== ''));
    const rellenos = Object.values(detalles).filter(v => v !== undefined && v !== '').length;

    // Lo vacío no se guarda: la clave se quita
    const pon = <K extends keyof DetallesBolo>(k: K, v: DetallesBolo[K] | undefined) => {
        const next = { ...detalles };
        if (v === undefined || v === '') delete next[k];
        else next[k] = v;
        onChange(next);
    };

    const texto = (k: Texto, etiqueta: string, ejemplo: string) => (
        <Campo etiqueta={etiqueta}>
            <input
                value={detalles[k] ?? ''}
                onChange={e => pon(k, e.target.value)}
                placeholder={`Ej.: ${ejemplo}`}
                maxLength={80}
                className={CAMPO}
            />
        </Campo>
    );

    // Pulsar la elegida otra vez la quita: todo esto es opcional
    const pastillas = <K extends 'sonido' | 'desplazamiento' | 'espacio'>(k: K, opciones: { valor: NonNullable<DetallesBolo[K]>; pastilla: string }[]) => (
        <div className="flex flex-wrap gap-1.5">
            {opciones.map(o => (
                <Pastilla key={o.valor} on={detalles[k] === o.valor} onClick={() => pon(k, detalles[k] === o.valor ? undefined : o.valor)}>
                    {o.pastilla}
                </Pastilla>
            ))}
        </div>
    );

    const hoy = hoyISO();

    return (
        <section className="rounded-[20px] bg-card border border-hairline shadow-e1">
            <button
                type="button"
                onClick={() => setAbierto(a => !a)}
                aria-expanded={abierto}
                className="pulsable w-full flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left"
            >
                <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold">Más detalles (opcional)</span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                        {rellenos > 0
                            ? `Has añadido ${rellenos} ${rellenos === 1 ? 'detalle' : 'detalles'}.`
                            : 'Duración, sonido, cómo se paga, el sitio… Así nadie tiene que preguntarlo.'}
                    </span>
                </span>
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200', abierto && 'rotate-180')} />
            </button>

            {abierto && (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-5 pt-1 space-y-7"
                >
                    <Grupo titulo="La actuación">
                        {texto('formato', 'Formato', 'Banda de 3 a 5 músicos')}
                        {texto('duracion', 'Duración', '2 pases de 45 min')}
                        {texto('repertorio', 'Repertorio', 'Versiones conocidas y algún tema propio')}
                    </Grupo>

                    <Grupo titulo="Logística">
                        <Campo etiqueta="Llegada y prueba de sonido">
                            <Selector tipo="time" valor={detalles.llegada} vacio="A qué hora" etiqueta="Hora de llegada" onCambia={v => pon('llegada', v)} />
                        </Campo>
                        <Campo etiqueta="Sonido">{pastillas('sonido', SONIDO_BOLO)}</Campo>
                        {texto('escenario', 'Escenario', 'Sí, 6 × 4 m')}
                        {texto('parking', 'Parking y carga', 'Carga y descarga en la puerta')}
                        {texto('comida', 'Comida', 'Cena para la banda')}
                    </Grupo>

                    <Grupo titulo="El dinero">
                        {texto('pago', 'Cómo y cuándo se paga', 'Transferencia, 7 días después')}
                        <Campo etiqueta="Desplazamiento">{pastillas('desplazamiento', DESPLAZAMIENTO_BOLO)}</Campo>
                    </Grupo>

                    <Grupo titulo="El sitio">
                        {texto('lugar', 'Nombre del sitio', 'Masía Can Ribes')}
                        <Campo etiqueta="Invitados o aforo">
                            <input
                                inputMode="numeric"
                                value={detalles.invitados ? miles(detalles.invitados) : ''}
                                onChange={e => pon('invitados', Number(e.target.value.replace(/\D/g, '')) || undefined)}
                                placeholder="Ej.: 120"
                                aria-label="Invitados o aforo"
                                className={CAMPO}
                            />
                        </Campo>
                        <Campo etiqueta="Espacio">{pastillas('espacio', ESPACIO_BOLO)}</Campo>
                    </Grupo>

                    <Grupo titulo="Plazo">
                        <Campo etiqueta="Último día para postularse" ayuda="Pasado ese día, nadie más podrá postularse.">
                            <Selector
                                tipo="date"
                                valor={detalles.cierra}
                                texto={detalles.cierra ? fechaLocal(detalles.cierra).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : undefined}
                                vacio="Sin plazo"
                                etiqueta="Último día para postularse"
                                min={hoy}
                                max={fechaBolo && fechaBolo >= hoy ? fechaBolo : undefined}
                                onCambia={v => pon('cierra', v)}
                            />
                        </Campo>
                    </Grupo>
                </motion.div>
            )}
        </section>
    );
}

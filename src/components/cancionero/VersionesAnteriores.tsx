import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Copy, History } from 'lucide-react';
import { useCancionero } from '../../hooks/useCancionero';
import { versionesDe, type MotivoVersion, type Version } from '../../services/versionesService';
import { BotonHoja, Hoja } from './Hoja';
import type { Cancion } from '../../types/cancionero';

// Las letras de antes de una canción (ver versionesService): verlas y recuperar una. Se monta al
// abrirla (key), así siempre empieza en la lista y con lo último guardado
const MOTIVO: Record<MotivoVersion, string> = {
    editar: 'Antes de editarla',
    otro: 'La cambió otro aparato',
    importar: 'Antes de importar',
};

function cuando(fecha: string): string {
    const d = new Date(fecha);
    const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
    return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, ${hora}`;
}

const clave = (l: string) => l.trim().replace(/\s+/g, ' ').toLowerCase();

export function VersionesAnteriores({ cancion, abierta, onCerrar }: { cancion: Cancion; abierta: boolean; onCerrar: () => void }) {
    const { guardar } = useCancionero();
    const [lista, setLista] = useState<Version[] | null>(null);
    const [vista, setVista] = useState<Version | null>(null);
    useEffect(() => {
        let vivo = true;
        void versionesDe(cancion.id).then(v => { if (vivo) setLista(v); });
        return () => { vivo = false; };
    }, [cancion.id]);

    // Qué líneas tiene cada versión que ahora no están (lo que se recuperaría)
    const ahora = useMemo(() => new Set(cancion.texto.split('\n').map(clave).filter(Boolean)), [cancion.texto]);
    const faltan = (v: Version) => v.texto.split('\n').filter(l => clave(l) && !ahora.has(clave(l))).length;

    const recuperar = (v: Version) => {
        const antes = cancion;
        guardar({ ...cancion, texto: v.texto });
        toast.success('Versión recuperada', { description: 'La letra que tenías se ha guardado también como versión anterior.', action: { label: 'Deshacer', onClick: () => guardar(antes) }, duration: 8000 });
        onCerrar();
    };
    const copiar = async (v: Version) => {
        try { await navigator.clipboard.writeText(v.texto); toast.success('Copiada'); } catch { toast('No se pudo copiar'); }
    };

    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} alta titulo={vista ? cuando(vista.fecha) : 'Versiones anteriores'}
            izquierda={vista ? <BotonHoja onClick={() => setVista(null)}><ChevronLeft className="h-4 w-4 inline -mt-0.5" /> Lista</BotonHoja> : undefined}
            derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}
            pie={vista ? (
                <div className="px-4 py-3 flex gap-2 border-t border-hairline">
                    <button onClick={() => void copiar(vista)} className="pulsable h-[52px] px-4 rounded-[14px] bg-fill text-[15px] font-semibold text-foreground flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Copiar
                    </button>
                    <button onClick={() => recuperar(vista)} className="pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold">
                        Recuperar esta
                    </button>
                </div>
            ) : undefined}>
            {vista ? (
                <div className="px-4 pb-4">
                    <p className="mb-3 text-[13px] text-muted-foreground">{MOTIVO[vista.motivo]}. En verde, lo que ahora no está.</p>
                    <div className="rounded-2xl bg-fill p-3 font-mono text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
                        {vista.texto.split('\n').map((l, i) => (
                            <div key={i} className={clave(l) && !ahora.has(clave(l)) ? 'bg-pastel-menta text-pastel-menta-ink rounded px-1 -mx-1' : undefined}>{l || ' '}</div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="px-4 pb-5">
                    <p className="mb-3 text-[13px] text-muted-foreground">
                        Cada vez que cambia la letra, la de antes se guarda aquí, en este aparato. Toca una para verla y recuperarla.
                    </p>
                    {lista === null ? null : lista.length === 0 ? (
                        <div className="rounded-2xl bg-fill p-4 text-[14px] text-foreground flex gap-3">
                            <History className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <p>Todavía no hay versiones anteriores de esta canción en este aparato. A partir de ahora, cada cambio deja aquí la letra de antes.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            {lista.map((v, i) => {
                                const n = faltan(v);
                                return (
                                    <button key={`${v.fecha}-${i}`} onClick={() => setVista(v)} className="w-full flex items-center gap-3 px-3 min-h-[58px] py-2 text-left active:bg-fill-strong">
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[15px] font-semibold text-foreground">{cuando(v.fecha)}</span>
                                            <span className="block truncate text-[13px] text-muted-foreground">
                                                {MOTIVO[v.motivo]} · {n ? `${n} ${n === 1 ? 'línea que ahora no está' : 'líneas que ahora no están'}` : 'nada que no esté ahora'}
                                            </span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </Hoja>
    );
}

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Paso, Segmentado } from './Controles';
import type { AjustesCancion } from '../../types/cancionero';

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    ajustes: AjustesCancion;
    cambiar: (cambio: Partial<AjustesCancion>) => void;
    tonoSuena: string | null;
    posturas: string | null;            // tono de las posturas con cejilla
    recomendada: { cejilla: number; dificiles: number } | null;
    formasRecomendadas: string[];
    dificilesAhora: number;
    onImprimir: () => void;
    onEditar: () => void;
    onBorrar: () => void;
}

const Fila = ({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: React.ReactNode }) => (
    <div className="py-3">
        <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-foreground">{titulo}</p>
            {children}
        </div>
        {nota && <div className="mt-1.5 text-[13px] text-muted-foreground">{nota}</div>}
    </div>
);

export function PanelAjustes({ abierto, onCerrar, ajustes: a, cambiar, tonoSuena, posturas, recomendada, formasRecomendadas, dificilesAhora, onImprimir, onEditar, onBorrar }: Props) {
    const sugerir = recomendada && recomendada.cejilla !== a.cejilla && recomendada.dificiles < dificilesAhora;
    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label="Ajustes de la canción"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md max-h-[88dvh] overflow-y-auto bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
                    >
                        <div className="sticky top-0 z-10 bg-sheet px-4 pt-2 pb-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <span className="w-[62px]" />
                                <p className="font-semibold text-[16px] text-foreground">Ajustes</p>
                                <button onClick={onCerrar} className="w-[62px] text-right text-[15px] font-semibold text-foreground active:opacity-60">Listo</button>
                            </div>
                        </div>

                        <div className="px-4 divide-y divide-hairline">
                            <Fila titulo="Tono" nota={tonoSuena && <>Suena en <b className="text-foreground">{tonoSuena}</b>{a.semitonos !== 0 && ` (${a.semitonos > 0 ? '+' : ''}${a.semitonos} semitonos)`}</>}>
                                <div className="flex items-center gap-2">
                                    {a.semitonos !== 0 && (
                                        <button onClick={() => cambiar({ semitonos: 0 })} aria-label="Volver al tono original" className="pulsable h-9 w-9 rounded-full bg-fill flex items-center justify-center text-foreground">
                                            <RotateCcw className="h-4 w-4" />
                                        </button>
                                    )}
                                    <Paso etiqueta="Tono" valor={`${a.semitonos > 0 ? '+' : ''}${a.semitonos}`}
                                        onMenos={() => cambiar({ semitonos: a.semitonos <= -11 ? 0 : a.semitonos - 1 })}
                                        onMas={() => cambiar({ semitonos: a.semitonos >= 11 ? 0 : a.semitonos + 1 })} />
                                </div>
                            </Fila>

                            <Fila titulo="Cejilla" nota={<>
                                {a.cejilla > 0 && posturas && <p>Con cejilla en el {a.cejilla}, tocas posturas de <b className="text-foreground">{posturas}</b>.</p>}
                                {sugerir && (
                                    <p className="mt-1">
                                        Más fácil {recomendada!.cejilla === 0 ? 'sin cejilla' : `con cejilla en el ${recomendada!.cejilla}`}: {formasRecomendadas.join(', ')}…{' '}
                                        <button onClick={() => cambiar({ cejilla: recomendada!.cejilla })} className="font-semibold text-foreground underline underline-offset-2">Usar</button>
                                    </p>
                                )}
                            </>}>
                                <Paso etiqueta="Cejilla" valor={a.cejilla === 0 ? 'No' : a.cejilla}
                                    onMenos={() => cambiar({ cejilla: a.cejilla - 1 })} menosDesactivado={a.cejilla <= 0}
                                    onMas={() => cambiar({ cejilla: a.cejilla + 1 })} masDesactivado={a.cejilla >= 9} />
                            </Fila>

                            <div className="py-3 space-y-2">
                                <p className="text-[15px] font-semibold text-foreground">Cifrado</p>
                                <Segmentado etiqueta="Cifrado" valor={a.notacion} onCambio={notacion => cambiar({ notacion })}
                                    opciones={[['original', 'Como está'], ['americana', 'C D E'], ['latina', 'Do Re Mi']] as const} />
                                <Segmentado etiqueta="Alteraciones" valor={a.alteraciones} onCambio={alteraciones => cambiar({ alteraciones })}
                                    opciones={[['auto', 'Automático'], ['sostenidos', 'Sostenidos ♯'], ['bemoles', 'Bemoles ♭']] as const} />
                            </div>

                            <div className="py-3 space-y-2">
                                <p className="text-[15px] font-semibold text-foreground">Mostrar</p>
                                <Segmentado etiqueta="Mostrar" valor={a.vista} onCambio={vista => cambiar({ vista })}
                                    opciones={[['completa', 'Todo'], ['letra', 'Solo letra'], ['acordes', 'Solo acordes']] as const} />
                            </div>

                            <Fila titulo="Que quepa en la pantalla" nota="Elige el tamaño y las columnas para verla entera sin bajar.">
                                <Switch checked={a.ajustar} onCheckedChange={ajustar => cambiar({ ajustar })} aria-label="Que quepa en la pantalla" />
                            </Fila>

                            <div className="py-3 space-y-2">
                                <p className="text-[15px] font-semibold text-foreground">Columnas</p>
                                <Segmentado etiqueta="Columnas" valor={a.columnas} onCambio={columnas => cambiar({ columnas })} desactivado={a.ajustar}
                                    opciones={[[1, 'Una'], [2, 'Dos'], [3, 'Tres']] as const} />
                            </div>

                            <Fila titulo="Velocidad al desplazar">
                                <Paso etiqueta="Velocidad" valor={Math.round(a.velocidad / 6)}
                                    onMenos={() => cambiar({ velocidad: Math.max(6, a.velocidad - 6) })} menosDesactivado={a.velocidad <= 6}
                                    onMas={() => cambiar({ velocidad: Math.min(90, a.velocidad + 6) })} masDesactivado={a.velocidad >= 90} />
                            </Fila>
                        </div>

                        <div className="mx-4 mt-2 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                            <Accion icono={Printer} texto="Imprimir o guardar en PDF" onClick={onImprimir} />
                            <Accion icono={Pencil} texto="Editar el texto" onClick={onEditar} />
                            <Accion icono={Trash2} texto="Borrar la canción" onClick={onBorrar} peligro />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

function Accion({ icono: Icono, texto, onClick, peligro }: { icono: React.ElementType; texto: string; onClick: () => void; peligro?: boolean }) {
    return (
        <button onClick={onClick} className={`w-full h-12 px-4 flex items-center gap-3 text-[15px] active:bg-fill ${peligro ? 'text-destructive' : 'text-foreground'}`}>
            <Icono className="h-[18px] w-[18px]" /> {texto}
        </button>
    );
}

import { useRef, useState } from 'react';
import { Palette, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { BotonHoja, Hoja } from './Hoja';
import { ICONO_CAMPO } from './iconosFicha';
import { ICONO, pastelDeColor, pastelGrupo } from './estilo';
import { ICONOS_APP, pastelDeValor } from './catalogoVista';
import { useCatalogo } from '../../hooks/useCatalogo';
import { catalogoService, claveAspecto, COLORES, logoPequeno, type ColorPastel, type TipoValor } from '../../services/catalogoService';

// Cómo se ve cada grupo, estilo, etiqueta o quien canta (13-nov): su color y, en los grupos, su
// icono de la app o su logo. Víctor: «añadir un icono a cada grupo y proyecto musical, tanto
// algunos de la app como personalizado, para ponerle mi logo» · «colores de cada cosa».

const NOMBRE_COLOR: Record<ColorPastel, string> = {
    mantequilla: 'Amarillo', cielo: 'Azul', menta: 'Verde', lavanda: 'Lila', melocoton: 'Naranja', rosa: 'Rosa', gris: 'Gris',
};
const TITULO: Record<TipoValor, string> = { grupo: 'Grupo', estilo: 'Estilo', etiqueta: 'Etiqueta', canta: 'Canta' };
const CAMPO_ICONO = { grupo: 'proyectos', estilo: 'estilo', etiqueta: 'etiqueta', canta: 'canta' } as const;



// El icono de un valor: su logo, un icono de la app o el de su tipo
export function IconoValor({ tipo, valor, className }: { tipo: TipoValor; valor: string; className?: string }) {
    useCatalogo();
    const a = catalogoService.aspecto(claveAspecto(tipo, valor));
    if (a?.imagen) return <img src={a.imagen} alt="" aria-hidden className={cn('h-4 w-4 shrink-0 rounded-full object-contain bg-background', className)} />;
    if (a?.icono) return <img src={a.icono} alt="" aria-hidden className={cn('h-4 w-4 shrink-0 object-contain', className)} />;
    const Icono = ICONO_CAMPO[CAMPO_ICONO[tipo]];
    return <Icono className={cn('h-3.5 w-3.5 shrink-0', className)} aria-hidden />;
}

// Un grupo en su círculo de color, con su logo o su icono (las listas y los filtros)
export function CirculoGrupo({ grupo, className, imagen = 'h-6 w-6' }: { grupo: string; className?: string; imagen?: string }) {
    useCatalogo();
    const a = catalogoService.aspecto(claveAspecto('grupo', grupo));
    return (
        <span className={cn('h-7 w-7 shrink-0 rounded-full flex items-center justify-center overflow-hidden', pastelGrupo(grupo).fondo, className)}>
            {a?.imagen
                ? <img src={a.imagen} alt="" aria-hidden className="h-full w-full object-contain bg-background" />
                : <img src={a?.icono ?? ICONO.rumba} alt="" aria-hidden className={cn(imagen, 'object-contain')} />}
        </span>
    );
}

// Un valor como píldora, con su color y su icono
export function PildoraValor({ tipo, valor, className }: { tipo: TipoValor; valor: string; className?: string }) {
    const p = pastelDeValor(tipo, valor);
    return (
        <span className={cn('h-6 px-2 rounded-full text-[12px] font-semibold inline-flex items-center gap-1 whitespace-nowrap', p.fondo, p.tinta, className)}>
            <IconoValor tipo={tipo} valor={valor} />{valor}
        </span>
    );
}

// El botón pequeño para cambiar color e icono (al lado de cada valor en los desplegables)
export function BotonAspecto({ tipo, valor, className }: { tipo: TipoValor; valor: string; className?: string }) {
    const [abierta, setAbierta] = useState(false);
    return (
        <>
            <button type="button" onClick={e => { e.stopPropagation(); setAbierta(true); }} aria-label={`Color${tipo === 'grupo' ? ' e icono' : ''} de ${valor}`}
                className={cn('pulsable h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-fill', className)}>
                <Palette className="h-4 w-4" />
            </button>
            {abierta && <EditarAspecto tipo={tipo} valor={valor} onCerrar={() => setAbierta(false)} />}
        </>
    );
}

export function EditarAspecto({ tipo, valor, onCerrar, encima }: { tipo: TipoValor; valor: string; onCerrar: () => void; encima?: boolean }) {
    useCatalogo();
    const clave = claveAspecto(tipo, valor);
    const a = catalogoService.aspecto(clave) ?? {};
    const archivo = useRef<HTMLInputElement>(null);
    const poner = (cambio: Partial<typeof a>) => catalogoService.ponerAspecto(clave, { ...a, nombre: a.nombre ?? valor, ...cambio });
    const subirLogo = async (f: File | undefined) => {
        if (!f) return;
        try { poner({ imagen: await logoPequeno(f), icono: undefined }); toast.success('Logo puesto'); } catch { toast('No se pudo leer esa imagen. Prueba con un PNG o JPG.'); }
    };
    return (
        <Hoja abierta encima={encima} onCerrar={onCerrar} titulo={`${TITULO[tipo]} · ${valor}`} derecha={<BotonHoja fuerte onClick={onCerrar}>Listo</BotonHoja>}>
            <div className="px-4 pb-6">
                <div className="flex justify-center py-2"><PildoraValor tipo={tipo} valor={valor} className="h-9 px-3.5 text-[15px]" /></div>

                <p className="mt-3 text-[13px] font-semibold text-muted-foreground">Color</p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                    <button role="radio" aria-checked={!a.color} onClick={() => poner({ color: undefined })}
                        className={cn('h-10 px-3 rounded-full border text-[13px] font-semibold', !a.color ? 'border-foreground' : 'border-hairline-strong text-muted-foreground')}>Automático</button>
                    {COLORES.map(c => {
                        const p = pastelDeColor(c);
                        return (
                            <button key={c} role="radio" aria-checked={a.color === c} aria-label={NOMBRE_COLOR[c]} onClick={() => poner({ color: c })}
                                className={cn('h-10 w-10 rounded-full border-2', p.fondo, a.color === c ? 'border-foreground' : 'border-transparent')} />
                        );
                    })}
                </div>

                {tipo === 'grupo' && (
                    <>
                        <p className="mt-5 text-[13px] font-semibold text-muted-foreground">Icono o logo</p>
                        <div className="mt-2 grid grid-cols-5 gap-2">
                            <button onClick={() => archivo.current?.click()} className="aspect-square rounded-2xl border border-dashed border-hairline-strong flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                                <Upload className="h-5 w-5" /> Tu logo
                            </button>
                            {a.imagen && (
                                <button aria-label="Tu logo (puesto)" className="aspect-square rounded-2xl border-2 border-foreground bg-fill flex items-center justify-center">
                                    <img src={a.imagen} alt="" className="h-10 w-10 object-contain rounded-lg" />
                                </button>
                            )}
                            {ICONOS_APP.map(src => (
                                <button key={src} onClick={() => poner({ icono: src, imagen: undefined })} aria-pressed={a.icono === src && !a.imagen}
                                    className={cn('aspect-square rounded-2xl bg-fill flex items-center justify-center border-2', a.icono === src && !a.imagen ? 'border-foreground' : 'border-transparent')}>
                                    <img src={src} alt="" className="h-10 w-10 object-contain" loading="lazy" />
                                </button>
                            ))}
                        </div>
                        {(a.icono || a.imagen) && (
                            <button onClick={() => poner({ icono: undefined, imagen: undefined })} className="mt-3 h-9 px-3 rounded-full text-[14px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                <X className="h-4 w-4" /> Sin icono
                            </button>
                        )}
                        <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={e => { void subirLogo(e.target.files?.[0]); e.target.value = ''; }} />
                        <p className="mt-2 text-[12.5px] text-muted-foreground">El logo se guarda pequeño (128 px) y sale en las píldoras y en la lista del grupo.</p>
                    </>
                )}
            </div>
        </Hoja>
    );
}

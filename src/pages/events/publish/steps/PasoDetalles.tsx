import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import type { PublishEventState, ActualizaCampo } from '../PublishEventPage';
import { cn } from '../../../../lib/utils';
import { Campo } from '../components/Campos';
import VistaPreviaBolo from '../components/VistaPreviaBolo';
import MasDetalles from '../components/MasDetalles';
import { CAMPO, miles, tituloSugerido } from '../opciones';

interface Props {
    data: PublishEventState;
    update: ActualizaCampo;
    necesidad?: string;
    etiquetas: string[];
}

const MAX_FOTO = 10 * 1024 * 1024;

// Paso 3: título, precio y descripción, y la vista previa del bolo tal y como saldrá en la lista
export default function PasoDetalles({ data, update, necesidad, etiquetas }: Props) {
    const inputFoto = useRef<HTMLInputElement>(null);
    const sugerido = tituloSugerido(necesidad, data.type, data.location);
    const largo = data.description.trim().length;

    const elegirFoto = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Eso no es una imagen.'); return; }
        if (file.size > MAX_FOTO) { toast.error('La foto pesa más de 10 MB. Prueba con otra.'); return; }
        const reader = new FileReader();
        reader.onloadend = () => update('image', reader.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div className="mt-7 space-y-6">
            <Campo
                etiqueta="Título"
                ayuda={!data.title.trim() && sugerido ? (
                    <button type="button" onClick={() => update('title', sugerido)} className="pulsable inline-flex items-center h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground max-w-full">
                        <span className="truncate">Usar «{sugerido}»</span>
                    </button>
                ) : 'Di qué buscas, para qué y dónde.'}
            >
                <input
                    value={data.title}
                    onChange={e => update('title', e.target.value)}
                    placeholder={sugerido ? 'Escribe un título' : 'Ej.: Banda de rumba para boda en Sitges'}
                    maxLength={120}
                    className={CAMPO}
                />
            </Campo>

            <Campo etiqueta="Presupuesto">
                <div className="flex gap-2.5">
                    <label className="relative block flex-1 min-w-0">
                        <input
                            inputMode="numeric"
                            value={data.budget > 0 ? miles(data.budget) : ''}
                            onChange={e => update('budget', Number(e.target.value.replace(/\D/g, '')) || 0)}
                            placeholder="Ej.: 1.500"
                            aria-label="Presupuesto en euros"
                            className={cn(CAMPO, 'pr-10 font-semibold placeholder:font-medium')}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-muted-foreground">€</span>
                    </label>
                    {/* Segmentado: precio cerrado o negociable (se guarda como etiqueta del bolo) */}
                    <div className="h-[52px] shrink-0 p-1 rounded-[14px] bg-fill flex" role="group" aria-label="¿Se puede negociar?">
                        {[{ v: false, t: 'Cerrado' }, { v: true, t: 'Negociable' }].map(o => (
                            <button
                                key={o.t}
                                type="button"
                                onClick={() => update('negotiable', o.v)}
                                aria-pressed={data.negotiable === o.v}
                                className={cn('pulsable h-full px-3 rounded-[10px] text-[14px] font-semibold', data.negotiable === o.v ? 'bg-foreground text-background' : 'text-muted-foreground')}
                            >
                                {o.t}
                            </button>
                        ))}
                    </div>
                </div>
            </Campo>

            <Campo
                etiqueta="Descripción"
                ayuda={largo < 10 ? `Cuenta un poco más (mínimo 10 caracteres${largo ? `, llevas ${largo}` : ''}).` : undefined}
            >
                <textarea
                    value={data.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="Cuánto dura, si hay equipo de sonido, el ambiente que buscas…"
                    rows={4}
                    className="w-full min-h-[120px] rounded-[14px] bg-fill px-4 py-3.5 text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
            </Campo>

            <MasDetalles detalles={data.detalles ?? {}} onChange={d => update('detalles', d)} fechaBolo={data.date} />

            <section className="pt-2">
                <h2 className="text-[18px] font-bold">Así lo verán los músicos</h2>
                <div className="mt-3">
                    <VistaPreviaBolo
                        titulo={data.title}
                        tipo={data.type}
                        fecha={data.date}
                        hora={data.startTime}
                        lugar={data.location}
                        precio={data.budget}
                        etiquetas={etiquetas}
                        imagen={data.image}
                    />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => inputFoto.current?.click()} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold inline-flex items-center gap-1.5">
                        <ImagePlus className="h-4 w-4" />
                        {data.image ? 'Cambiar la foto' : 'Poner una foto del sitio'}
                    </button>
                    {data.image
                        ? <button type="button" onClick={() => update('image', undefined)} className="pulsable h-9 px-3.5 rounded-full text-[14px] font-semibold text-muted-foreground">Quitar la foto</button>
                        : <span className="text-[13px] text-muted-foreground">Opcional. Sin foto, sale con su dibujo.</span>}
                </div>
                <input
                    ref={inputFoto}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { elegirFoto(e.target.files?.[0]); e.target.value = ''; }}
                />
            </section>
        </div>
    );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { tamanoPortada } from '../../lib/buscarCanciones';
import { useMuestra } from '../../hooks/useMuestra';

// «La Flaca» → «LF»; sin título, una nota
const iniciales = (titulo: string) =>
    titulo.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '♪';

// Tamaños: en las listas, en las filas del repertorio y junto al título al leerla
const TAMANOS = {
    lista: { px: 44, clase: 'h-11 w-11 text-[14px]', radio: 'rounded-[10px]' },
    fila: { px: 40, clase: 'h-10 w-10 text-[13px]', radio: 'rounded-[9px]' },
    cabecera: { px: 56, clase: 'h-14 w-14 text-[17px]', radio: 'rounded-[12px]' },
} as const;

// La carátula de la canción. Sin portada, o si no carga (sin cobertura), un cuadro con las
// iniciales del título
export function Portada({ src, titulo, tamano = 'lista', className }: {
    src?: string; titulo: string; tamano?: keyof typeof TAMANOS; className?: string;
}) {
    const [rota, setRota] = useState<string | null>(null);
    const { px, clase, radio } = TAMANOS[tamano];
    const caja = cn('shrink-0 overflow-hidden bg-fill-strong', clase, radio, className);
    if (!src || rota === src) {
        return (
            <span aria-hidden className={cn(caja, 'flex items-center justify-center font-semibold text-muted-foreground select-none')}>
                {iniciales(titulo)}
            </span>
        );
    }
    // A 3x para las pantallas del iPhone
    return (
        <img src={tamanoPortada(src, px * 3)} alt="" loading="lazy" decoding="async" draggable={false}
            width={px} height={px} onError={() => setRota(src)} className={cn(caja, 'block object-cover')} />
    );
}

// La portada que se toca para escuchar los 30 s de la grabación (como en Shazam). Una sola
// muestra suena a la vez en toda la app. Sin muestra, la portada sin más
export function PortadaMuestra({ src, titulo, muestra, tamano = 'lista', pararAlSalir }: {
    src?: string; titulo: string; muestra?: string; tamano?: keyof typeof TAMANOS; pararAlSalir?: boolean;
}) {
    const sonido = useMuestra(pararAlSalir);
    if (!muestra) return <Portada src={src} titulo={titulo} tamano={tamano} />;
    const esta = sonido.url === muestra;
    const pulsar = () => {
        sonido.alternar(muestra).catch(() => toast('No se puede escuchar ahora. ¿Hay cobertura?'));
    };
    const icono = tamano === 'cabecera' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    return (
        <button type="button" onClick={pulsar} aria-label={esta ? `Parar la muestra de ${titulo}` : `Escuchar 30 s de ${titulo}`} aria-pressed={esta}
            className={cn('pulsable relative shrink-0 ring-offset-2 ring-offset-background', TAMANOS[tamano].radio, esta && 'ring-2 ring-foreground')}>
            <Portada src={src} titulo={titulo} tamano={tamano} />
            {/* Sobre la foto: el único sitio donde va texto blanco */}
            <span className={cn('absolute inset-0 m-auto rounded-full bg-black/55 text-white backdrop-blur-[2px] flex items-center justify-center',
                tamano === 'cabecera' ? 'h-9 w-9' : 'h-7 w-7')}>
                {esta && sonido.cargando ? <Loader2 className={cn(icono, 'animate-spin')} />
                    : esta ? <Pause className={icono} fill="currentColor" />
                        : <Play className={cn(icono, 'translate-x-px')} fill="currentColor" />}
            </span>
        </button>
    );
}

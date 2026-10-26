import { useId, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Link2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MAX_TEXTO_PEGADO, normalizarEnlace, type FichaPropuesta, type PropuestaPerfil, type RespuestaLeerPerfil } from '../../lib/leerPerfil';
import { leerPerfilRemoto, type EntradaLeerPerfil } from '../../services/leerPerfilService';
import type { RedesArtista } from '../../types';

// «Rellénalo con tu web o tu Instagram»: un campo pequeño encima del formulario del perfil.
// Lee la página en el servidor, enseña una PROPUESTA campo a campo con su casilla («Usar») y
// «Poner en mi perfil» solo rellena el formulario: guarda la persona, como siempre.
// Acción secundaria de la pantalla: gris, nada de amarillo.

export type CampoPerfil = 'nombre' | 'ciudad' | 'bio' | 'generos' | 'ficha' | 'redes';

interface Props {
    /** Lo marcado, para meterlo en el formulario (sin guardar) */
    onAplicar: (p: PropuestaPerfil) => void;
    /** Los campos que admite el formulario de esta pantalla (por defecto, todos) */
    campos?: CampoPerfil[];
    /** Lo que ya tiene el formulario, para avisar de lo que se cambia */
    actual?: { nombre?: string; ciudad?: string; bio?: string };
    className?: string;
}

type Fase = 'inicio' | 'leyendo' | 'propuesta' | 'hecho';

const ETIQUETA_FICHA: Record<keyof FichaPropuesta, string> = {
    formacion: 'Formación', musicos: 'Músicos', duracion: 'Duración', repertorio: 'Repertorio',
    equipo: 'Equipo', viaja: 'Viaja', idiomas: 'Idiomas', idealPara: 'Ideal para',
};
const ETIQUETA_RED: Record<keyof RedesArtista, string> = {
    web: 'Web', instagram: 'Instagram', youtube: 'YouTube', spotify: 'Spotify',
    soundcloud: 'SoundCloud', bandcamp: 'Bandcamp', tiktok: 'TikTok', facebook: 'Facebook',
};

/** «https://www.instagram.com/rumbasur/» → «@rumbasur»; el resto, sin https ni www */
function enlaceCorto(red: keyof RedesArtista, url: string) {
    const m = url.match(/instagram\.com\/([^/]+)/);
    if (red === 'instagram' && m) return `@${m[1]}`;
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

interface Fila { clave: string; etiqueta: string; valor: ReactNode; ahora?: string }

const Pildoras = ({ xs }: { xs: string[] }) => (
    <span className="flex flex-wrap gap-1.5">
        {xs.map(x => <span key={x} className="h-7 px-2.5 rounded-full bg-fill text-[13px] font-semibold inline-flex items-center">{x}</span>)}
    </span>
);

function filasDe(p: PropuestaPerfil, campos: CampoPerfil[], actual: Props['actual'] = {}): Fila[] {
    const filas: Fila[] = [];
    const distinto = (a?: string, b?: string) => (a && b && a.trim() !== b.trim() ? a.trim() : undefined);
    if (campos.includes('nombre') && p.nombre) filas.push({ clave: 'nombre', etiqueta: 'Nombre', valor: p.nombre, ahora: distinto(actual.nombre, p.nombre) });
    if (campos.includes('ciudad') && p.ciudad) filas.push({ clave: 'ciudad', etiqueta: 'Ciudad', valor: p.ciudad, ahora: distinto(actual.ciudad, p.ciudad) });
    if (campos.includes('bio') && p.bio) {
        filas.push({ clave: 'bio', etiqueta: 'Bio', valor: <span className="block whitespace-pre-line">{p.bio}</span>, ahora: actual.bio?.trim() ? 'tu bio de ahora' : undefined });
    }
    if (campos.includes('generos') && p.generos?.length) filas.push({ clave: 'generos', etiqueta: 'Estilos', valor: <Pildoras xs={p.generos} /> });
    if (campos.includes('ficha') && p.ficha) {
        for (const k of Object.keys(ETIQUETA_FICHA) as (keyof FichaPropuesta)[]) {
            const v = p.ficha[k];
            if (v === undefined || (Array.isArray(v) && !v.length)) continue;
            filas.push({ clave: `ficha.${k}`, etiqueta: ETIQUETA_FICHA[k], valor: Array.isArray(v) ? <Pildoras xs={v} /> : String(v) });
        }
    }
    if (campos.includes('redes') && p.redes) {
        for (const k of Object.keys(ETIQUETA_RED) as (keyof RedesArtista)[]) {
            const v = p.redes[k];
            if (v) filas.push({ clave: `redes.${k}`, etiqueta: ETIQUETA_RED[k], valor: <span className="break-all">{enlaceCorto(k, v)}</span> });
        }
    }
    return filas;
}

/** Solo lo marcado */
function elegido(p: PropuestaPerfil, claves: Set<string>): PropuestaPerfil {
    const out: PropuestaPerfil = {};
    if (claves.has('nombre') && p.nombre) out.nombre = p.nombre;
    if (claves.has('ciudad') && p.ciudad) out.ciudad = p.ciudad;
    if (claves.has('bio') && p.bio) out.bio = p.bio;
    if (claves.has('generos') && p.generos) out.generos = p.generos;
    const ficha: FichaPropuesta = {};
    for (const k of Object.keys(p.ficha || {}) as (keyof FichaPropuesta)[]) {
        if (claves.has(`ficha.${k}`)) Object.assign(ficha, { [k]: p.ficha![k] });
    }
    if (Object.keys(ficha).length) out.ficha = ficha;
    const redes: RedesArtista = {};
    for (const k of Object.keys(p.redes || {}) as (keyof RedesArtista)[]) {
        if (claves.has(`redes.${k}`)) redes[k] = p.redes![k];
    }
    if (Object.keys(redes).length) out.redes = redes;
    return out;
}

export default function RellenarConWeb({ onAplicar, campos = ['nombre', 'ciudad', 'bio', 'generos', 'ficha', 'redes'], actual, className }: Props) {
    const id = useId();
    const [fase, setFase] = useState<Fase>('inicio');
    const [enlace, setEnlace] = useState('');
    const [texto, setTexto] = useState('');
    const [verTexto, setVerTexto] = useState(false);
    const [leyendo, setLeyendo] = useState<'web' | 'instagram' | 'texto'>('web');
    const [error, setError] = useState('');
    const [resp, setResp] = useState<RespuestaLeerPerfil | null>(null);
    const [marcados, setMarcados] = useState<Set<string>>(new Set());

    const filas = useMemo(() => (resp ? filasDe(resp.propuesta, campos, actual) : []), [resp, campos, actual]);

    const leer = async (entrada: EntradaLeerPerfil) => {
        const anterior = resp;
        setError('');
        const n = 'url' in entrada ? normalizarEnlace(entrada.url) : null;
        setLeyendo(!n ? 'texto' : 'instagram' in n && n.instagram ? 'instagram' : 'web');
        setFase('leyendo');
        const r = await leerPerfilRemoto(entrada);
        if (!r.ok) {
            setError(r.mensaje);
            if (r.pedirTexto) setVerTexto(true);
            setFase(anterior ? 'propuesta' : 'inicio');
            return;
        }
        // Al pegar la bio después de un Instagram que no se pudo leer, se queda su enlace (y su nombre)
        const propuesta: PropuestaPerfil = 'texto' in entrada && anterior
            ? { ...r.propuesta, nombre: r.propuesta.nombre || anterior.propuesta.nombre, redes: { ...anterior.propuesta.redes, ...r.propuesta.redes } }
            : r.propuesta;
        const nueva = { ...r, propuesta, ...('texto' in entrada ? { pedirTexto: false, aviso: undefined } : {}) };
        setResp(nueva);
        setMarcados(new Set(filasDe(propuesta, campos, actual).map(f => f.clave)));
        if (nueva.pedirTexto) setVerTexto(true);
        if ('texto' in entrada) { setVerTexto(false); setTexto(''); }
        setFase('propuesta');
    };

    const leerEnlace = () => {
        const n = normalizarEnlace(enlace);
        if ('error' in n) {
            setError(n.error === 'vacio' ? 'Pega el enlace de tu web o de tu Instagram.' : 'Ese enlace no parece una web. Revísalo o pega tu bio aquí.');
            if (n.error !== 'vacio') setVerTexto(true);
            return;
        }
        setResp(null);
        void leer({ url: enlace.trim() });
    };

    const aplicar = () => {
        if (!resp) return;
        onAplicar(elegido(resp.propuesta, marcados));
        setFase('hecho');
    };

    const reiniciar = () => { setFase('inicio'); setResp(null); setError(''); setVerTexto(false); setEnlace(''); setTexto(''); };

    const alternar = (clave: string) => setMarcados(m => { const n = new Set(m); if (n.has(clave)) n.delete(clave); else n.add(clave); return n; });

    const ocupado = fase === 'leyendo';
    const origen = resp?.fuente === 'texto' ? 'tu texto' : resp?.fuente === 'instagram' ? 'tu Instagram' : 'tu página';
    const cuadroTexto = verTexto && fase !== 'hecho' && (
        <div className="mt-3">
            <label htmlFor={`${id}-texto`} className="block text-[13px] font-semibold text-muted-foreground">Pega aquí tu bio o el texto de tu web</label>
            <textarea id={`${id}-texto`} value={texto} onChange={e => setTexto(e.target.value.slice(0, MAX_TEXTO_PEGADO))} rows={4} disabled={ocupado}
                placeholder="Ej. Somos una banda de rumba de Barcelona. Tocamos en bodas y fiestas…"
                className="mt-1.5 w-full rounded-2xl bg-fill px-4 py-3 text-[16px] leading-snug resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60" />
            <button type="button" onClick={() => void leer({ texto })} disabled={ocupado || texto.trim().length < 20}
                className="pulsable mt-2 h-9 px-4 rounded-full bg-fill-strong text-[15px] font-semibold disabled:opacity-40">
                Leer el texto
            </button>
        </div>
    );

    return (
        <section aria-labelledby={`${id}-titulo`} className={cn('rounded-2xl bg-card border border-hairline shadow-e1 p-4', className)}>
            <div className="flex items-start gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full bg-fill flex items-center justify-center text-muted-foreground"><Link2 className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0">
                    <h3 id={`${id}-titulo`} className="text-[15px] font-bold leading-tight text-foreground">¿Tienes web o Instagram?</h3>
                    <p className="text-[13px] text-muted-foreground leading-snug">Pega el enlace y lo rellenamos por ti</p>
                </div>
            </div>

            {fase !== 'hecho' && (
                <form className="mt-3 h-11 rounded-full bg-fill pl-4 pr-1 flex items-center gap-2 focus-within:ring-2 focus-within:ring-foreground/10"
                    onSubmit={e => { e.preventDefault(); leerEnlace(); }}>
                    <label htmlFor={`${id}-enlace`} className="sr-only">Enlace de tu web o de tu Instagram</label>
                    <input id={`${id}-enlace`} value={enlace} onChange={e => { setEnlace(e.target.value.slice(0, 2048)); setError(''); }} disabled={ocupado}
                        type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go"
                        placeholder="tuweb.com o @tuinstagram"
                        className="flex-1 min-w-0 bg-transparent text-[16px] placeholder:text-muted-foreground focus:outline-none disabled:opacity-60" />
                    <button type="submit" disabled={ocupado || !enlace.trim()}
                        className="pulsable shrink-0 h-9 min-w-[64px] px-4 rounded-full bg-fill-strong text-[15px] font-semibold flex items-center justify-center disabled:opacity-40">
                        {ocupado && leyendo !== 'texto' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Leer'}
                    </button>
                </form>
            )}

            <div aria-live="polite">
                {ocupado && (
                    <p className="mt-2 flex items-center gap-2 text-[14px] text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {leyendo === 'instagram' ? 'Leyendo tu Instagram…' : leyendo === 'texto' ? 'Leyendo tu texto…' : 'Leyendo tu web…'}
                    </p>
                )}
                {error && !ocupado && <p className="mt-2 text-[14px] text-destructive">{error}</p>}
                {resp?.aviso && fase === 'propuesta' && <p className="mt-2 text-[14px] font-semibold text-foreground">{resp.aviso}</p>}
            </div>

            {fase === 'inicio' && !verTexto && (
                <button type="button" onClick={() => setVerTexto(true)} className="mt-2 text-[13px] text-muted-foreground underline underline-offset-2 active:opacity-60">
                    O pega tu bio a mano
                </button>
            )}
            {cuadroTexto}

            <AnimatePresence initial={false}>
                {fase === 'propuesta' && resp && filas.length > 0 && (
                    <motion.div key="propuesta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4">
                        <h4 className="text-[15px] font-bold text-foreground">Esto hemos encontrado</h4>
                        <p className="text-[13px] text-muted-foreground leading-snug">
                            {resp.modo === 'ia' ? `Redactado con IA solo con lo que pone ${origen}: revísalo. ` : `Sacado tal cual de ${origen}. `}
                            Nada se guarda hasta que pulses Guardar.
                        </p>
                        <ul className="mt-2 divide-y divide-hairline">
                            {filas.map(f => {
                                const on = marcados.has(f.clave);
                                return (
                                    <li key={f.clave}>
                                        <label className="flex items-start gap-3 py-3 cursor-pointer">
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{f.etiqueta}</span>
                                                <span className={cn('mt-0.5 block text-[15px] leading-snug text-foreground', !on && 'opacity-50')}>{f.valor}</span>
                                                {f.ahora && on && <span className="mt-1 block text-[12px] text-muted-foreground">Sustituye a {f.ahora === 'tu bio de ahora' ? f.ahora : `«${f.ahora}»`}</span>}
                                            </span>
                                            <span className="shrink-0 flex items-center gap-1.5 pt-4">
                                                <span className="text-[13px] text-muted-foreground">Usar</span>
                                                <input type="checkbox" checked={on} onChange={() => alternar(f.clave)} className="sr-only peer" aria-label={`Usar ${f.etiqueta.toLowerCase()}`} />
                                                <span aria-hidden className={cn('h-6 w-6 rounded-full flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/30',
                                                    on ? 'bg-foreground text-background' : 'border border-hairline-strong')}>
                                                    {on && <Check className="h-4 w-4" strokeWidth={3} />}
                                                </span>
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="mt-2 flex items-center gap-2">
                            <button type="button" onClick={aplicar} disabled={!marcados.size}
                                className="pulsable h-9 px-4 rounded-full bg-foreground text-background text-[15px] font-semibold disabled:opacity-40">
                                Poner en mi perfil
                            </button>
                            <button type="button" onClick={reiniciar} className="h-9 px-3 rounded-full text-[15px] text-muted-foreground active:opacity-60">Descartar</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {fase === 'hecho' && (
                <div className="mt-3 flex items-start gap-2 text-[14px]" aria-live="polite">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                    <p className="text-foreground leading-snug">
                        Listo: lo hemos puesto en el formulario. Revísalo y guarda cuando quieras.{' '}
                        <button type="button" onClick={reiniciar} className="text-muted-foreground underline underline-offset-2 active:opacity-60">Leer otro enlace</button>
                    </p>
                </div>
            )}
        </section>
    );
}

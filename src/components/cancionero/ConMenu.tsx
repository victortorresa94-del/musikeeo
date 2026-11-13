import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { leerCancion, lineasDeLetra } from '../../lib/acordes';
import { cancionesDeLista } from '../../lib/listas';
import { tonoMostrado } from '../../lib/biblioteca';
import { tonoDe } from './utilidades';
import { ICONO } from './estilo';
import { EditorLista, MenuListas } from './Listas';
import { ImportarCanciones } from './ImportarCanciones';
import { CompletarLetras } from './CompletarLetras';
import type { Lista } from '../../types/cancionero';

// Las tres vistas grandes del Cancionero (13-nov, Víctor: «canciones, repertorios y bolos»)
export type VistaCancionero = 'canciones' | 'repertorios' | 'bolos' | 'tareas';

// Una pantalla que en el ordenador ocupa el hueco del contenido, con los menús a la vista
// (13-nov, «Añadir canciones»: a pantalla completa tapaba también el menú de la app). Se pinta
// en `hueco` con un portal y, mientras está, la página de debajo se esconde (sin desmontarse)
interface HuecoDelMenu { hueco: HTMLElement | null; tapar: (si: boolean) => void }
const HuecoCtx = createContext<HuecoDelMenu | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useHuecoDelMenu = () => useContext(HuecoCtx);

// En el ordenador (≥ 1024 px), el menú del Cancionero a la izquierda en todas sus páginas, como
// en un gestor de música. En el móvil no se ve: allí cada página trae su manera de volver
export function ConMenu({ children, activo, onLista, onVer, onOpcionesLista, className }: {
    children: ReactNode;
    activo?: { ver: VistaCancionero; lista?: string } | null;
    onLista?: (id: string) => void;                  // en la página de Canciones cambia la lista sin navegar
    onVer?: (v: VistaCancionero) => void;
    onOpcionesLista?: (l: Lista) => void;
    className?: string;
}) {
    const navigate = useNavigate();
    const { canciones, listas, listo, tareas } = useCancionero();
    const porHacer = tareas.filter(t => !t.hecha).length;
    const [importar, setImportar] = useState(false);
    const [completar, setCompletar] = useState(false);
    const [nueva, setNueva] = useState(false);
    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoMostrado(c, tonoDe(c))])), [canciones]);
    const faltanLetra = useMemo(() => canciones.filter(c => lineasDeLetra(leerCancion(c.texto)) < 8).length, [canciones]);
    const cuantas = (id: string) => cancionesDeLista(id, canciones, listas, c => tonos.get(c.id) ?? null).length;
    const irLista = onLista ?? ((id: string) => navigate(id === 'todas' ? '/cancionero' : `/cancionero?lista=${encodeURIComponent(id)}`));
    const irVer = onVer ?? ((v: VistaCancionero) => navigate(v === 'canciones' ? '/cancionero' : `/cancionero?ver=${v}`));

    // El hueco: al taparse, la pantalla nueva empieza arriba; al cerrarla, la página vuelve
    // donde estaba
    const [hueco, setHueco] = useState<HTMLDivElement | null>(null);
    const [tapado, setTapado] = useState(false);
    const scrollAntes = useRef<number | null>(null);
    const tapar = useCallback((si: boolean) => {
        if (si && scrollAntes.current === null) scrollAntes.current = window.scrollY;
        setTapado(si);
    }, []);
    useLayoutEffect(() => {
        if (tapado) window.scrollTo(0, 0);
        else if (scrollAntes.current !== null) { window.scrollTo(0, scrollAntes.current); scrollAntes.current = null; }
    }, [tapado]);
    const ctx = useMemo(() => ({ hueco, tapar }), [hueco, tapar]);

    return (
        <HuecoCtx.Provider value={ctx}>
        <div className="lg:flex lg:items-start lg:gap-8 lg:max-w-[1360px] lg:mx-auto lg:px-6">
            {listo && (
                <aside aria-label="Menú del cancionero" className="hidden lg:block w-[240px] shrink-0 sticky top-20 pt-6 pb-10 max-h-[calc(100vh-5rem)] overflow-y-auto hide-scrollbar">
                    {/* Las tres vistas grandes */}
                    <nav className="space-y-0.5" aria-label="Vistas">
                        {([
                            [ICONO.canciones, 'Canciones', () => irLista('todas'), activo?.ver === 'canciones' && (activo.lista ?? 'todas') === 'todas'],
                            [ICONO.repertorios, 'Repertorios', () => irVer('repertorios'), activo?.ver === 'repertorios'],
                            [ICONO.bolos, 'Bolos', () => irVer('bolos'), activo?.ver === 'bolos'],
                            [ICONO.tareas, 'Tareas', () => irVer('tareas'), activo?.ver === 'tareas'],
                        ] as const).map(([icono, t, f, on]) => (
                            <button key={t} onClick={f} aria-current={on ? 'page' : undefined}
                                className={cn('w-full h-11 px-2 rounded-xl flex items-center gap-2.5 text-left text-[16px] font-bold text-foreground', on ? 'bg-fill-strong' : 'hover:bg-fill')}>
                                <img src={icono} alt="" className="h-8 w-8 object-contain" /> <span className="flex-1">{t}</span>
                                {t === 'Tareas' && porHacer > 0 && <span className="text-[13px] font-semibold text-muted-foreground">{porHacer}</span>}
                            </button>
                        ))}
                    </nav>
                    {/* Herramientas: aparte de las vistas */}
                    <p className="mt-5 mb-1 px-2 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Herramientas</p>
                    <nav className="space-y-0.5" aria-label="Herramientas">
                        {([
                            [ICONO.importar, 'Importar', () => setImportar(true)],
                            [ICONO.escuchar, 'Sacar de un audio', () => navigate('/cancionero/escuchar')],
                        ] as const).map(([icono, t, f]) => (
                            <button key={t} onClick={f} className="w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] font-semibold text-foreground hover:bg-fill">
                                <img src={icono} alt="" className="h-7 w-7 object-contain" /> {t}
                            </button>
                        ))}
                        <button onClick={() => setCompletar(true)} className="w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] font-semibold text-foreground hover:bg-fill">
                            <span className="h-7 w-7 flex items-center justify-center"><FileText className="h-[18px] w-[18px]" /></span>
                            <span className="flex-1">Completar letras</span>{faltanLetra > 0 && <span className="text-[13px] text-muted-foreground">{faltanLetra}</span>}
                        </button>
                    </nav>
                    <p className="mt-5 mb-1 px-2 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Listas</p>
                    <MenuListas actual={activo?.ver === 'canciones' ? activo.lista ?? 'todas' : ''} onElegir={irLista} canciones={canciones} listas={listas}
                        cuantas={cuantas} compacto onNueva={() => setNueva(true)}
                        onOpciones={l => (onOpcionesLista ? onOpcionesLista(l) : irLista(l.id))} />
                </aside>
            )}
            <div className={cn('lg:flex-1 lg:min-w-0', tapado && 'md:hidden', className)}>{children}</div>
            {/* En el móvil nunca se tapa: allí esas pantallas van a pantalla completa */}
            <div ref={setHueco} className={tapado ? 'hidden md:block lg:flex-1 lg:min-w-0' : 'hidden'} />
            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} />
            <CompletarLetras abierta={completar} onCerrar={() => setCompletar(false)} />
            <EditorLista abierta={nueva} onCerrar={() => setNueva(false)} onCreada={l => irLista(l.id)} />
        </div>
        </HuecoCtx.Provider>
    );
}

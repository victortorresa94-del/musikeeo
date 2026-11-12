import { useMemo, useState, type ReactNode } from 'react';
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

// En el ordenador (≥ 1024 px), el menú del Cancionero a la izquierda en todas sus páginas, como
// en un gestor de música. En el móvil no se ve: allí cada página trae su manera de volver
export function ConMenu({ children, activo, onLista, onVer, onOpcionesLista, className }: {
    children: ReactNode;
    activo?: { ver: 'canciones' | 'repertorios'; lista?: string } | null;
    onLista?: (id: string) => void;                  // en la página de Canciones cambia la lista sin navegar
    onVer?: (v: 'canciones' | 'repertorios') => void;
    onOpcionesLista?: (l: Lista) => void;
    className?: string;
}) {
    const navigate = useNavigate();
    const { canciones, listas, listo } = useCancionero();
    const [importar, setImportar] = useState(false);
    const [completar, setCompletar] = useState(false);
    const [nueva, setNueva] = useState(false);
    const tonos = useMemo(() => new Map(canciones.map(c => [c.id, tonoMostrado(c, tonoDe(c))])), [canciones]);
    const faltanLetra = useMemo(() => canciones.filter(c => lineasDeLetra(leerCancion(c.texto)) < 8).length, [canciones]);
    const cuantas = (id: string) => cancionesDeLista(id, canciones, listas, c => tonos.get(c.id) ?? null).length;
    const irLista = onLista ?? ((id: string) => navigate(id === 'todas' ? '/cancionero' : `/cancionero?lista=${encodeURIComponent(id)}`));
    const irVer = onVer ?? ((v: 'canciones' | 'repertorios') => navigate(v === 'repertorios' ? '/cancionero?ver=repertorios' : '/cancionero'));

    return (
        <div className="lg:flex lg:items-start lg:gap-8 lg:max-w-[1360px] lg:mx-auto lg:px-6">
            {listo && (
                <aside aria-label="Menú del cancionero" className="hidden lg:block w-[240px] shrink-0 sticky top-20 pt-6 pb-10 max-h-[calc(100vh-5rem)] overflow-y-auto hide-scrollbar">
                    <nav className="space-y-0.5">
                        {([
                            [ICONO.canciones, 'Canciones', () => irLista('todas'), activo?.ver === 'canciones' && (activo.lista ?? 'todas') === 'todas'],
                            [ICONO.repertorios, 'Repertorios', () => irVer('repertorios'), activo?.ver === 'repertorios'],
                            [ICONO.importar, 'Importar', () => setImportar(true), false],
                            [ICONO.escuchar, 'Sacar de un audio', () => navigate('/cancionero/escuchar'), false],
                        ] as const).map(([icono, t, f, on]) => (
                            <button key={t} onClick={f} aria-current={on ? 'page' : undefined}
                                className={cn('w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] font-semibold text-foreground', on ? 'bg-fill-strong' : 'hover:bg-fill')}>
                                <img src={icono} alt="" className="h-7 w-7 object-contain" /> {t}
                            </button>
                        ))}
                        {faltanLetra > 0 && (
                            <button onClick={() => setCompletar(true)} className="w-full h-10 px-2 rounded-xl flex items-center gap-2.5 text-left text-[15px] font-semibold text-foreground hover:bg-fill">
                                <span className="h-7 w-7 flex items-center justify-center"><FileText className="h-[18px] w-[18px]" /></span>
                                <span className="flex-1">Completar letras</span><span className="text-[13px] text-muted-foreground">{faltanLetra}</span>
                            </button>
                        )}
                    </nav>
                    <p className="mt-5 mb-1 px-2 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Listas</p>
                    <MenuListas actual={activo?.ver === 'canciones' ? activo.lista ?? 'todas' : ''} onElegir={irLista} canciones={canciones} listas={listas}
                        cuantas={cuantas} compacto onNueva={() => setNueva(true)}
                        onOpciones={l => (onOpcionesLista ? onOpcionesLista(l) : irLista(l.id))} />
                </aside>
            )}
            <div className={cn('lg:flex-1 lg:min-w-0', className)}>{children}</div>
            <ImportarCanciones abierto={importar} onCerrar={() => setImportar(false)} />
            <CompletarLetras abierta={completar} onCerrar={() => setCompletar(false)} />
            <EditorLista abierta={nueva} onCerrar={() => setNueva(false)} onCreada={l => irLista(l.id)} />
        </div>
    );
}

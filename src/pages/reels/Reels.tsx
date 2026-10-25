import { useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReelsViewer from './ReelsViewer';
import { type Reel } from '../../types/reels';
import { cargarReels, claveDeReel, objetivoDeReel, rasgosDeReel } from '../../services/reelsReales';
import { interaccionService } from '../../services/interaccionService';
import { gustosService } from '../../services/gustosService';
import type { Senal } from '../../lib/recomendador';
import { useAuth } from '../../context/AuthContext';
import { OBJETO_3D } from '../../config/objetos3d';
import { HojaComentarios, type DestinoComentarios } from '../../components/feed/HojaComentarios';

// /reels y /reels/:id: los vídeos reales (publicaciones de vídeo y clips de artista).
// El visor va en un portal: el contenedor de las páginas lleva transform y descolocaría el fixed.

export default function Reels() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [reels, setReels] = useState<Reel[] | null>(null);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());   // ids de reel
    const [comentarios, setComentarios] = useState<DestinoComentarios | null>(null);

    // Los vídeos con sus contadores de verdad
    useEffect(() => {
        let vivo = true;
        cargarReels().then(async r => {
            const cuentas = await interaccionService.contadores(r.map(claveDeReel)).catch(() => new Map());
            if (!vivo) return;
            setReels(r.map(x => {
                const c = cuentas.get(claveDeReel(x));
                return c ? { ...x, likes: c.likes, comments: c.comentarios } : x;
            }));
        }).catch(() => { if (vivo) setReels([]); });
        return () => { vivo = false; };
    }, []);

    const claves = (reels || []).map(claveDeReel);
    useEffect(() => {
        if (!user || claves.length === 0) return;
        void gustosService.usar(user.uid);
        interaccionService.misMeGusta(user.uid, claves).then(mios => {
            setLikedIds(new Set((reels || []).filter(r => mios.has(claveDeReel(r))).map(r => r.id)));
        }).catch(() => {});
    }, [user, claves.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    const mover = (id: string, campo: 'likes' | 'comments', delta: number) =>
        setReels(prev => prev && prev.map(r => r.id === id ? { ...r, [campo]: Math.max(0, r[campo] + delta) } : r));
    const senal = (r: Reel, s: Senal) => gustosService.registrar(rasgosDeReel(r), s);

    const volver = () => {
        const from = (location.state as { from?: string } | null)?.from;
        if (from) navigate(from);
        else if (location.key !== 'default') navigate(-1);
        else navigate('/feed');
    };

    const toggleLike = async (reel: Reel, liked: boolean) => {
        const aqui = location.pathname;
        if (!user) { navigate('/login', { state: { from: aqui } }); return; }
        const apply = (on: boolean) => {
            setLikedIds(prev => { const n = new Set(prev); if (on) n.add(reel.id); else n.delete(reel.id); return n; });
            mover(reel.id, 'likes', on ? 1 : -1);
        };
        apply(liked);
        senal(reel, liked ? 'me_gusta' : 'quitar_me_gusta');
        try { await interaccionService.setMeGusta(objetivoDeReel(reel), user.uid, liked); }
        catch { apply(!liked); toast.error('No se pudo guardar el me gusta'); }
    };

    const reelDe = (d: DestinoComentarios) => (reels || []).find(r => claveDeReel(r) === `${d.objetivo.tipo}_${d.objetivo.refId}`);
    const alComentar = (d: DestinoComentarios) => { const r = reelDe(d); if (r) { mover(r.id, 'comments', 1); senal(r, 'comentar'); } };
    const alBorrar = (d: DestinoComentarios) => { const r = reelDe(d); if (r) mover(r.id, 'comments', -1); };
    const cerrarComentarios = useCallback(() => setComentarios(null), []);

    if (reels === null) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center" aria-busy="true" aria-label="Cargando vídeos">
                <span className="h-8 w-8 rounded-full border-[3px] border-fill-strong border-t-foreground animate-spin" />
            </div>
        );
    }

    if (reels.length === 0) {
        // Vacío honesto: todavía no hay vídeos
        return (
            <div className="max-w-xl mx-auto px-4 pt-10 pb-28">
                <section className="rounded-[22px] bg-card border border-hairline shadow-e1 px-6 pt-4 pb-7 text-center">
                    <img src={OBJETO_3D.microfono} alt="" loading="lazy" className="mx-auto h-[120px] w-[90px] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.16)]" />
                    <h1 className="mt-3 text-[20px] font-bold text-foreground">Aún no hay vídeos</h1>
                    <p className="mt-1 mx-auto max-w-xs text-[15px] text-muted-foreground">
                        Cuando los artistas suban sus vídeos, los verás aquí.
                    </p>
                    <button onClick={volver} className="mt-5 mx-auto h-[52px] px-8 rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold flex items-center justify-center">
                        Volver
                    </button>
                </section>
            </div>
        );
    }

    const desde = id ? reels.findIndex(r => r.id === id) : -1;

    return (
        <>
            {createPortal(
                <AnimatePresence>
                    <ReelsViewer
                        key="reels"
                        reels={reels}
                        initialIndex={desde >= 0 ? desde : 0}
                        onClose={volver}
                        likedIds={likedIds}
                        onLike={toggleLike}
                        onComentar={r => setComentarios({ objetivo: objetivoDeReel(r), titulo: r.authorName })}
                        onSenal={senal}
                    />
                </AnimatePresence>,
                document.body
            )}
            <HojaComentarios destino={comentarios} onCerrar={cerrarComentarios} onComentado={alComentar} onBorrado={alBorrar} />
        </>
    );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, X, Loader2, Film } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { POST_LIMITS, isVideoFile, postService, videoPoster } from '../../services/postService';
import type { Post } from '../../types';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Hoja inferior para publicar una foto o un vídeo en el Feed
export function NewPostSheet({ open, onClose, onPosted }: { open: boolean; onClose: () => void; onPosted: (p: Post) => void }) {
    const { user, userProfile } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState('');
    const [caption, setCaption] = useState('');
    const [progress, setProgress] = useState<number | null>(null);
    const [error, setError] = useState('');

    const reset = () => { setFile(null); setPreview(''); setCaption(''); setProgress(null); setError(''); };

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const pick = async (f: File | undefined) => {
        setError('');
        if (!f) return;
        const video = isVideoFile(f);
        if (!(video ? VIDEO_TYPES : IMAGE_TYPES).includes(f.type)) {
            setError(video ? 'Sube el vídeo en MP4 o MOV.' : 'Sube la foto en JPG, PNG o WebP.');
            return;
        }
        const maxMB = video ? POST_LIMITS.videoMB : POST_LIMITS.imageMB;
        if (f.size > maxMB * 1024 * 1024) {
            setError(`Máximo ${maxMB} MB. Este pesa ${Math.round(f.size / 1024 / 1024)} MB.`);
            return;
        }
        if (video) {
            const { duration } = await videoPoster(f);
            if (duration > POST_LIMITS.videoSeconds + 1) {
                setError(`El vídeo puede durar ${POST_LIMITS.videoSeconds} segundos como mucho. Recórtalo y vuelve a probar.`);
                return;
            }
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const publish = async () => {
        if (!file || !user) return;
        setError(''); setProgress(0);
        try {
            const post = await postService.create({
                file, caption,
                author: {
                    uid: user.uid,
                    name: userProfile?.displayName || user.displayName || 'Usuario de Musikeeo',
                    photo: userProfile?.photoURL || user.photoURL || undefined,
                    role: userProfile?.primaryMode,
                },
                onProgress: p => setProgress(p),
            });
            toast.success('Publicado en el Feed');
            onPosted(post);
            reset();
            onClose();
        } catch (e) {
            console.error('No se pudo publicar', e);
            setProgress(null);
            setError('No se ha podido publicar. Revisa la conexión e inténtalo otra vez.');
        }
    };

    const busy = progress !== null;
    const video = file ? isVideoFile(file) : false;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/60" onClick={() => !busy && onClose()} />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label="Nueva publicación"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-md max-h-[92dvh] overflow-y-auto bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline pb-[calc(1rem+env(safe-area-inset-bottom))]"
                    >
                        <div className="sticky top-0 z-10 bg-sheet px-4 pt-2 pb-3">
                            <div className="mx-auto h-1 w-9 rounded-full bg-white/20 md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <button onClick={() => !busy && onClose()} className="text-[15px] text-muted-foreground active:opacity-60" disabled={busy}>Cancelar</button>
                                <p className="font-semibold text-[16px]">Nueva publicación</p>
                                <span className="w-[62px]" />
                            </div>
                        </div>

                        <div className="px-4">
                            {!file ? (
                                <button onClick={() => inputRef.current?.click()} className="w-full aspect-[4/5] rounded-2xl border border-dashed border-hairline-strong bg-fill flex flex-col items-center justify-center gap-3 text-muted-foreground active:opacity-70">
                                    <span className="h-14 w-14 rounded-full bg-fill flex items-center justify-center"><ImagePlus className="h-6 w-6 text-foreground" /></span>
                                    <span className="text-[15px] font-semibold text-foreground">Elige una foto o un vídeo</span>
                                    <span className="text-[13px] px-8 text-center">Vídeo de hasta {POST_LIMITS.videoSeconds} s y {POST_LIMITS.videoMB} MB. Foto de hasta {POST_LIMITS.imageMB} MB.</span>
                                </button>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden bg-black">
                                    {video
                                        ? <video src={preview} className="w-full max-h-[52dvh] object-contain" controls playsInline muted />
                                        : <img src={preview} alt="" className="w-full max-h-[52dvh] object-contain" />}
                                    {!busy && (
                                        <button onClick={reset} aria-label="Quitar" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <input
                                ref={inputRef} type="file" className="hidden"
                                accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')}
                                onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }}
                            />

                            <textarea
                                value={caption}
                                onChange={e => setCaption(e.target.value.slice(0, POST_LIMITS.caption))}
                                placeholder={video ? 'Cuenta qué tocas, dónde y si buscas bolos…' : 'Escribe un pie de foto…'}
                                rows={3}
                                disabled={busy}
                                className="mt-3 w-full resize-none rounded-2xl bg-fill border border-hairline px-4 py-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hairline-strong"
                            />
                            <p className="mt-1 text-right text-[12px] text-muted-foreground">{caption.length}/{POST_LIMITS.caption}</p>

                            {error && <p className="mt-2 text-[14px] text-red-400">{error}</p>}

                            {busy && (
                                <div className="mt-3">
                                    <div className="h-1.5 rounded-full bg-fill-strong overflow-hidden">
                                        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${Math.round((progress || 0) * 100)}%` }} />
                                    </div>
                                    <p className="mt-1.5 text-[13px] text-muted-foreground flex items-center gap-1.5">
                                        {video ? <Film className="h-3.5 w-3.5" /> : null} Subiendo… {Math.round((progress || 0) * 100)} %
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={publish}
                                disabled={!file || busy}
                                className="mt-4 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40 active:opacity-80"
                            >
                                {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Publicando</> : 'Publicar'}
                            </button>
                            <p className="mt-3 text-[12px] text-muted-foreground text-center">
                                Publica solo lo que sea tuyo o tengas permiso para compartir. Lo que incumpla las normas se retira.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

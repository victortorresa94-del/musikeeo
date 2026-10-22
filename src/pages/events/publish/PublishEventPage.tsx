import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import PasoNecesidad from './steps/PasoNecesidad';
import PasoCuandoDonde from './steps/PasoCuandoDonde';
import PasoDetalles from './steps/PasoDetalles';
import { eventService } from '../../../services/eventService';
import { storageService } from '../../../services/storageService';
import { useAuth } from '../../../context/AuthContext';
import type { Event } from '../../../types';
import { cn } from '../../../lib/utils';
import { ETIQUETA_NEGOCIABLE, TODAS_NECESIDADES, necesidadDesdeBorrador, tipoDesdeBorrador } from './opciones';

// Helper to convert base64 to file
const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) throw new Error("Invalid image format");
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export type PublishEventState = {
    // Paso 2
    title: string;
    type: string;
    date: string;
    startTime: string;
    location: string;
    lat?: number;
    lng?: number;

    // Paso 1 (la necesidad) y paso 3
    artistType: string[];
    budget: number;
    currency: 'MXN' | 'EUR' | 'USD';
    negotiable: boolean;
    description: string;
    image?: string; // data: URL hasta que se publica

    // Metadata
    step: number;
};

export type ActualizaCampo = <K extends keyof PublishEventState>(field: K, value: PublishEventState[K]) => void;

const INITIAL_STATE: PublishEventState = {
    title: '',
    type: '',
    date: '',
    startTime: '',
    location: '',
    artistType: [],
    budget: 0,
    currency: 'EUR',
    negotiable: false,
    description: '',
    step: 1
};

const CLAVE_BORRADOR = 'musikeeo_event_draft';
type Paso = 1 | 2 | 3;

const TITULOS: Record<Paso, [string, string]> = {
    1: ['¿Qué necesitas?', 'Elige uno. Lo demás te lo preguntamos en un minuto.'],
    2: ['¿Cuándo y dónde?', 'Con el día y la ciudad, cada músico sabe si puede ir.'],
    3: ['Ponle nombre y precio', 'Y mira cómo quedará antes de publicarlo.'],
};

/** Las etiquetas que se guardan: la necesidad, lo que trajera Rodrigo y «Negociable» si toca */
const etiquetasDe = (d: PublishEventState) =>
    Array.from(new Set([...d.artistType, ...(d.negotiable ? [ETIQUETA_NEGOCIABLE] : [])]));

/** «a», «a y b», «a, b y c» */
const enumera = (xs: string[]) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;

export default function PublishEventPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isPublishing, setIsPublishing] = useState(false);

    // Si llega un borrador de Rodrigo («Editar»), el formulario se abre ya relleno
    const rodrigoDraft = (useLocation().state as { eventDraft?: { title?: string; date?: string; time?: string; location?: string; description?: string; type?: string; genres?: string[]; budget?: string } } | null)?.eventDraft;
    const [formData, setFormData] = useState<PublishEventState>(() => {
        if (rodrigoDraft) {
            const d = rodrigoDraft;
            const iso = d.date && /^\d{4}-\d{2}-\d{2}/.test(d.date) ? d.date.slice(0, 10) : '';
            const genres = d.genres || [];
            // La tesela del paso 1 sale ya marcada si el borrador dice qué se busca
            const necesidad = necesidadDesdeBorrador(genres, `${d.title || ''} ${d.description || ''}`);
            return {
                ...INITIAL_STATE,
                title: d.title || '',
                type: tipoDesdeBorrador(d.type),
                date: iso,
                startTime: d.time && /^\d{1,2}:\d{2}/.test(d.time) ? d.time.padStart(5, '0').slice(0, 5) : '',
                location: d.location || '',
                description: d.description || '',
                artistType: necesidad && !genres.includes(necesidad) ? [necesidad, ...genres] : genres,
                budget: Number(String(d.budget || '').replace(/[^\d]/g, '')) || 0,
            };
        }
        try {
            const saved = localStorage.getItem(CLAVE_BORRADOR);
            return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
        } catch { return INITIAL_STATE; }
    });

    useEffect(() => {
        // Una foto grande puede no caber en localStorage: entonces se guarda el resto
        try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(formData)); }
        catch {
            try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ ...formData, image: undefined })); } catch { /* sin almacenamiento */ }
        }
    }, [formData]);

    const updateField: ActualizaCampo = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const paso = (Math.min(3, Math.max(1, Number(formData.step) || 1))) as Paso;
    const necesidad = formData.artistType.find(t => TODAS_NECESIDADES.includes(t));
    const etiquetas = etiquetasDe(formData);

    // La validación de siempre, repartida por pasos
    const faltan: Record<Paso, string[]> = {
        1: necesidad ? [] : ['qué necesitas'],
        2: [
            !formData.type && 'el tipo de evento',
            !formData.date && 'la fecha',
            !formData.location.trim() && 'dónde es',
        ].filter((x): x is string => !!x),
        3: [
            !formData.title.trim() && 'el título',
            !(formData.budget > 0) && 'el presupuesto',
            formData.description.trim().length < 10 && 'la descripción',
        ].filter((x): x is string => !!x),
    };

    const irA = (p: Paso) => {
        updateField('step', p);
        window.scrollTo({ top: 0 });
    };

    // Elegir una necesidad sustituye a la anterior, pero deja las otras etiquetas (los estilos de Rodrigo)
    const elegirNecesidad = (etiqueta: string) => {
        setFormData(prev => ({
            ...prev,
            artistType: [etiqueta, ...prev.artistType.filter(t => !TODAS_NECESIDADES.includes(t))],
            // La música de ceremonia casi siempre es para una boda: se propone, y se cambia en el paso 2
            type: !prev.type && etiqueta === 'Música para ceremonia' ? 'Boda / Social' : prev.type,
        }));
    };

    // La «X»: vuelve a donde estaba (o a Bolos si se entró directo). El borrador queda guardado
    const salir = () => {
        if (((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0) navigate(-1);
        else navigate('/eventos');
    };

    const handlePublish = async () => {
        if (!user) {
            toast.error("Entra en tu cuenta para publicar");
            return;
        }
        const pendiente = ([1, 2, 3] as Paso[]).find(p => faltan[p].length > 0);
        if (pendiente) { irA(pendiente); return; }

        setIsPublishing(true);

        try {
            let finalImage = formData.image;

            // 1. Upload Image if it's base64 (starts with data:)
            if (formData.image?.startsWith('data:')) {
                try {
                    const file = dataURLtoFile(formData.image, `event-cover-${Date.now()}.jpg`);
                    const path = `events/${user.uid}/${file.name}`;
                    finalImage = await storageService.uploadFile(file, path);
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    toast.error("No se pudo subir la foto: el bolo saldrá con su dibujo.");
                    finalImage = undefined;
                }
            }

            // 2. Create Event Object. Sin foto no se guarda imageUrl: la lista pinta su objeto 3D
            await eventService.createEvent({
                title: formData.title.trim(),
                description: formData.description.trim(),
                date: formData.date ? `${formData.date}T${formData.startTime || '12:00'}` : new Date().toISOString(),
                location: formData.location.trim(),
                type: formData.type as Event['type'],
                price: formData.budget,
                ...(finalImage ? { imageUrl: finalImage } : {}),
                organizerId: user.uid,
                organizerName: user.displayName || 'Organizador',
                tags: etiquetas,
            });

            toast.success("Tu bolo ya está publicado");

            // Clear draft
            localStorage.removeItem(CLAVE_BORRADOR);

            navigate('/eventos');
        } catch (error) {
            console.error("Failed to publish:", error);
            toast.error("No se pudo publicar el bolo. Inténtalo de nuevo.");
        } finally {
            setIsPublishing(false);
        }
    };

    const [titulo, bajada] = TITULOS[paso];
    const aviso = paso > 1 && faltan[paso].length > 0 ? `Falta ${enumera(faltan[paso])}.` : '';

    return (
        <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
            <div className="w-full max-w-[560px] mx-auto px-4 flex-1 flex flex-col">
                {/* Cabecera: salir y el progreso en tres tramos */}
                <header className="sticky top-0 z-20 bg-background pt-[calc(10px+env(safe-area-inset-top))] pb-2">
                    <div className="relative h-12 flex items-center">
                        <button
                            type="button"
                            onClick={salir}
                            aria-label="Salir sin publicar"
                            className="pulsable relative z-10 h-11 w-11 rounded-full bg-card border border-hairline shadow-e1 flex items-center justify-center"
                        >
                            <X className="h-5 w-5" strokeWidth={2.25} />
                        </button>
                        <div className="absolute inset-x-0 flex flex-col items-center" aria-label={`Paso ${paso} de 3`}>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(n => (
                                    <span key={n} className="h-1.5 w-[58px] sm:w-[76px] rounded-full bg-fill-strong overflow-hidden">
                                        <motion.span
                                            className="block h-full w-full bg-foreground origin-left"
                                            initial={false}
                                            animate={{ scaleX: n <= paso ? 1 : 0 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                        />
                                    </span>
                                ))}
                            </div>
                            <span className="mt-1.5 text-[13px] text-muted-foreground">{paso} de 3</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 pb-6">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={paso}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.22 }}
                        >
                            <h1 className="mt-4 font-heading text-[28px] font-bold leading-[1.1] tracking-tight text-center">{titulo}</h1>
                            <p className="mt-2 text-[15px] text-muted-foreground text-center text-balance">{bajada}</p>

                            {paso === 1 && <PasoNecesidad elegida={necesidad} onElegir={elegirNecesidad} />}
                            {paso === 2 && <PasoCuandoDonde data={formData} update={updateField} />}
                            {paso === 3 && <PasoDetalles data={formData} update={updateField} necesidad={necesidad} etiquetas={etiquetas} />}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Abajo, siempre a mano: la acción del paso */}
                <footer className="sticky bottom-0 z-20 bg-background pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
                    {aviso && <p className="mb-2.5 text-center text-[13px] text-muted-foreground">{aviso}</p>}
                    <div className="flex gap-2.5">
                        {paso > 1 && (
                            <button
                                type="button"
                                onClick={() => irA((paso - 1) as Paso)}
                                aria-label="Paso anterior"
                                className="pulsable h-[52px] w-[52px] shrink-0 rounded-[14px] bg-fill flex items-center justify-center"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={paso < 3 ? () => irA((paso + 1) as Paso) : handlePublish}
                            disabled={faltan[paso].length > 0 || isPublishing}
                            className={cn(
                                'pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[17px] font-bold',
                                'flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                            )}
                        >
                            {paso < 3 ? 'Siguiente' : isPublishing ? <><Loader2 className="h-5 w-5 animate-spin" /> Publicando…</> : 'Publicar'}
                        </button>
                    </div>
                    {paso === 1 && (
                        <Link to="/rodrigo" className="mt-4 block text-center text-[15px] text-muted-foreground underline underline-offset-4 decoration-hairline-strong">
                            O cuéntaselo a Rodrigo
                        </Link>
                    )}
                </footer>
            </div>
        </div>
    );
}

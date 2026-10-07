import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, ShoppingBag, CalendarDays, UserRound, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { EventDraft, ListingDraft, ProfileDraft } from '../../lib/rodrigoEngine';
import { publishEventDraft, publishListingDraft, publishProfileDraft } from '../../services/rodrigoActions';

type Draft =
    | { kind: 'listing'; data: ListingDraft }
    | { kind: 'event'; data: EventDraft }
    | { kind: 'profile'; data: ProfileDraft };

const TYPE_LABEL: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', prestamo: 'Préstamo' };

const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
        <div className="flex gap-3 py-1.5 text-[13px]">
            <span className="w-20 shrink-0 text-white/50">{label}</span>
            <span className="text-white/90 min-w-0 break-words">{value}</span>
        </div>
    ) : null;

/**
 * Borrador que Rodrigo prepara en el chat. Nada se publica sin que el usuario
 * pulse «Publicar»; si no tiene sesión, se le manda a entrar y vuelve aquí.
 */
export const RodrigoDraftCard = ({ draft, onPublished }: { draft: Draft; onPublished?: (msg: string) => void }) => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [state, setState] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
    const [link, setLink] = useState<string>('');

    const meta = {
        listing: { Icon: ShoppingBag, title: 'Anuncio para el mercado', cta: 'Publicar anuncio' },
        event: { Icon: CalendarDays, title: 'Bolo para el tablón', cta: 'Publicar bolo' },
        profile: { Icon: UserRound, title: 'Tu perfil de artista', cta: 'Crear perfil' },
    }[draft.kind];

    const publish = async () => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname + location.search } });
            return;
        }
        setState('publishing');
        try {
            if (draft.kind === 'listing') {
                const id = await publishListingDraft(user, userProfile, draft.data);
                setLink(`/market/${id}`);
                onPublished?.('Anuncio publicado en el mercado.');
            } else if (draft.kind === 'event') {
                const id = await publishEventDraft(user, userProfile, draft.data);
                setLink(`/eventos/${id}`);
                onPublished?.('Bolo publicado en el tablón.');
            } else {
                const slug = await publishProfileDraft(user, draft.data);
                setLink(`/artist/${slug}`);
                onPublished?.('Perfil creado y visible en Explorar.');
            }
            setState('done');
        } catch (e) {
            console.error('Rodrigo no pudo publicar:', e);
            setState('error');
        }
    };

    const d = draft.data as any;
    return (
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white"><meta.Icon className="h-4 w-4" /></span>
                <p className="text-sm font-semibold text-white">{meta.title}</p>
                <span className="ml-auto text-[11px] font-medium text-white/50">Borrador</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
                {draft.kind === 'listing' && (<>
                    <Row label="Título" value={d.titulo} />
                    <Row label="Tipo" value={TYPE_LABEL[d.tipo] || d.tipo} />
                    <Row label="Precio" value={d.tipo === 'prestamo' ? 'Gratis' : `${d.precio}€${d.tipo === 'alquiler' ? `/${d.unidad === 'semana' ? 'semana' : 'día'}` : ''}`} />
                    <Row label="Estado" value={d.estado?.replace('_', ' ')} />
                    <Row label="Ciudad" value={d.ciudad} />
                    <Row label="Detalle" value={d.descripcion} />
                </>)}
                {draft.kind === 'event' && (<>
                    <Row label="Título" value={d.title} />
                    <Row label="Fecha" value={[d.date, d.time].filter(Boolean).join(' · ')} />
                    <Row label="Lugar" value={d.location} />
                    <Row label="Estilo" value={d.genres?.join(', ')} />
                    <Row label="Caché" value={d.budget ? `${d.budget}€` : ''} />
                    <Row label="Detalle" value={d.description} />
                </>)}
                {draft.kind === 'profile' && (<>
                    <Row label="Nombre" value={d.nombre} />
                    <Row label="Formato" value={d.formato} />
                    <Row label="Estilos" value={d.generos?.join(', ')} />
                    <Row label="Ciudad" value={d.ciudad} />
                    <Row label="Desde" value={d.precioDesde ? `${d.precioDesde}€` : ''} />
                    <Row label="Bio" value={d.bio} />
                </>)}
            </div>

            {state === 'done' ? (
                <div className="mt-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center"><Check className="h-4 w-4" strokeWidth={3} /></span>
                    <span className="text-sm text-white">Publicado</span>
                    <Link to={link} className="ml-auto text-sm font-semibold text-primary">Ver</Link>
                </div>
            ) : (
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={publish}
                        disabled={state === 'publishing'}
                        className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {state === 'publishing' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {user ? meta.cta : 'Entra para publicar'}
                    </button>
                    {draft.kind === 'event' && (
                        <button
                            onClick={() => navigate('/eventos/crear', { state: { eventDraft: draft.data } })}
                            aria-label="Editar en el formulario"
                            className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
            {state === 'error' && <p className="mt-2 text-xs text-red-400">No se ha podido publicar. Inténtalo de nuevo en un momento.</p>}
            {draft.kind === 'listing' && state === 'done' && (
                <p className="mt-2 text-xs text-white/50">Añade fotos desde el anuncio para que se venda antes.</p>
            )}
        </div>
    );
};

export const draftsFrom = (p?: { publishEvent?: EventDraft; listingDraft?: ListingDraft; profileDraft?: ProfileDraft }): Draft[] => {
    if (!p) return [];
    const out: Draft[] = [];
    if (p.listingDraft) out.push({ kind: 'listing', data: p.listingDraft });
    if (p.publishEvent) out.push({ kind: 'event', data: p.publishEvent });
    if (p.profileDraft) out.push({ kind: 'profile', data: p.profileDraft });
    return out;
};

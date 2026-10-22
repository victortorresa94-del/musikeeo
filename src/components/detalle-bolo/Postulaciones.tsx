import { Check, Loader2, MessageCircle, X } from 'lucide-react';
import type { ApplicationWithApplicant } from '../../services/applicationService';

const MODO: Record<string, string> = {
    musician: 'Músico o banda',
    organizer: 'Organiza bolos',
    provider: 'Técnico de sonido',
};

interface Props {
    applications: ApplicationWithApplicant[];
    loading: boolean;
    onContact: (applicantId: string) => void;
    onUpdateStatus: (appId: string, status: 'accepted' | 'rejected') => void;
}

// Las postulaciones de un bolo: solo las ve quien lo ha publicado
export function Postulaciones({ applications, loading, onContact, onUpdateStatus }: Props) {
    return (
        <section id="postulaciones" className="mt-8 scroll-mt-20">
            <h2 className="text-[19px] font-bold text-foreground">
                Postulaciones
                {applications.length > 0 && <span className="ml-1.5 text-muted-foreground font-medium">{applications.length}</span>}
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : applications.length === 0 ? (
                <p className="mt-1.5 text-[15px] text-muted-foreground">
                    Aún no se ha postulado nadie. Cuando alguien lo haga, aparecerá aquí.
                </p>
            ) : (
                <ul className="mt-3 space-y-2.5">
                    {applications.map(app => {
                        const nombre = app.applicant?.displayName || 'Usuario de Musikeeo';
                        return (
                            <li key={app.id} className="rounded-[18px] bg-card border border-hairline shadow-e1 p-3">
                                <div className="flex items-center gap-3">
                                    <span className="h-11 w-11 shrink-0 rounded-full overflow-hidden bg-fill-strong flex items-center justify-center text-[16px] font-bold text-foreground">
                                        {app.applicant?.photoURL
                                            ? <img src={app.applicant.photoURL} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            : nombre.slice(0, 1).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-foreground truncate">{nombre}</p>
                                        {app.applicant?.primaryMode && (
                                            <p className="text-[13px] text-muted-foreground truncate">
                                                {MODO[app.applicant.primaryMode] || app.applicant.primaryMode}
                                            </p>
                                        )}
                                    </div>
                                    {app.status !== 'pending' && (
                                        <span className={app.status === 'accepted'
                                            ? 'shrink-0 h-7 px-3 rounded-full bg-fill-strong text-foreground text-[13px] font-semibold flex items-center'
                                            : 'shrink-0 h-7 px-3 rounded-full bg-destructive/10 text-destructive text-[13px] font-semibold flex items-center'}>
                                            {app.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                                        </span>
                                    )}
                                </div>

                                {app.message && (
                                    <p className="mt-2 text-[14px] leading-snug text-foreground/80 line-clamp-3">{app.message}</p>
                                )}

                                {app.status === 'pending' && (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => app.applicantId && onContact(app.applicantId)}
                                            className="pulsable h-9 px-2 rounded-full bg-fill text-foreground text-[14px] font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <MessageCircle className="h-4 w-4" /> Escribir
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => app.id && onUpdateStatus(app.id, 'accepted')}
                                            className="pulsable h-9 px-2 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <Check className="h-4 w-4" /> Aceptar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => app.id && onUpdateStatus(app.id, 'rejected')}
                                            className="pulsable h-9 px-2 rounded-full bg-destructive/10 text-destructive text-[14px] font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <X className="h-4 w-4" /> Rechazar
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

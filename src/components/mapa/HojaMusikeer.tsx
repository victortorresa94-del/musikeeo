import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, MessageCircle, Music2, Sparkles, Store, Ticket, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NOMBRE_PAPEL, horaCorta, type Papel, type PuntoMapa } from '../../lib/mapa';
import { ESTILO_PAPEL } from './estilo';
import { Burbuja } from './Burbuja';
import { Hoja } from './Hoja';

const ICONO_ETIQUETAS: Record<Papel, typeof Music2> = { musico: Music2, tecnico: Wrench, sala: Ticket, tienda: Store, otro: Sparkles };

// El micro perfil al tocar un punto del mapa: quién es, dos o tres datos, su zona (nunca la
// dirección) y «Escribir», que abre el chat de siempre. Con varios en el mismo sitio, la lista.
export function HojaMusikeer({ personas, uidPropio, onCerrar, onElegir, onGestionarMio }: {
    personas: PuntoMapa[];
    uidPropio?: string;
    onCerrar: () => void;
    onElegir: (uid: string) => void;
    onGestionarMio: () => void;
}) {
    const una = personas.length === 1 ? personas[0] : null;
    return (
        <Hoja abierta={personas.length > 0} onCerrar={onCerrar}
            etiqueta={una ? `Perfil de ${una.nombre}` : 'Musikeers en esta zona'}
            titulo={una ? undefined : `${personas.length.toLocaleString('es-ES')} musikeers en esta zona`}>
            {una ? <MicroPerfil p={una} esMio={una.uid === uidPropio} onGestionarMio={onGestionarMio} /> : (
                <ul className="-mx-1 divide-y divide-hairline">
                    {personas.map(p => (
                        <li key={p.uid}>
                            <button onClick={() => onElegir(p.uid)} className="pulsable w-full flex items-center gap-3 px-1 py-2.5 text-left">
                                <Burbuja p={p} tamano="sm" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-bold truncate">{p.nombre}</span>
                                    <span className="block text-[13px] text-muted-foreground truncate">
                                        {[NOMBRE_PAPEL[p.papel], p.ahora ? 'Ahora mismo aquí' : p.zona].filter(Boolean).join(' · ')}
                                    </span>
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Hoja>
    );
}

function MicroPerfil({ p, esMio, onGestionarMio }: { p: PuntoMapa; esMio: boolean; onGestionarMio: () => void }) {
    const e = ESTILO_PAPEL[p.papel];
    const Icono = ICONO_ETIQUETAS[p.papel];
    return (
        <div data-testid="micro-perfil">
            <div className="flex items-center gap-3.5">
                <Burbuja key={p.foto} p={p} tamano="lg" />
                <div className="min-w-0 flex-1">
                    <p className="text-[20px] font-bold leading-tight line-clamp-2 break-words">{p.nombre}</p>
                    <span className={cn('mt-1.5 inline-flex h-6 px-2.5 rounded-full items-center text-[12px] font-bold', e.fondo, e.tinta)}>
                        {esMio ? `Tú · ${NOMBRE_PAPEL[p.papel]}` : NOMBRE_PAPEL[p.papel]}
                    </span>
                </div>
            </div>

            {p.ahora && p.caduca && (
                <p className="mt-3.5 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-pastel-menta text-pastel-menta-ink text-[13px] font-bold">
                    <span className="h-2 w-2 rounded-full bg-pastel-menta-ink" /> Ahora mismo aquí · hasta las {horaCorta(p.caduca)}
                </p>
            )}

            <ul className="mt-4 space-y-2.5 text-[15px]">
                {p.etiquetas.length > 0 && (
                    <li className="flex items-start gap-3">
                        <Icono className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                        <span>{p.etiquetas.join(' · ')}</span>
                    </li>
                )}
                <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                    <span>{p.zona || 'Por esta zona'} <span className="text-muted-foreground">· zona aproximada</span></span>
                </li>
            </ul>

            <div className="mt-5 flex gap-2">
                {esMio ? (
                    <button onClick={onGestionarMio} className="pulsable flex-1 h-[52px] rounded-[14px] bg-fill-strong text-foreground text-[16px] font-semibold">
                        Cambiar cómo salgo
                    </button>
                ) : (
                    <Link to={`/messages?userId=${encodeURIComponent(p.uid)}`}
                        className="pulsable flex-1 h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold flex items-center justify-center gap-2">
                        <MessageCircle className="h-5 w-5" /> Escribir
                    </Link>
                )}
                <Link to={`/profile/${encodeURIComponent(p.uid)}`}
                    className="pulsable h-[52px] px-5 rounded-[14px] bg-fill-strong text-foreground text-[16px] font-semibold flex items-center justify-center">
                    Ver perfil
                </Link>
            </div>
        </div>
    );
}

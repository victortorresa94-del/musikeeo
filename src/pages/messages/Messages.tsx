import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ArrowUp, MessageCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { chatService, type ChatPreview } from '../../services/chatService';
import { userService } from '../../services/userService';
import { type ChatMessage } from '../../types';

interface Person { displayName: string; photoURL?: string }

const FALLBACK_NAME = 'Usuario de Musikeeo';

const timeOf = (ts: number) => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

// «14:05» hoy, «Ayer», «lun», o «12/09» en la lista de chats
const shortWhen = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
    if (days <= 0) return timeOf(ts);
    if (days === 1) return 'Ayer';
    if (days < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' });
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

const dayLabel = (ts: number) => {
    const d = new Date(ts);
    const days = Math.floor((new Date(new Date().toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const Avatar = ({ person, size = 'h-11 w-11' }: { person?: Person; size?: string }) => {
    const [broken, setBroken] = useState(false);
    const name = person?.displayName || FALLBACK_NAME;
    return (
        <span className={cn(size, 'rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center text-[13px] font-bold text-foreground')}>
            {person?.photoURL && !broken
                ? <img src={person.photoURL} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
                : name.slice(0, 1).toUpperCase()}
        </span>
    );
};

// Hoja del chat abierto. Se usa en línea en escritorio y a pantalla completa en el móvil.
const ChatPane = ({
    person, otherId, messages, myId, text, setText, onSend, onBack, error,
}: {
    person?: Person;
    otherId?: string;
    messages: ChatMessage[];
    myId: string;
    text: string;
    setText: (v: string) => void;
    onSend: () => void;
    onBack?: () => void;
    error: string;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-background">
            <div className="h-14 shrink-0 px-2 md:px-4 flex items-center gap-2 border-b border-white/[0.06]">
                {onBack && (
                    <button onClick={onBack} aria-label="Volver a mensajes" className="h-10 w-10 -ml-1 flex items-center justify-center text-foreground active:opacity-60">
                        <ChevronLeft className="h-7 w-7" strokeWidth={2} />
                    </button>
                )}
                <Link to={otherId ? `/profile/${otherId}` : '#'} className="flex items-center gap-2.5 min-w-0 active:opacity-70">
                    <Avatar person={person} size="h-9 w-9" />
                    <span className="font-semibold text-[16px] text-foreground truncate">{person?.displayName || FALLBACK_NAME}</span>
                </Link>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 md:px-6 py-4">
                {messages.length === 0 && (
                    <p className="text-center text-[13px] text-muted-foreground mt-10 px-8">
                        Escribe el primer mensaje. Cuéntale qué necesitas, la fecha y el sitio.
                    </p>
                )}
                {messages.map((msg, i) => {
                    const mine = msg.senderId === myId;
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                    const lastOfGroup = !next || next.senderId !== msg.senderId || next.timestamp - msg.timestamp > 5 * 60000;
                    return (
                        <div key={msg.id}>
                            {newDay && (
                                <p className="text-center text-[12px] font-medium text-muted-foreground my-3 first-letter:uppercase">{dayLabel(msg.timestamp)}</p>
                            )}
                            <div className={cn('flex', mine ? 'justify-end' : 'justify-start', lastOfGroup ? 'mb-2.5' : 'mb-0.5')}>
                                <div className={cn(
                                    'max-w-[78%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words rounded-[20px]',
                                    mine ? 'bg-foreground text-background' : 'bg-white/[0.09] text-foreground',
                                    lastOfGroup && (mine ? 'rounded-br-md' : 'rounded-bl-md'),
                                )}>
                                    {msg.text}
                                    {lastOfGroup && (
                                        <span className={cn('block text-[10.5px] mt-0.5 text-right', mine ? 'text-background/55' : 'text-muted-foreground')}>
                                            {timeOf(msg.timestamp)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && <p className="px-4 pb-1 text-[12px] text-red-400">{error}</p>}
            <form
                onSubmit={(e) => { e.preventDefault(); onSend(); }}
                className="shrink-0 flex items-end gap-2 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-3 border-t border-white/[0.06]"
            >
                <textarea
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); }
                    }}
                    placeholder="Mensaje"
                    aria-label="Escribe un mensaje"
                    className="flex-1 resize-none max-h-32 min-h-[40px] rounded-[20px] bg-white/[0.07] border border-white/[0.08] px-4 py-2 text-[16px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    aria-label="Enviar"
                    className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 active:opacity-70 transition-opacity"
                >
                    <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
            </form>
        </div>
    );
};

export default function Messages() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const selectedId = params.get('chat') || (location.state as { selectedChatId?: string } | null)?.selectedChatId || null;

    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [people, setPeople] = useState<Record<string, Person>>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const requested = useRef(new Set<string>());

    // «Contactar» desde mercado, bolos o perfiles llega como /messages?userId=X:
    // crea (o reutiliza) el chat y lo abre.
    const targetUser = params.get('userId');
    useEffect(() => {
        if (!user || !targetUser) return;
        if (targetUser === user.uid) { navigate('/messages', { replace: true }); return; }
        chatService.createChat(user.uid, targetUser)
            .then(chatId => navigate(`/messages?chat=${chatId}`, { replace: true }))
            .catch(err => {
                console.error('No se pudo abrir el chat:', err);
                setError('No se pudo abrir la conversación. Inténtalo de nuevo.');
                navigate('/messages', { replace: true });
            });
    }, [user, targetUser, navigate]);

    // Las pantallas antiguas mandan el chat en location.state: lo pasamos a la URL
    // para que «atrás» funcione y se pueda recargar.
    useEffect(() => {
        const fromState = (location.state as { selectedChatId?: string } | null)?.selectedChatId;
        if (fromState && !params.get('chat')) navigate(`/messages?chat=${fromState}`, { replace: true });
    }, [location.state, params, navigate]);

    useEffect(() => {
        if (!user) return;
        return chatService.subscribeToChats(user.uid, (list) => {
            setChats(list);
            setLoaded(true);
        });
    }, [user]);

    const selected = useMemo<ChatPreview | null>(() => {
        if (!selectedId) return null;
        const found = chats.find(c => c.id === selectedId);
        if (found) return found;
        // Recién creado: aún no ha llegado en la lista. Los ids son «uidA_uidB».
        const participants = selectedId.split('_');
        return participants.length === 2 ? { id: selectedId, participants, updatedAt: Date.now() } : null;
    }, [chats, selectedId]);

    const otherOf = (chat: ChatPreview) => chat.participants.find(p => p !== user?.uid);

    // Nombre y foto del otro: una lectura por persona, cacheada
    useEffect(() => {
        const ids = [...chats, ...(selected ? [selected] : [])].map(otherOf).filter((id): id is string => !!id);
        ids.forEach(uid => {
            if (requested.current.has(uid)) return;
            requested.current.add(uid);
            userService.getPublicProfile(uid)
                .then(p => setPeople(prev => ({
                    ...prev,
                    [uid]: { displayName: p?.displayName || FALLBACK_NAME, photoURL: p?.photoURL || undefined },
                })))
                .catch(() => setPeople(prev => ({ ...prev, [uid]: { displayName: FALLBACK_NAME } })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, selected?.id, user]);

    useEffect(() => {
        setMessages([]);
        setError('');
        if (!selected?.id) return;
        return chatService.subscribeToMessages(selected.id, setMessages);
    }, [selected?.id]);

    // Móvil: el chat ocupa toda la pantalla. Bloquea el scroll de detrás y sigue
    // al teclado de iOS con visualViewport.
    const mobileOpen = !!selected;
    useEffect(() => {
        if (!mobileOpen || window.matchMedia('(min-width: 768px)').matches) return;
        const root = document.documentElement;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const vv = window.visualViewport;
        const sync = () => {
            if (!vv) return;
            root.style.setProperty('--vv-h', `${vv.height}px`);
            root.style.setProperty('--vv-top', `${vv.offsetTop}px`);
        };
        sync();
        vv?.addEventListener('resize', sync);
        vv?.addEventListener('scroll', sync);
        return () => {
            document.body.style.overflow = prev;
            vv?.removeEventListener('resize', sync);
            vv?.removeEventListener('scroll', sync);
            root.style.removeProperty('--vv-h');
            root.style.removeProperty('--vv-top');
        };
    }, [mobileOpen]);

    const text = selected ? drafts[selected.id] || '' : '';
    const setText = (v: string) => selected && setDrafts(d => ({ ...d, [selected.id]: v }));

    const handleSend = async () => {
        const body = text.trim();
        if (!body || !selected || !user) return;
        setText('');
        setError('');
        try {
            await chatService.sendMessage(selected.id, body, user.uid);
        } catch (err) {
            console.error('Error enviando mensaje', err);
            setText(body);
            setError('No se ha enviado. Revisa la conexión e inténtalo otra vez.');
        }
    };

    // Desde la lista se apila (atrás vuelve a la lista); si se llegó por «Contactar»
    // o con el enlace directo, volver reemplaza por la lista.
    const openChat = (id: string) => navigate(`/messages?chat=${id}`, { replace: !!selectedId, state: { fromList: true } });
    const closeChat = () => {
        if ((location.state as { fromList?: boolean } | null)?.fromList) navigate(-1);
        else navigate('/messages', { replace: true });
    };

    const q = query.trim().toLowerCase();
    const visible = q
        ? chats.filter(c => {
            const other = otherOf(c);
            const name = (other && people[other]?.displayName) || '';
            return name.toLowerCase().includes(q) || (c.lastMessage?.text || '').toLowerCase().includes(q);
        })
        : chats;

    const selectedOther = selected ? otherOf(selected) : undefined;
    const pane = selected && user && (
        <ChatPane
            person={selectedOther ? people[selectedOther] : undefined}
            otherId={selectedOther}
            messages={messages}
            myId={user.uid}
            text={text}
            setText={setText}
            onSend={handleSend}
            error={error}
        />
    );

    return (
        <div className="flex md:h-[calc(100dvh-3.5rem-1.5rem)] md:border-b md:border-white/[0.06]">
            {/* Lista */}
            <section className="w-full md:w-[340px] md:border-r md:border-white/[0.06] flex flex-col min-h-0">
                <div className="px-4 pt-3 pb-2">
                    <h1 className="font-heading font-bold text-[34px] leading-tight text-foreground">Mensajes</h1>
                    <label className="relative mt-3 block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar"
                            aria-label="Buscar conversaciones"
                            className="w-full h-9 rounded-[10px] bg-white/[0.07] pl-9 pr-9 text-[16px] md:text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </label>
                </div>

                <div className="flex-1 md:overflow-y-auto">
                    {!loaded && [0, 1, 2].map(i => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <span className="h-11 w-11 rounded-full bg-white/[0.07] animate-pulse" />
                            <span className="flex-1 space-y-2">
                                <span className="block h-3 w-1/2 rounded bg-white/[0.07] animate-pulse" />
                                <span className="block h-3 w-3/4 rounded bg-white/[0.05] animate-pulse" />
                            </span>
                        </div>
                    ))}

                    {loaded && chats.length === 0 && (
                        <div className="px-8 py-16 text-center">
                            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" strokeWidth={1.5} />
                            <p className="mt-3 font-semibold text-foreground">Aún no tienes conversaciones</p>
                            <p className="mt-1 text-[14px] text-muted-foreground">Escribe a un artista, a un técnico o a quien vende algo en el Mercado.</p>
                            <div className="mt-5 flex justify-center gap-2">
                                <Link to="/discover" className="h-9 px-4 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center">Explorar</Link>
                                <Link to="/market" className="h-9 px-4 rounded-full bg-white/[0.08] text-foreground text-[14px] font-semibold flex items-center">Mercado</Link>
                            </div>
                        </div>
                    )}

                    {loaded && chats.length > 0 && visible.length === 0 && (
                        <p className="px-4 py-10 text-center text-[14px] text-muted-foreground">Nada con «{query}».</p>
                    )}

                    {visible.map(chat => {
                        const other = otherOf(chat);
                        const person = other ? people[other] : undefined;
                        const unread = chat.lastMessage && chat.lastMessage.senderId !== user?.uid && chat.id !== selectedId;
                        return (
                            <button
                                key={chat.id}
                                onClick={() => openChat(chat.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-white/[0.06]',
                                    chat.id === selectedId ? 'md:bg-white/[0.07]' : 'md:hover:bg-white/[0.04]',
                                )}
                            >
                                <Avatar person={person} />
                                <span className="flex-1 min-w-0 border-b border-white/[0.06] pb-2.5 pt-0.5">
                                    <span className="flex items-baseline justify-between gap-2">
                                        <span className="font-semibold text-[15px] text-foreground truncate">{person?.displayName || ' '}</span>
                                        <span className="text-[12px] text-muted-foreground shrink-0">{shortWhen(chat.lastMessage?.timestamp || chat.updatedAt)}</span>
                                    </span>
                                    <span className={cn('block text-[14px] truncate', unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                                        {chat.lastMessage
                                            ? `${chat.lastMessage.senderId === user?.uid ? 'Tú: ' : ''}${chat.lastMessage.text}`
                                            : 'Conversación nueva'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Escritorio: el chat a la derecha */}
            <section className="hidden md:flex flex-1 min-w-0 flex-col">
                {pane || (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageCircle className="h-10 w-10" strokeWidth={1.5} />
                        <p className="mt-3 text-[15px]">Elige una conversación</p>
                    </div>
                )}
            </section>

            {/* Móvil: el chat a pantalla completa, por encima de la barra de pestañas */}
            {selected && user && createPortal(
                <div className="md:hidden fixed inset-x-0 top-[var(--vv-top,0px)] h-[var(--vv-h,100dvh)] z-[70] bg-background pt-[env(safe-area-inset-top)] flex flex-col">
                    <ChatPane
                        person={selectedOther ? people[selectedOther] : undefined}
                        otherId={selectedOther}
                        messages={messages}
                        myId={user.uid}
                        text={text}
                        setText={setText}
                        onSend={handleSend}
                        onBack={closeChat}
                        error={error}
                    />
                </div>,
                document.body,
            )}
        </div>
    );
}

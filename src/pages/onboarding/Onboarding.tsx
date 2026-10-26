import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ChevronLeft, Loader2, MapPin } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { createArtist } from '../../services/artistService';
import { createProvider } from '../../services/providerService';
import { createOrganizer } from '../../services/organizerService';
import RellenarConWeb from '../../components/perfil/RellenarConWeb';
import type { PropuestaPerfil } from '../../lib/leerPerfil';
import type { UserMode } from '../../types';

// La primera vez (sueño 1 + 4, skill equipo-activacion-y-onboarding): eliges quién eres,
// dejas tu perfil en 30 segundos viendo cómo te verán, y vas directo a lo primero útil.

type Rol = 'musico' | 'tecnico' | 'sala' | 'tienda' | 'cliente';

const ROLES: { id: Rol; titulo: string; bajada: string; modo: UserMode; destino: string; queHaces: string[]; nombre: string }[] = [
    { id: 'musico', titulo: 'Músico o banda', bajada: 'Consigue bolos', modo: 'musician', destino: '/eventos',
      queHaces: ['Banda', 'Cantante', 'Guitarra', 'DJ', 'Violín', 'Flamenco', 'Orquesta'], nombre: 'Nombre artístico o de la banda' },
    { id: 'tecnico', titulo: 'Técnico de sonido o luces', bajada: 'Trabaja en bolos y eventos', modo: 'provider', destino: '/eventos',
      queHaces: ['Sonido', 'Luces', 'Backline', 'Alquiler de PA', 'Grabación'], nombre: 'Tu nombre o el de tu empresa' },
    { id: 'sala', titulo: 'Sala, bar o promotor', bajada: 'Encuentra artistas', modo: 'organizer', destino: '/publicar',
      queHaces: ['Sala de conciertos', 'Bar con música', 'Promotor', 'Festival', 'Bodas y eventos'], nombre: 'Nombre de la sala o promotora' },
    { id: 'tienda', titulo: 'Tienda o alquiler de equipo', bajada: 'Vende y alquila', modo: 'provider', destino: '/market/create',
      queHaces: ['Guitarras', 'Teclados', 'Batería', 'Sonido', 'Alquiler'], nombre: 'Nombre de la tienda' },
    { id: 'cliente', titulo: 'Solo vengo a contratar', bajada: 'Para una boda, una fiesta o tu empresa', modo: 'organizer', destino: '/explorar',
      queHaces: ['Boda', 'Fiesta privada', 'Evento de empresa', 'Mi local'], nombre: 'Tu nombre' },
];

const CIUDADES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Girona'];

export const Onboarding = () => {
    const navigate = useNavigate();
    // Si llegó desde una acción (contactar, publicar…), al acabar vuelve a ella
    const from = (useLocation().state as { from?: string } | null)?.from;
    const { user, userProfile, refreshProfile } = useAuth();
    const [paso, setPaso] = useState<1 | 2>(1);
    const [rol, setRol] = useState<Rol | null>(null);
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [que, setQue] = useState<string[]>([]);
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoUrl, setFotoUrl] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const inputFoto = useRef<HTMLInputElement>(null);
    // Lo que el músico ha aceptado de su web o su Instagram (se guarda al entrar, con lo demás)
    const [deLaWeb, setDeLaWeb] = useState<Pick<PropuestaPerfil, 'bio' | 'generos' | 'ficha' | 'redes'> | null>(null);

    const r = ROLES.find(x => x.id === rol);

    const aplicarWeb = (p: PropuestaPerfil) => {
        if (p.nombre) setNombre(p.nombre.slice(0, 80));
        if (p.ciudad) setCiudad(p.ciudad.slice(0, 60));
        const resto = { bio: p.bio, generos: p.generos, ficha: p.ficha, redes: p.redes };
        setDeLaWeb(Object.values(resto).some(Boolean) ? resto : null);
    };
    const queDeLaWeb = deLaWeb ? [
        deLaWeb.bio && 'tu bio',
        deLaWeb.generos?.length && `${deLaWeb.generos.length === 1 ? 'un estilo' : `${deLaWeb.generos.length} estilos`}`,
        deLaWeb.ficha && Object.keys(deLaWeb.ficha).length && 'tu ficha',
        deLaWeb.redes && Object.keys(deLaWeb.redes).length && `${Object.keys(deLaWeb.redes).length === 1 ? 'un enlace' : `${Object.keys(deLaWeb.redes).length} enlaces`}`,
    ].filter(Boolean).join(', ') : '';

    useEffect(() => {
        if (user?.displayName && !nombre) setNombre(user.displayName);
        if (user?.photoURL && !fotoUrl) setFotoUrl(user.photoURL);
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // Quien ya lo completó no vuelve a verlo
    useEffect(() => {
        if (userProfile?.onboardingCompleted && !guardando) navigate(from && from !== '/onboarding' ? from : '/feed', { replace: true });
    }, [userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => () => { if (fotoUrl.startsWith('blob:')) URL.revokeObjectURL(fotoUrl); }, [fotoUrl]);

    const elegirFoto = (f?: File) => {
        if (!f) return;
        if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) { setError('La foto, en JPG, PNG o WebP y de menos de 5 MB.'); return; }
        setError(''); setFoto(f); setFotoUrl(URL.createObjectURL(f));
    };

    const terminar = async (completo: boolean, forzado?: Rol) => {
        const r = ROLES.find(x => x.id === (forzado || rol));
        if (!user || !r) return;
        setGuardando(true); setError('');
        const name = (completo ? nombre : '').trim() || user.displayName || 'Usuario de Musikeeo';
        const city = completo ? ciudad.trim() : '';
        try {
            let photoURL = user.photoURL || '';
            if (completo && foto) photoURL = await storageService.uploadFile(foto, `users/${user.uid}/perfil_${Date.now()}.${foto.type.split('/')[1]}`);

            await userService.createUserProfile(user.uid, { email: user.email || '', displayName: name, photoURL });
            await userService.activateMode(user.uid, r.modo, true);
            await userService.updateProfile(user.uid, {
                displayName: name, ...(photoURL ? { photoURL } : {}), ...(city ? { location: city } : {}),
                ...(que.length ? { skills: que } : {}), onboardingCompleted: true,
            });

            // Que aparezca ya en Explorar: es el primer valor para quien ofrece algo
            if (completo) {
                try {
                    if (r.id === 'musico') {
                        await createArtist(user.uid, {
                            artistName: name, city, profilePhoto: photoURL || undefined, tags: que.map(q => q.toLowerCase()),
                            genres: deLaWeb?.generos || [],
                            ...(deLaWeb?.bio ? { bio: deLaWeb.bio } : {}),
                            ...(deLaWeb?.ficha ? { ficha: deLaWeb.ficha } : {}),
                            ...(deLaWeb?.redes ? { redes: deLaWeb.redes } : {}),
                        });
                        await updateDoc(doc(db, 'artists', `artist_${user.uid}`), { isPublic: true, updatedAt: new Date().toISOString() });
                    } else if (r.id === 'tecnico' || r.id === 'tienda') {
                        await createProvider(user.uid, {
                            businessName: name, providerType: r.id === 'tienda' ? 'empresa' : 'freelance',
                            services: r.id === 'tienda' ? ['Tienda', ...que] : que, coverageAreas: city ? [city] : [],
                            ...(photoURL ? { photoURL } : {}), ...(city ? { city } : {}),
                        } as never);
                    } else if (r.id === 'sala') {
                        await createOrganizer(user.uid, { displayName: name, companyName: name });
                    }
                } catch (e) { console.warn('No se pudo crear la ficha pública todavía', e); }
            }
            await refreshProfile();
            navigate(from && from !== '/onboarding' ? from : r.destino, { replace: true });
        } catch (e) {
            console.error('Onboarding', e);
            setError('No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
            setGuardando(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background text-foreground flex justify-center">
            <div className="w-full max-w-md px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col">
                {/* Progreso y salir */}
                <div className="h-10 flex items-center justify-between">
                    {paso === 2
                        ? <button onClick={() => setPaso(1)} className="h-10 -ml-2 pr-2 flex items-center text-[15px] active:opacity-60"><ChevronLeft className="h-6 w-6" /> Atrás</button>
                        : <span />}
                    <span className="flex gap-1.5">
                        {[1, 2].map(n => <span key={n} className={cn('h-1.5 rounded-full transition-all', n === paso ? 'w-6 bg-foreground' : 'w-1.5 bg-hairline-strong')} />)}
                    </span>
                    <button onClick={() => terminar(false, rol || 'cliente')} disabled={guardando}
                        className="text-[15px] text-muted-foreground disabled:opacity-40 active:opacity-60">Saltar</button>
                </div>

                <AnimatePresence mode="wait">
                    {paso === 1 ? (
                        <motion.div key="p1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex-1 flex flex-col">
                            <h1 className="mt-4 font-heading text-[28px] font-bold leading-[1.1]">¿Quién eres en la música?</h1>
                            <p className="mt-2 text-[15px] text-muted-foreground">Te enseñamos lo que te interesa desde el primer minuto.</p>
                            <div className="mt-5 space-y-2.5">
                                {ROLES.map(x => (
                                    <button key={x.id} onClick={() => setRol(x.id)}
                                        className={cn('pulsable w-full flex items-center gap-4 p-2.5 pr-4 rounded-[20px] bg-card text-left shadow-e1 border-2',
                                            rol === x.id ? 'border-foreground' : 'border-transparent')}>
                                        <img src={`/images/categorias/rol-${x.id}.webp`} alt="" className="h-[72px] w-[72px] rounded-2xl object-cover bg-white" />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[17px] font-bold leading-tight">{x.titulo}</span>
                                            <span className="block text-[14px] text-muted-foreground">{x.bajada}</span>
                                        </span>
                                        <span className={cn('h-6 w-6 rounded-full flex items-center justify-center', rol === x.id ? 'bg-foreground text-background' : 'border border-hairline-strong')}>
                                            {rol === x.id && <Check className="h-4 w-4" strokeWidth={3} />}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-auto pt-6">
                                <button onClick={() => rol && setPaso(2)} disabled={!rol}
                                    className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold disabled:opacity-40">
                                    Continuar
                                </button>
                            </div>
                        </motion.div>
                    ) : r && (
                        <motion.div key="p2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex-1 flex flex-col">
                            <h1 className="mt-4 font-heading text-[28px] font-bold leading-[1.1] text-center">Tu perfil en 30 segundos</h1>
                            <p className="mt-2 text-[15px] text-muted-foreground text-center">
                                {r.id === 'cliente' ? 'Para que los artistas sepan con quién hablan.' : 'Así te encuentran en Explorar.'}
                            </p>

                            {r.id === 'musico' && (
                                <RellenarConWeb className="mt-5" onAplicar={aplicarWeb} campos={['nombre', 'ciudad', 'bio', 'generos', 'ficha', 'redes']} actual={{ nombre, ciudad }} />
                            )}

                            <button onClick={() => inputFoto.current?.click()} className="pulsable mt-5 mx-auto h-28 w-28 rounded-full overflow-hidden bg-fill flex flex-col items-center justify-center text-muted-foreground">
                                {fotoUrl
                                    ? <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                                    : <><Camera className="h-7 w-7" /><span className="mt-1 text-[12px]">Añade una foto</span></>}
                            </button>
                            <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { elegirFoto(e.target.files?.[0]); e.target.value = ''; }} />

                            <label className="mt-5 block text-[14px] font-semibold">{r.nombre}</label>
                            <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 80))} placeholder={r.id === 'musico' ? 'Ej. Rumba Sur' : 'Escríbelo aquí'}
                                className="mt-1.5 w-full h-12 rounded-xl bg-fill px-4 text-[16px] focus:outline-none focus:ring-2 focus:ring-foreground/10" />

                            <label className="mt-4 block text-[14px] font-semibold">Ciudad</label>
                            <div className="relative mt-1.5">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input value={ciudad} onChange={e => setCiudad(e.target.value.slice(0, 60))} placeholder="Barcelona"
                                    className="w-full h-12 rounded-xl bg-fill pl-10 pr-4 text-[16px] focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                            </div>
                            <div className="mt-2 flex gap-1.5 overflow-x-auto hide-scrollbar">
                                {CIUDADES.map(c => (
                                    <button key={c} onClick={() => setCiudad(c)} className={cn('pulsable shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold', ciudad === c ? 'bg-foreground text-background' : 'bg-fill')}>{c}</button>
                                ))}
                            </div>

                            <label className="mt-4 block text-[14px] font-semibold">{r.id === 'cliente' ? '¿Para qué?' : '¿Qué haces?'}</label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {r.queHaces.map(q => {
                                    const on = que.includes(q);
                                    return <button key={q} onClick={() => setQue(v => on ? v.filter(x => x !== q) : [...v, q])}
                                        className={cn('pulsable h-9 px-3.5 rounded-full text-[14px] font-semibold', on ? 'bg-foreground text-background' : 'bg-fill')}>{q}</button>;
                                })}
                            </div>

                            {r.id !== 'cliente' && (
                                <>
                                    <p className="mt-6 text-[13px] font-semibold text-muted-foreground">Así te verán en Explorar</p>
                                    <div className="mt-2 flex items-center gap-3 p-3 rounded-2xl bg-card shadow-e2 border border-hairline">
                                        <span className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-fill flex items-center justify-center text-[20px] font-bold">
                                            {fotoUrl ? <img src={fotoUrl} alt="" className="h-full w-full object-cover" /> : (nombre || 'T').slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[16px] font-bold line-clamp-1">{nombre || 'Tu nombre'}</span>
                                            <span className="block text-[13px] text-muted-foreground line-clamp-1">{[que.slice(0, 2).join(' · ') || r.titulo, ciudad, r.id === 'musico' ? deLaWeb?.generos?.slice(0, 2).join(', ') : ''].filter(Boolean).join(' · ')}</span>
                                            {r.id === 'musico' && deLaWeb?.bio && <span className="block mt-0.5 text-[13px] text-muted-foreground line-clamp-2">{deLaWeb.bio}</span>}
                                            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">Nuevo en Musikeeo</span>
                                        </span>
                                    </div>
                                    {r.id === 'musico' && queDeLaWeb && (
                                        <p className="mt-2 text-[13px] text-muted-foreground">
                                            Al entrar se guarda también {queDeLaWeb}, de tu web.{' '}
                                            <button type="button" onClick={() => setDeLaWeb(null)} className="underline underline-offset-2 active:opacity-60">Quitar</button>
                                        </p>
                                    )}
                                </>
                            )}

                            {error && <p className="mt-3 text-[14px] text-red-500">{error}</p>}
                            <div className="mt-auto pt-6">
                                <button onClick={() => terminar(true)} disabled={guardando || !nombre.trim()}
                                    className="pulsable w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                                    {guardando ? <><Loader2 className="h-5 w-5 animate-spin" /> Entrando…</> : 'Entrar en Musikeeo'}
                                </button>
                                <button onClick={() => terminar(false)} disabled={guardando} className="mt-3 w-full text-[14px] text-muted-foreground active:opacity-60">Lo completo luego</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Search, Bell, MessageCircle, Eye, Heart, Star,
  ChevronRight, TrendingUp, Zap, Bot,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Músicos',  desc: 'Encuentra y conecta con talento',          icon: '/icons/cat-musicos.webp',  color: '#7C3AED', route: '/discover?type=musician'  },
  { label: 'Técnicos', desc: 'Sonido, luces, backline y más',            icon: '/icons/cat-tecnicos.webp', color: '#2563EB', route: '/discover?type=provider'  },
  { label: 'Salas',    desc: 'Descubre y conecta con espacios',          icon: '/icons/cat-salas.webp',    color: '#EA580C', route: '/discover?type=organizer' },
  { label: 'Eventos',  desc: 'Publica, encuentra y únete a eventos',     icon: '/icons/cat-eventos.webp',  color: '#0891B2', route: '/eventos'                 },
];

const SEARCH_PILLS = ['Guitarristas en Madrid', 'PA System alquiler', 'Bolo este fin de semana'];

const LISTINGS = [
  { title: "Gibson Les Paul '59 Reissue", price: '2.400€', badge: 'Venta',    img: '/images/fender_stratocaster_1768143437660.png' },
  { title: 'Mesa Boogie Mark V',          price: '1.100€', badge: 'Alquiler', img: '/images/guitar_amplifier_1768143723681.png'     },
  { title: 'Shure SM7dB',                 price: '380€',   badge: 'Venta',    img: '/images/microphone_pro_1768143562847.png'        },
];

const TRENDING_ARTISTS = [
  { name: 'Carlos M.',   role: 'Guitarrista',    city: 'Madrid',    img: '/artists/nova-rock.png',     hot: true,  rating: 4.9 },
  { name: 'Ana Torres',  role: 'Técnica FOH',    city: 'Barcelona', img: '/artists/midnight-trio.png', hot: false, rating: 4.8 },
  { name: 'DJ Solano',   role: 'DJ / Productor', city: 'Valencia',  img: '/artists/dj-alex-beat.png',  hot: true,  rating: 4.9 },
  { name: 'La Sala Sur', role: 'Promotora',      city: 'Sevilla',   img: '/artists/mariachi-sol.png',  hot: false, rating: 4.7 },
];

const ACTIVITY = [
  { Icon: Eye,           color: '#7C3AED', text: '12 personas han visitado tu perfil', time: 'hace 2h', to: '/profile'  },
  { Icon: Heart,         color: '#DC2626', text: 'A 5 personas les gustó tu video',    time: 'hace 4h', to: '/feed'     },
  { Icon: MessageCircle, color: '#0891B2', text: '2 mensajes sin responder',            time: 'hace 1h', to: '/messages' },
  { Icon: Star,          color: '#D97706', text: 'Tienes una nueva valoración 5/5',     time: 'ayer',    to: '/profile'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' as const },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryCards({ navigate, cols = 2 }: { navigate: (p: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
      {CATEGORIES.map((cat) => (
        <div
          key={cat.label}
          onClick={() => navigate(cat.route)}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
        >
          <img src={cat.icon} alt={cat.label} className="w-14 h-14 object-contain mb-3 group-hover:scale-105 transition-transform" />
          <p className="text-sm font-bold mb-0.5" style={{ color: cat.color }}>{cat.label}</p>
          <p className="text-xs text-muted-foreground leading-snug flex-1">{cat.desc}</p>
          <div className="flex items-center gap-0.5 mt-2">
            <span className="text-xs text-muted-foreground">Explorar</span>
            <ChevronRight size={11} className="text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketBlock({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Musikeeo Market</p>
          <p className="text-sm font-bold text-foreground leading-tight">Compra, vende y alquila</p>
          <p className="text-xs text-muted-foreground">Instrumentos y equipo de sonido</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/market'); }}
            className="bg-muted border border-border text-xs font-semibold px-3 py-1.5 rounded-lg text-foreground whitespace-nowrap"
          >
            Ver todo
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/market/create'); }}
            className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
          >
            + Publicar
          </button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide p-3">
        {LISTINGS.map((item) => (
          <div
            key={item.title}
            onClick={() => navigate('/market')}
            className="flex-shrink-0 w-40 bg-background border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="h-28 overflow-hidden bg-muted">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold text-foreground leading-tight mb-1.5 line-clamp-2">{item.title}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-foreground">{item.price}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.badge === 'Alquiler'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-primary/10 text-primary'
                }`}>{item.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OportunidadCard({ navigate, isLoggedIn }: { navigate: (p: string) => void; isLoggedIn: boolean }) {
  return (
    <div
      onClick={() => navigate(isLoggedIn ? '/messages' : '/login')}
      className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] cursor-pointer"
      style={{ minHeight: 200 }}
    >
      <img
        src="/images/concert_venue_1768143610025.png"
        alt="Concierto"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            🔥 Oportunidad
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
          >
            <Star size={12} className="text-white" />
          </button>
        </div>
        <p className="text-base font-extrabold text-white leading-tight mb-1">
          Buscamos técnico de sonido para gira nacional
        </p>
        <p className="text-xs text-white/70 leading-relaxed mb-3">
          Festival de verano, 15 fechas en julio. Experiencia con FOH requerida.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60 mb-4">
          <span>📍 Madrid · Nacional</span>
          <span>€ 1.200€/fecha</span>
          <span>📅 Julio 2026</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(isLoggedIn ? '/messages' : '/login'); }}
            className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Zap size={12} /> Contactar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/discover'); }}
            className="bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/20"
          >
            Ver más
          </button>
        </div>
      </div>
    </div>
  );
}

function ActividadBlock({ navigate, compact = false }: { navigate: (p: string) => void; compact?: boolean }) {
  const items = compact ? ACTIVITY.slice(0, 3) : ACTIVITY;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-foreground">Tu actividad</span>
        <button onClick={() => navigate('/profile')} className="text-xs text-primary flex items-center gap-0.5">
          Ver todo <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => {
          const { Icon } = item;
          return (
            <div
              key={i}
              onClick={() => navigate(item.to)}
              className="flex items-center gap-2 cursor-pointer py-1 rounded-lg hover:bg-muted/60 transition-colors -mx-1 px-1"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18` }}
              >
                <Icon size={13} style={{ color: item.color }} />
              </div>
              <p className="text-xs text-foreground flex-1 leading-snug line-clamp-2">{item.text}</p>
              {!compact && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
              )}
              {compact && item.time !== 'ayer' && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArtistasBlock({
  navigate,
  compact = false,
  cols = 4,
}: {
  navigate: (p: string) => void;
  compact?: boolean;
  cols?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Artistas en tendencia</span>
        </div>
        <button onClick={() => navigate('/discover')} className="text-xs text-primary flex items-center gap-0.5">
          Ver todos <ChevronRight size={12} />
        </button>
      </div>

      {compact ? (
        // Compact: vertical list (mobile 2-col grid)
        <div className="space-y-2">
          {TRENDING_ARTISTS.slice(0, 3).map((p) => (
            <div
              key={p.name}
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                {p.hot && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border border-background" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      ) : cols === 4 ? (
        // Desktop: 4-column grid
        <div className="grid grid-cols-4 gap-3">
          {TRENDING_ARTISTS.map((person) => (
            <div
              key={person.name}
              onClick={() => navigate('/discover')}
              className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="relative h-32 overflow-hidden bg-muted">
                <img src={person.img} alt={person.name} className="w-full h-full object-cover" />
                {person.hot && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    Hot
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-foreground mb-0.5">{person.name}</p>
                <p className="text-[10px] text-muted-foreground">{person.role}</p>
                <p className="text-[10px] text-muted-foreground">📍 {person.city}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  <Star size={10} className="text-primary fill-primary" />
                  <span className="text-[10px] text-muted-foreground">{person.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Mobile: horizontal scroll
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {TRENDING_ARTISTS.map((person) => (
            <div
              key={person.name}
              onClick={() => navigate('/discover')}
              className="w-32 flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all"
            >
              <div className="relative h-24 overflow-hidden bg-muted">
                <img src={person.img} alt={person.name} className="w-full h-full object-cover" />
                {person.hot && (
                  <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    Hot
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold text-foreground">{person.name}</p>
                <p className="text-[10px] text-muted-foreground">{person.role}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star size={9} className="text-primary fill-primary" />
                  <span className="text-[9px] text-muted-foreground">{person.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RodrigoCard({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div
      onClick={() => navigate('/rodrigo')}
      className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] cursor-pointer"
      style={{ minHeight: 160 }}
    >
      <img
        src="/rodrigo-persona.png"
        alt="Rodrigo AI"
        className="absolute right-0 bottom-0 h-full object-contain opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Bot size={12} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Rodrigo AI</span>
          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">BETA</span>
        </div>
        <p className="text-sm font-extrabold text-white leading-tight mb-1 max-w-[180px]">
          Tu manager IA siempre listo para ayudarte
        </p>
        <p className="text-xs text-white/60 mb-3 max-w-[180px]">
          Optimiza tu perfil, encuentra oportunidades y haz crecer tu carrera.
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/rodrigo'); }}
          className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
        >
          <Zap size={11} /> Hablar con Rodrigo
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AppHome() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const firstName  = user?.displayName?.split(' ')[0] ?? null;
  const initials   = firstName ? firstName[0].toUpperCase() : '?';
  const isLoggedIn = !!user;
  const greeting   = getGreeting();
  const name       = firstName ?? 'Músico';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-24 md:pb-6">

      {/* ── Mobile header (hidden on desktop — TopBar handles it there) ── */}
      <div className="md:hidden sticky top-0 z-20 bg-background/98 backdrop-blur-xl border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-black text-sm leading-none">M</span>
          </div>
          <span className="font-heading font-bold text-base tracking-wide text-foreground">
            MUSIK<span className="text-primary">EEO</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate('/discover')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <MessageCircle size={18} />
            {isLoggedIn && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background text-[8px] font-bold flex items-center justify-center" />}
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Bell size={18} />
            {isLoggedIn && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background" />}
          </button>
          <div
            onClick={() => navigate(isLoggedIn ? '/panel' : '/login')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center cursor-pointer ml-1 overflow-hidden"
          >
            {user?.photoURL
              ? <img src={user.photoURL} alt={name} className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            }
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — grid [main | right-rail]                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[1fr_320px] md:gap-6 md:px-6 md:pt-6 md:pb-6 md:items-start">

        {/* ── Main column ── */}
        <div className="space-y-5 min-w-0">

          {/* Hero */}
          <motion.div {...fade(0)} className="relative bg-card border border-border rounded-2xl overflow-hidden p-6 flex items-center">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{greeting}, {name} 👋</p>
              <h1 className="text-4xl font-extrabold tracking-tighter leading-none mb-2">
                Conecta. Crea.{' '}
                <span className="text-primary">Suena.</span>
              </h1>
              <p className="text-base text-muted-foreground">Tu red profesional de música en directo.</p>
            </div>
            {/* Decorative glow */}
            <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/50 blur-xl" />
            </div>
          </motion.div>

          {/* Search */}
          <motion.div {...fade(0.05)}>
            <div
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 bg-card border border-border rounded-2xl h-12 px-4 cursor-pointer hover:border-primary/40 transition-colors group"
            >
              <Search size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">Busca músicos, técnicos, salas, eventos...</span>
              <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md font-mono flex-shrink-0">⌘ K</span>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div {...fade(0.1)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-foreground">¿Qué necesitas hoy?</span>
              <button onClick={() => navigate('/discover')} className="text-sm text-primary flex items-center gap-0.5">
                Ver todas <ChevronRight size={14} />
              </button>
            </div>
            <CategoryCards navigate={navigate} cols={4} />
          </motion.div>

          {/* Marketplace */}
          <motion.div {...fade(0.15)}>
            <MarketBlock navigate={navigate} />
          </motion.div>

          {/* Artistas */}
          <motion.div {...fade(0.2)}>
            <ArtistasBlock navigate={navigate} cols={4} />
          </motion.div>
        </div>

        {/* ── Right rail ── */}
        <div className="space-y-4 sticky top-[70px]">
          <motion.div {...fade(0.1)}>
            <OportunidadCard navigate={navigate} isLoggedIn={isLoggedIn} />
          </motion.div>

          {isLoggedIn && (
            <motion.div {...fade(0.15)} className="bg-card border border-border rounded-2xl p-4">
              <ActividadBlock navigate={navigate} />
            </motion.div>
          )}

          <motion.div {...fade(0.2)}>
            <RodrigoCard navigate={navigate} />
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE LAYOUT — single column                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* Hero */}
        <motion.div {...fade(0)} className="px-4 pt-5 pb-2">
          <p className="text-sm text-muted-foreground mb-1">{greeting}, {name} 👋</p>
          <h1 className="text-[28px] font-extrabold tracking-tighter leading-tight mb-1">
            Conecta. Crea.{' '}
            <span className="text-primary">Suena.</span>
          </h1>
          <p className="text-sm text-muted-foreground">Tu red profesional de música en directo.</p>
        </motion.div>

        {/* Search + pills */}
        <motion.div {...fade(0.05)} className="px-4 mb-5">
          <div
            onClick={() => navigate('/discover')}
            className="flex items-center gap-2 bg-muted border border-border rounded-2xl h-12 px-4 cursor-pointer hover:border-primary/30 transition-colors mb-2"
          >
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Busca músicos, técnicos, salas...</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {SEARCH_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => navigate(`/discover?q=${encodeURIComponent(pill)}`)}
                className="flex-shrink-0 text-xs bg-card border border-border text-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:border-primary/40 transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div {...fade(0.1)} className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-bold text-foreground">¿Qué necesitas hoy?</span>
            <button onClick={() => navigate('/discover')} className="text-sm text-primary flex items-center gap-0.5">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <CategoryCards navigate={navigate} cols={2} />
        </motion.div>

        {/* Marketplace */}
        <motion.div {...fade(0.15)} className="px-4 mb-5">
          <MarketBlock navigate={navigate} />
        </motion.div>

        {/* Oportunidad */}
        <motion.div {...fade(0.2)} className="px-4 mb-5">
          <OportunidadCard navigate={navigate} isLoggedIn={isLoggedIn} />
        </motion.div>

        {/* 2-col: Actividad | Artistas (logged in only) */}
        {isLoggedIn && (
          <motion.div {...fade(0.25)} className="px-4 mb-5 grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-3">
              <ActividadBlock navigate={navigate} compact />
            </div>
            <div className="bg-card border border-border rounded-2xl p-3">
              <ArtistasBlock navigate={navigate} compact />
            </div>
          </motion.div>
        )}

        {/* Artistas scroll (visible for everyone) */}
        <motion.div {...fade(0.3)} className="px-4 mb-5">
          <ArtistasBlock navigate={navigate} cols={2} />
        </motion.div>

        {/* CTA no logueado */}
        {!isLoggedIn && (
          <motion.div {...fade(0.35)} className="mx-4 mb-5">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-foreground mb-1">Únete a Musikeeo</p>
              <p className="text-xs text-muted-foreground mb-3">Conecta con músicos, técnicos y salas de toda España.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => navigate('/register')} className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl">
                  Crear cuenta gratis
                </button>
                <button onClick={() => navigate('/login')} className="border border-border text-foreground text-xs font-semibold px-5 py-2.5 rounded-xl">
                  Iniciar sesión
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

    </motion.div>
  );
}

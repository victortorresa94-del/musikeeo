import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Bell, Search, Music2, Headphones, Building2,
  Calendar, ShoppingBag, MessageCircle, TrendingUp,
  Eye, Heart, Star, ChevronRight
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Músicos',  icon: Music2,     color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',  route: '/discover?type=musician' },
  { label: 'Técnicos', icon: Headphones, color: '#2563EB', bg: 'rgba(37,99,235,0.10)',   route: '/discover?type=provider' },
  { label: 'Salas',    icon: Building2,  color: '#EA580C', bg: 'rgba(234,88,12,0.10)',   route: '/discover?type=organizer'},
  { label: 'Eventos',  icon: Calendar,   color: '#0891B2', bg: 'rgba(8,145,178,0.10)',   route: '/eventos' },
];

const TRENDING_ARTISTS = [
  { name: 'Carlos M.',   role: 'Guitarrista', city: 'Madrid',    initials: 'CM', gradient: 'from-purple-500/20 to-purple-600/10', hot: true  },
  { name: 'Ana Torres',  role: 'Técnica FOH', city: 'Barcelona', initials: 'AT', gradient: 'from-blue-500/20 to-blue-600/10',   hot: false },
  { name: 'DJ Solano',   role: 'DJ / Prod.',  city: 'Valencia',  initials: 'DS', gradient: 'from-pink-500/20 to-pink-600/10',   hot: true  },
  { name: 'La Sala Sur', role: 'Promotora',   city: 'Sevilla',   initials: 'LS', gradient: 'from-orange-500/20 to-orange-600/10', hot: false },
];

const ACTIVITY_ITEMS = [
  { icon: Eye,           color: '#7C3AED', text: '12 personas han visitado tu perfil',          time: 'hace 2h',    action: '/profile' },
  { icon: Heart,         color: '#DC2626', text: 'A 5 personas les gustó tu vídeo',             time: 'hace 4h',    action: '/feed'    },
  { icon: MessageCircle, color: '#0891B2', text: '2 mensajes sin responder',                    time: 'hace 1h',    action: '/messages'},
  { icon: Star,          color: '#D97706', text: 'Tienes una nueva valoración ⭐ 5/5',           time: 'ayer',       action: '/profile' },
];

const NEW_LISTINGS = [
  { title: 'Gibson Les Paul \'59 R',  price: '2.400€', badge: 'Venta',    emoji: '🎸' },
  { title: 'Mesa Boogie Mark V',       price: '1.100€', badge: 'Alquiler', emoji: '🔊' },
  { title: 'Shure SM7dB',             price: '380€',   badge: 'Venta',    emoji: '🎙' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días,';
  if (h < 20) return 'Buenas tardes,';
  return 'Buenas noches,';
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.displayName?.split(' ')[0] ?? 'Músico';
  const initials    = displayName.charAt(0).toUpperCase();
  const isLoggedIn  = !!user;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen pb-24">

      {/* ── Header ── */}
      <motion.div {...fade(0)} className="bg-background/95 backdrop-blur sticky top-0 z-10 border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{getGreeting()}</p>
          <p className="text-xl font-extrabold tracking-tighter text-foreground">{displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => isLoggedIn ? navigate('/messages') : navigate('/login')}
            className="relative w-10 h-10 bg-muted rounded-full flex items-center justify-center"
          >
            <Bell size={18} className="text-muted-foreground" />
            {isLoggedIn && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
          </button>
          <div
            onClick={() => isLoggedIn ? navigate('/profile') : navigate('/login')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer"
          >
            {isLoggedIn ? initials : '?'}
          </div>
        </div>
      </motion.div>

      {/* ── Search ── */}
      <motion.div {...fade(0.05)} className="mx-4 mt-4 mb-5">
        <div
          onClick={() => navigate('/discover')}
          className="flex items-center gap-2 bg-muted border border-border rounded-2xl h-12 px-4 cursor-pointer hover:border-primary/30 transition-colors"
        >
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Busca músicos, técnicos, salas...</span>
        </div>
      </motion.div>

      {/* ── Categorías ── */}
      <motion.div {...fade(0.1)}>
        <SectionHeader title="¿Qué necesitas?" action="Ver todo" onAction={() => navigate('/discover')} />
        <div className="px-4 grid grid-cols-2 gap-2.5 mb-6">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div key={cat.label} {...fade(0.1 + i * 0.05)}>
                <div
                  onClick={() => navigate(cat.route)}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98] hover:bg-muted/40"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cat.bg, border: `1px solid ${cat.color}33` }}
                  >
                    <Icon size={20} style={{ color: cat.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">Explorar →</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Marketplace Banner ── */}
      <motion.div {...fade(0.3)} className="mx-4 mb-6">
        <div
          onClick={() => navigate('/market')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 border border-emerald-700/30 p-4 cursor-pointer active:scale-[0.99] transition-all"
        >
          {/* BG glow */}
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Marketplace</p>
              <p className="text-base font-extrabold text-white tracking-tight leading-tight">Compra, vende y alquila</p>
              <p className="text-xs text-emerald-200/60 mt-0.5">Instrumentos y equipo de sonido</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/market'); }}
                className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
              >
                Ver todo
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/market/create'); }}
                className="border border-emerald-500/50 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
              >
                + Publicar
              </button>
            </div>
          </div>

          {/* Mini listings preview */}
          <div className="mt-3 pt-3 border-t border-emerald-700/30 flex gap-2 overflow-x-auto scrollbar-hide">
            {NEW_LISTINGS.map((item) => (
              <div key={item.title} className="flex-shrink-0 bg-emerald-950/60 border border-emerald-700/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">{item.title}</p>
                  <p className="text-xs text-emerald-400 font-bold">{item.price}</p>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Actividad reciente (solo logueados) ── */}
      {isLoggedIn && (
        <motion.div {...fade(0.4)} className="mb-6">
          <SectionHeader title="Tu actividad" action="Ver todo" onAction={() => navigate('/profile')} />
          <div className="px-4 space-y-2">
            {ACTIVITY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} {...fade(0.4 + i * 0.05)}>
                  <div
                    onClick={() => navigate(item.action)}
                    className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                      <Icon size={15} style={{ color: item.color }} />
                    </div>
                    <p className="text-sm text-foreground flex-1 leading-snug">{item.text}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Oportunidad destacada ── */}
      <motion.div {...fade(0.55)} className="mx-4 mb-6 bg-card rounded-2xl border-l-4 border-l-primary border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            🔥 Oportunidad
          </span>
          <span className="text-[10px] text-muted-foreground">Publicado hace 2h</span>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">
          Buscamos técnico de sonido para gira nacional
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Festival de verano, 15 fechas en julio. Experiencia con FOH requerida. Contrato profesional.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <span>📍 Madrid · Nacional</span>
          <span>💶 1.200€ / fecha</span>
          <span>📅 Julio 2026</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(isLoggedIn ? '/messages' : '/login')}
            className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl"
          >
            Contactar
          </button>
          <button
            onClick={() => navigate('/discover')}
            className="bg-muted text-foreground border border-border text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Ver más
          </button>
        </div>
      </motion.div>

      {/* ── Artistas en tendencia ── */}
      <motion.div {...fade(0.65)} className="mb-6">
        <SectionHeader
          title="Artistas en tendencia"
          icon={<TrendingUp size={14} className="text-primary" />}
          action="Ver todos"
          onAction={() => navigate('/discover')}
        />
        <div className="px-4 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {TRENDING_ARTISTS.map((person, i) => (
            <motion.div key={person.name} {...fade(0.65 + i * 0.05)}>
              <div className="w-36 flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                <div className={`h-[68px] bg-gradient-to-br ${person.gradient} relative`}>
                  {person.hot && (
                    <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Hot</span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                      {person.initials}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">{person.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{person.role}</p>
                  <p className="text-[10px] text-muted-foreground">📍 {person.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA si no está logueado ── */}
      {!isLoggedIn && (
        <motion.div {...fade(0.7)} className="mx-4 mb-6">
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

    </motion.div>
  );
}

// ─── Shared sub-component ─────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  action,
  onAction,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-4 mb-3 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-base font-bold tracking-tight text-foreground">{title}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-sm text-primary flex items-center gap-0.5">
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

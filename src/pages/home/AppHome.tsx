import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Bell, Search, Music2, Headphones, Building2, Users, ShoppingBag, Calendar } from 'lucide-react';

const CATEGORIES = [
  { label: 'Músicos',  icon: Music2,      color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',  route: '/discover' },
  { label: 'Técnicos', icon: Headphones,  color: '#2563EB', bg: 'rgba(37,99,235,0.10)',   route: '/discover' },
  { label: 'Salas',    icon: Building2,   color: '#EA580C', bg: 'rgba(234,88,12,0.10)',   route: '/discover' },
  { label: 'Bandas',   icon: Users,       color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   route: '/discover' },
  { label: 'Mercado',  icon: ShoppingBag, color: '#059669', bg: 'rgba(5,150,105,0.10)',   route: '/market'   },
  { label: 'Eventos',  icon: Calendar,    color: '#0891B2', bg: 'rgba(8,145,178,0.10)',   route: '/eventos'  },
];

const NEARBY = [
  { name: 'Carlos M.',   role: 'Músico',    city: 'Madrid',    initials: 'CM', gradient: 'from-purple-500/20 to-purple-600/10' },
  { name: 'Ana Torres',  role: 'Técnica',   city: 'Barcelona', initials: 'AT', gradient: 'from-blue-500/20 to-blue-600/10'   },
  { name: 'La Sala Sur', role: 'Promotora', city: 'Sevilla',   initials: 'LS', gradient: 'from-orange-500/20 to-orange-600/10' },
  { name: 'Drum Store',  role: 'Tienda',    city: 'Valencia',  initials: 'DS', gradient: 'from-green-500/20 to-green-600/10' },
];

const QUICK_LINKS = [
  { label: 'Mercado',    route: '/market'   },
  { label: 'Eventos',    route: '/eventos'  },
  { label: 'Rodrigo IA', route: '/rodrigo'  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días,';
  if (h < 20) return 'Buenas tardes,';
  return 'Buenas noches,';
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay },
});

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.displayName ?? 'Usuario';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen pb-24">

      {/* Header */}
      <motion.div {...fade(0)} className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{getGreeting()}</p>
          <p className="text-xl font-extrabold tracking-tighter text-foreground">{displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Bell size={18} className="text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-sm font-bold text-primary-foreground">
            {initials}
          </div>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div {...fade(0.05)} className="mx-4 mt-4 mb-5">
        <div
          onClick={() => navigate('/discover')}
          className="flex items-center gap-2 bg-muted border border-border rounded-2xl h-12 px-4 cursor-pointer"
        >
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Busca músicos, técnicos, salas...</span>
        </div>
      </motion.div>

      {/* Category grid */}
      <motion.div {...fade(0.1)}>
        <div className="px-4 mb-3 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-foreground">¿Qué necesitas?</span>
          <button onClick={() => navigate('/discover')} className="text-sm text-primary">Ver todo</button>
        </div>
        <div className="px-4 grid grid-cols-2 gap-2.5 mb-5">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div key={cat.label} {...fade(0.1 + i * 0.05)}>
                <div
                  onClick={() => navigate(cat.route)}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 transition-all cursor-pointer hover:bg-muted/40"
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

      {/* Cerca de ti */}
      <motion.div {...fade(0.4)}>
        <div className="px-4 mb-3 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-foreground">Cerca de ti</span>
          <button onClick={() => navigate('/discover')} className="text-sm text-primary">Ver todo</button>
        </div>
        <div className="px-4 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {NEARBY.map((person, i) => (
            <motion.div key={person.name} {...fade(0.4 + i * 0.05)}>
              <div className="w-36 flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all">
                <div className={`h-[72px] bg-gradient-to-br ${person.gradient}`} />
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                      {person.initials}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">{person.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{person.role}</p>
                  <p className="text-[10px] text-muted-foreground">{person.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Opportunity card */}
      <motion.div {...fade(0.6)} className="mx-4 mb-5 bg-card rounded-2xl border-l-4 border-l-primary border border-border p-4">
        <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-1 rounded-full">
          OPORTUNIDAD
        </span>
        <p className="text-sm font-bold text-foreground mt-2 mb-1">
          Buscamos técnico de sonido para gira nacional
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Festival de verano, 15 fechas en julio. Experiencia con FOH requerida. Contrato profesional.
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground mb-3">
          <span>📍 Madrid • Nacional</span>
          <span>💶 1.200€ / fecha</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/messages')}
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

      {/* Quick links */}
      <motion.div {...fade(0.7)} className="px-4 mb-4">
        <p className="text-sm font-bold text-foreground mb-2">Accesos rápidos</p>
        <div className="flex gap-2">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.route)}
              className="bg-muted border border-border rounded-full text-xs font-semibold text-muted-foreground px-4 py-2 hover:border-primary/40 hover:text-primary transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Search, CalendarDays, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  exact?: boolean;
  match?: RegExp;
}

const HOME: NavItem = { icon: Home, label: 'Inicio', path: '/home', exact: true };
const CORE: NavItem[] = [
  { icon: PlaySquare,   label: 'Feed',     path: '/feed', match: /^\/(feed|reels)/ },
  { icon: Search,       label: 'Explorar', path: '/discover', match: /^\/(discover|artistas|sonido|artist|profile\/)/ },
  { icon: CalendarDays, label: 'Bolos',    path: '/eventos', match: /^\/(eventos|publicar)/ },
  { icon: ShoppingBag,  label: 'Mercado',  path: '/market', match: /^\/market/ },
];

// Barra de pestañas estilo iOS. Sin cuenta: Inicio + 4 (la home es el escaparate).
// Con cuenta: las 4 + «Perfil» a la derecha, como en Instagram.
export const BottomNav = () => {
  const { pathname } = useLocation();
  const { user, userProfile } = useAuth();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.path : item.match ? item.match.test(pathname) : pathname.startsWith(item.path);

  const items = user ? CORE : [HOME, ...CORE];
  const profileActive = /^\/(panel|profile$|messages)/.test(pathname);
  const [photoBroken, setPhotoBroken] = useState(false);
  const photo = photoBroken ? '' : (userProfile?.photoURL || user?.photoURL);
  const initial = (userProfile?.displayName || user?.displayName || 'T').slice(0, 1).toUpperCase();

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.06] pb-safe"
    >
      <div className="flex items-stretch justify-around h-[52px]">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-[3px] active:opacity-60 transition-opacity"
            >
              <Icon className={cn('h-[23px] w-[23px]', active ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={active ? 2.2 : 1.7} />
              <span className={cn('text-[10px] leading-none tracking-[0.01em]', active ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {user && (
          <Link
            to="/panel"
            aria-current={profileActive ? 'page' : undefined}
            aria-label="Tu perfil"
            className="flex flex-1 flex-col items-center justify-center gap-[3px] active:opacity-60 transition-opacity"
          >
            <span className={cn('h-[25px] w-[25px] rounded-full overflow-hidden flex items-center justify-center', profileActive ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : 'ring-1 ring-white/20')}>
              {photo
                ? <img src={photo} alt="" onError={() => setPhotoBroken(true)} className="h-full w-full object-cover" />
                : <span className="h-full w-full bg-white/15 text-[11px] font-bold text-foreground flex items-center justify-center">{initial}</span>}
            </span>
            <span className={cn('text-[10px] leading-none tracking-[0.01em]', profileActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium')}>
              Perfil
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
};

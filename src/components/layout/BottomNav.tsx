import { Link, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Search, CalendarDays, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home,         label: 'Inicio',   path: '/home', exact: true },
  { icon: PlaySquare,   label: 'Feed',     path: '/feed' },
  { icon: Search,       label: 'Explorar', path: '/discover' },
  { icon: CalendarDays, label: 'Bolos',    path: '/eventos' },
  { icon: ShoppingBag,  label: 'Mercado',  path: '/market' },
];

// Barra de pestañas estilo iOS: sin píldoras de color, la activa en blanco
export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path) || (item.path === '/discover' && /^\/(artistas|sonido)/.test(pathname));

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.06] pb-safe"
    >
      <div className="flex items-stretch justify-around h-[52px]">
        {NAV_ITEMS.map((item) => {
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
      </div>
    </nav>
  );
};

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Rss, Compass, Calendar, ShoppingBag, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home,        label: 'Inicio',     path: '/home',     exact: true },
  { icon: Rss,         label: 'Feed',       path: '/feed'                  },
  { icon: Compass,     label: 'Explorar',   path: '/discover'              },
  { icon: Calendar,    label: 'Eventos',    path: '/eventos'               },
  { icon: ShoppingBag, label: 'Mercado',    path: '/market'                },
  { icon: Bot,         label: 'Rodrigo AI', path: '/rodrigo'               },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <nav className={cn(
      'md:hidden fixed bottom-0 left-0 right-0 z-50',
      'bg-background/98 backdrop-blur-xl border-t border-border',
      'pb-safe'
    )}>
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon   = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
            >
              <motion.div
                animate={{ scale: active ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'flex items-center justify-center rounded-2xl transition-all',
                  active
                    ? 'bg-primary px-3 py-1.5'
                    : 'px-3 py-1.5'
                )}
              >
                <Icon
                  className={cn('h-5 w-5', active ? 'text-primary-foreground' : 'text-muted-foreground')}
                />
              </motion.div>
              <span className={cn(
                'text-[9px] font-medium transition-colors leading-none',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

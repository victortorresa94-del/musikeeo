import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: MessageCircle, label: 'Mensajes', path: '/messages' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'h-16 pb-safe',
        'bg-background/98 backdrop-blur-xl border-t border-border'
      )}
    >
      <div className="flex items-center justify-around h-full px-2">
        {/* Feed */}
        <NavButton item={NAV_ITEMS[0]} active={isActive(NAV_ITEMS[0].path)} onClick={() => navigate(NAV_ITEMS[0].path)} />

        {/* Discover */}
        <NavButton item={NAV_ITEMS[1]} active={isActive(NAV_ITEMS[1].path)} onClick={() => navigate(NAV_ITEMS[1].path)} />

        {/* CENTER FAB */}
        <button
          className={cn(
            'flex items-center justify-center',
            'bg-primary text-primary-foreground rounded-full h-12 w-12 -mt-5',
            'shadow-[0_4px_20px_var(--primary-glow)]',
            'hover:brightness-110 active:scale-95 transition-all'
          )}
          onClick={() => navigate('/market/create')}
          aria-label="Crear anuncio"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        {/* Messages */}
        <NavButton item={NAV_ITEMS[2]} active={isActive(NAV_ITEMS[2].path)} onClick={() => navigate(NAV_ITEMS[2].path)} />

        {/* Profile */}
        <NavButton item={NAV_ITEMS[3]} active={isActive(NAV_ITEMS[3].path)} onClick={() => navigate(NAV_ITEMS[3].path)} />
      </div>
    </nav>
  );
};

interface NavButtonProps {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}

const NavButton = ({ item, active, onClick }: NavButtonProps) => {
  const Icon = item.icon;

  return (
    <button
      className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors"
      onClick={onClick}
      aria-label={item.label}
    >
      <motion.div
        animate={{ scale: active ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'flex items-center justify-center',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      {active && (
        <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
      )}
    </button>
  );
};

import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Compass,       label: 'Artistas',  path: '/discover'  },
  { icon: ShoppingBag,   label: 'Mercado',   path: '/market'    },
  { icon: MessageCircle, label: 'Chat',      path: '/messages'  },
  { icon: User,          label: 'Perfil',    path: '/profile'   },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'h-16 pb-safe',
        'bg-background/98 backdrop-blur-xl border-t border-border'
      )}
    >
      <div className="flex items-center justify-around h-full px-2">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
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

      <span className={cn(
        'text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}>
        {item.label}
      </span>

      {active && (
        <span className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  );
};

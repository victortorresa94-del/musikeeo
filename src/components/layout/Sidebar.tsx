import { NavLink } from 'react-router-dom';
import {
  Home,
  Rss,
  Compass,
  Calendar,
  ShoppingBag,
  Bot,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home,        label: 'Inicio',     path: '/home'     },
  { icon: Rss,         label: 'Feed',       path: '/feed'     },
  { icon: Compass,     label: 'Explorar',   path: '/discover' },
  { icon: Calendar,    label: 'Eventos',    path: '/eventos'  },
  { icon: ShoppingBag, label: 'Mercado',    path: '/market'   },
  { icon: Bot,         label: 'Rodrigo AI', path: '/rodrigo'  },
];

export const Sidebar = () => {
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="hidden md:flex w-64 h-screen sticky top-0 flex-col bg-muted/60 border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border flex-shrink-0">
        <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-6 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-r-xl pl-[10px]'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground rounded-xl'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary' : ''
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border mx-2 mb-2 mt-auto">
        <div className="bg-background rounded-xl p-3 mt-2">
          {/* User info */}
          <NavLink to="/panel" className="flex items-center gap-2.5 mb-3 group overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center flex-shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {userProfile?.primaryMode || 'Músico'}
              </p>
            </div>
          </NavLink>

          {/* Theme toggle + Logout */}
          <div className="flex items-center justify-between">
            <ThemeToggle size="sm" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-destructive/80 hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

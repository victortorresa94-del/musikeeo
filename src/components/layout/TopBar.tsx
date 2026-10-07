import { useState } from 'react';
import { Bell, MessageCircle, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick: _onMenuClick }: TopBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'MK';

  // Al volver del login, regresar a la página donde estaba
  const loginState = { from: location.pathname + location.search };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/discover${searchValue.trim() ? `?q=${encodeURIComponent(searchValue.trim())}` : ''}`);
  };

  const guestActions = (
    <>
      <Link
        to="/login"
        state={loginState}
        className="h-9 px-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted flex items-center transition-colors"
      >
        Entrar
      </Link>
      <Link
        to="/register"
        className="h-9 px-4 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center transition-colors"
      >
        Crear cuenta
      </Link>
    </>
  );

  return (
    <>
      {/* MOBILE — barra mínima con logo y acceso */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-background/90 backdrop-blur-md border-b border-border">
        <Link to="/home" className="flex items-center gap-2">
          <img src="/logo-musikeeo.png" alt="" className="h-7 w-7 rounded-lg object-contain" />
          <span className="font-heading font-bold text-sm tracking-wide text-foreground">
            MUSIK<span className="text-primary">EEO</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {!loading && !user && guestActions}
          {user && (
            <>
              <button
                className="relative flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                onClick={() => navigate('/messages')}
                aria-label="Mensajes"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <button
                className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center"
                onClick={() => navigate('/panel')}
                aria-label="Mi panel"
              >
                <span className="font-bold text-xs text-primary-foreground">{initials}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* DESKTOP */}
      <header
        className={cn(
          'hidden md:flex items-center justify-between gap-4',
          'sticky top-0 z-20 h-14 px-4',
          'bg-background/95 backdrop-blur-md border-b border-border'
        )}
      >
        {/* CENTER — Functional search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex justify-center">
          <div className="relative flex items-center w-80 max-w-lg">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar músicos, técnicos, salas..."
              className="w-full bg-muted border border-border rounded-xl h-9 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
        </form>

        {/* RIGHT — Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />

          {!loading && !user && guestActions}

          {user && (
            <>
              {/* Messages */}
              <button
                className="relative flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                onClick={() => navigate('/messages')}
                aria-label="Mensajes"
              >
                <MessageCircle className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button
                className="relative flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
              </button>

              {/* User avatar */}
              <button
                className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center ml-1 cursor-pointer hover:brightness-110 transition-all"
                onClick={() => navigate('/profile')}
                aria-label="Perfil"
              >
                <span className="font-bold text-xs text-primary-foreground">{initials}</span>
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
};

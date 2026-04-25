import { useState } from 'react';
import { Bell, MessageCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick: _onMenuClick }: TopBarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'MK';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/discover${searchValue.trim() ? `?q=${encodeURIComponent(searchValue.trim())}` : ''}`);
  };

  return (
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
            className="w-full bg-muted border border-border rounded-xl h-9 pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          <kbd className="absolute right-3 text-xs text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded font-mono pointer-events-none select-none">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeToggle />

        {/* Messages */}
        <button
          className="relative flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          onClick={() => navigate('/messages')}
          aria-label="Mensajes"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border border-background" />
        </button>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background" />
        </button>

        {/* User avatar */}
        <button
          className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 flex items-center justify-center ml-1 cursor-pointer hover:brightness-110 transition-all"
          onClick={() => navigate('/profile')}
          aria-label="Perfil"
        >
          <span className="font-bold text-xs text-primary-foreground">{initials}</span>
        </button>
      </div>
    </header>
  );
};

import { Bell, MessageCircle, Music, Search } from 'lucide-react';
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

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'MK';

  return (
    <header
      className={cn(
        'hidden md:flex items-center justify-between',
        'sticky top-0 z-20 h-14 px-4',
        'bg-background/95 backdrop-blur-md border-b border-border'
      )}
    >
      {/* LEFT — Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => navigate('/feed')}
      >
        <Music className="h-5 w-5 text-primary" strokeWidth={2.5} />
        <span className="font-heading font-bold text-lg text-foreground tracking-wide">
          MUSIK<span className="text-primary">EEO</span>
        </span>
      </div>

      {/* CENTER — Search bar */}
      <div
        className="bg-muted border border-border rounded-xl h-9 px-3 flex items-center gap-2 cursor-pointer w-72 hover:border-primary/30 transition-colors group"
        onClick={() => {/* TODO: open search */}}
      >
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
        <span className="text-sm text-muted-foreground flex-1">Buscar músicos, técnicos, salas...</span>
        <span className="text-xs text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded font-mono flex-shrink-0">⌘K</span>
      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-1">
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

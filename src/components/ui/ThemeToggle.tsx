import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'pills';
}

export function ThemeToggle({ className = '', size = 'md', variant = 'icon' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  // Pills variant — Sun | Moon side by side (like in the Rappi-style mockup)
  if (variant === 'pills') {
    return (
      <div className={`flex items-center bg-muted border border-border rounded-xl p-0.5 ${className}`}>
        <button
          onClick={() => isDark && toggle()}
          className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            !isDark ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Modo claro"
        >
          <Sun size={13} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => !isDark && toggle()}
          className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isDark ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Modo oscuro"
        >
          <Moon size={13} strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  // Default icon variant (single toggle button)
  const sz     = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSz = size === 'sm' ? 14 : 16;

  return (
    <button
      onClick={toggle}
      className={`
        ${sz} rounded-full flex items-center justify-center
        bg-muted border border-border
        text-muted-foreground hover:text-foreground
        hover:bg-muted/80 transition-colors
        ${className}
      `}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark
        ? <Sun  size={iconSz} strokeWidth={1.75} />
        : <Moon size={iconSz} strokeWidth={1.75} />
      }
    </button>
  );
}

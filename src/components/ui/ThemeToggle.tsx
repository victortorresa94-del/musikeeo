import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  const sz = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
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
        ? <Sun size={iconSz} strokeWidth={1.75} />
        : <Moon size={iconSz} strokeWidth={1.75} />
      }
    </button>
  );
}

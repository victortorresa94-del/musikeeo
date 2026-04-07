import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION_CONFIG, COMMON_LINKS } from '../../config/navigation';
import type { UserMode } from '../../types';

export const PanelSidebar = () => {
    const { user, userProfile, logout, loading } = useAuth();
    const location = useLocation();

    // Default to 'musician' if no profile loaded yet (safe fallback)
    const activeMode: UserMode = userProfile?.primaryMode || 'musician';

    const sidebarItems = NAVIGATION_CONFIG[activeMode] || [];

    const handleLogout = async () => {
        await logout();
    };

    const getModeColor = (mode: UserMode) => {
        switch (mode) {
            case 'musician': return 'bg-gradient-to-tr from-brand-cyan to-blue-500';
            case 'organizer': return 'bg-gradient-to-tr from-brand-lime to-green-500';
            case 'provider': return 'bg-gradient-to-tr from-purple-400 to-purple-600';
            default: return 'bg-gray-600';
        }
    };

    const getModeLabel = (mode: UserMode) => {
        switch (mode) {
            case 'musician': return 'Panel de Músico';
            case 'organizer': return 'Panel de Eventos';
            case 'provider': return 'Panel Técnico';
            default: return 'Panel';
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-r border-border w-full">
            {/* Header / Mode Indicator */}
            <div className="p-6 flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center text-black font-bold text-xl ${getModeColor(activeMode)}`}>
                    {activeMode.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <h1 className="text-foreground text-lg font-bold leading-tight tracking-tight">Musikeeo</h1>
                    <p className="text-muted-foreground text-xs font-medium uppercase min-w-[100px]">
                        {loading ? 'Cargando...' : getModeLabel(activeMode)}
                    </p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col gap-2 px-4 py-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    // Check if sub-route (but not just root panel)
                    const isSubActive = location.pathname.startsWith(item.href) && item.href !== '/panel';

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive || isSubActive
                                ? 'bg-muted border border-border text-foreground'
                                : 'text-muted-foreground hover:bg-muted border border-transparent hover:text-foreground'
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={isActive || isSubActive ? 'text-brand-yellow' : 'text-muted-foreground'}
                            />
                            <p className="text-sm font-medium">
                                {item.label}
                            </p>
                        </Link>
                    );
                })}

                <div className="h-px bg-muted my-2 mx-2" />

                {/* Common Links */}
                {COMMON_LINKS.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-muted ${location.pathname === item.href ? 'bg-muted text-foreground' : 'text-muted-foreground'
                            }`}
                    >
                        <item.icon size={20} className="text-muted-foreground" />
                        <p className="text-sm font-medium">{item.label}</p>
                    </Link>
                ))}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group">
                    <div
                        className="size-8 rounded-full bg-cover bg-center border border-border"
                        style={{
                            backgroundImage: user?.photoURL
                                ? `url(${user.photoURL})`
                                : 'linear-gradient(135deg, #ffd84d 0%, #ff9500 100%)'
                        }}
                    />
                    <div className="flex flex-col overflow-hidden flex-1">
                        <p className="text-foreground text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {user?.displayName || 'Usuario'}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="text-muted-foreground text-xs text-left hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5"
                        >
                            <LogOut size={12} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

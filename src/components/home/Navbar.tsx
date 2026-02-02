import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Zap, User, Calendar, Music, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserMode } from '../../types';
import { userService } from '../../services/userService';

// Helper to get labels
const getModeLabel = (mode: UserMode) => {
    switch (mode) {
        case 'musician': return 'Músico';
        case 'organizer': return 'Organizador';
        case 'provider': return 'Proveedor';
        default: return mode;
    }
};

export const Navbar = () => {
    const { user, userProfile, logout, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    const handleSwitchMode = async (mode: UserMode) => {
        if (!user) return;
        try {
            await userService.switchPrimaryMode(user.uid, mode);
            await refreshProfile();

            // Redirect to appropriate dashboard
            if (mode === 'musician') navigate('/panel/perfil');
            else if (mode === 'organizer') navigate('/eventos2');
            else if (mode === 'provider') navigate('/panel/servicios');

            setIsUserMenuOpen(false);
        } catch (error) {
            console.error("Failed to switch mode", error);
        }
    };

    // Define menu items based on active mode
    const getMenuItems = () => {
        const mode = userProfile?.primaryMode || 'musician';
        if (mode === 'musician') {
            return [
                { icon: User, label: 'Mi Perfil', href: '/panel/perfil' },
                { icon: Calendar, label: 'Calendario', href: '/panel/calendario' },
                { icon: Music, label: 'Multimedia', href: '/panel/multimedia' },
                { icon: Settings, label: 'Servicios', href: '/panel/servicios' },
            ];
        } else if (mode === 'organizer') {
            return [
                { icon: Calendar, label: 'Mis Eventos', href: '/eventos2' },
                { icon: Zap, label: 'Crear Evento', href: '/eventos/crear' },
            ];
        } else {
            return [
                { icon: Settings, label: 'Configuración', href: '/panel/servicios' },
            ];
        }
    };

    const userMenuItems = getMenuItems();

    return (
        <header
            className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-background/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
                {/* Logo with text */}
                <Link to="/" className="flex items-center gap-3 group">
                    <img
                        src="/logo-musikeeo.png"
                        alt="Musikeeo Logo"
                        className="h-10 w-auto transition-transform group-hover:scale-110"
                    />
                    <span className="text-xl font-bold text-white tracking-tight">Musikeeo</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/artistas" className="text-sm font-medium text-gray-300 hover:text-primary transition-colors">
                        Músicos
                    </Link>
                    <Link to="/sonido" className="text-sm font-medium text-gray-300 hover:text-primary transition-colors">
                        Proveedores
                    </Link>
                    <Link to="/eventos2" className="text-sm font-medium text-gray-300 hover:text-primary transition-colors">
                        Eventos
                    </Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        /* User is logged in - show avatar dropdown */
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <div
                                    className="w-9 h-9 rounded-full bg-cover bg-center border-2 border-primary/50"
                                    style={{
                                        backgroundImage: user.photoURL
                                            ? `url(${user.photoURL})`
                                            : 'linear-gradient(135deg, #ffd84d 0%, #ff9500 100%)'
                                    }}
                                />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-white max-w-[100px] truncate leading-none">
                                        {user.displayName?.split(' ')[0] || 'Usuario'}
                                    </span>
                                    {userProfile && (
                                        <span className="text-[10px] text-primary uppercase font-bold tracking-wide leading-none mt-1">
                                            {getModeLabel(userProfile.primaryMode)}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in">
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white font-medium truncate">{user.displayName}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>

                                    {/* Mode Switcher */}
                                    {userProfile && (
                                        <div className="px-4 py-2 border-b border-white/10">
                                            <p className="text-[10px] uppercase text-gray-500 font-bold mb-2">Cambiar Modo</p>
                                            <div className="grid grid-cols-3 gap-1">
                                                {(Object.keys(userProfile.activeModes) as UserMode[]).map((mode) => (
                                                    userProfile.activeModes[mode] ? (
                                                        <button
                                                            key={mode}
                                                            onClick={() => handleSwitchMode(mode)}
                                                            className={`text-[10px] py-1 px-2 rounded-md border transition-all ${userProfile.primaryMode === mode
                                                                ? 'bg-primary text-black border-primary font-bold'
                                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                                                                }`}
                                                        >
                                                            {getModeLabel(mode)}
                                                        </button>
                                                    ) : null
                                                ))}
                                                {/* Add 'New' button or similar here logic if wanted to enable new modes */}
                                            </div>
                                        </div>
                                    )}

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        {userMenuItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <item.icon size={18} className="text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-white/10 pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                                        >
                                            <LogOut size={18} />
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* User is not logged in - show login button */
                        <Link to="/login" className="text-sm font-bold text-white hover:text-primary transition-colors">
                            Inicia sesión
                        </Link>
                    )}

                    <Link
                        to="/rodrigo"
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-5 text-black text-sm font-bold transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(255,216,77,0.3)] hover:shadow-[0_0_25px_rgba(255,216,77,0.5)]"
                    >
                        <Zap size={16} />
                        Habla con Rodrigo
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background absolute top-20 left-0 w-full h-[calc(100vh-80px)] p-6 flex flex-col gap-6 overflow-y-auto">
                    <Link to="/artistas" className="text-2xl font-heading font-bold text-white" onClick={() => setIsMobileMenuOpen(false)}>Músicos</Link>
                    <Link to="/sonido" className="text-2xl font-heading font-bold text-white" onClick={() => setIsMobileMenuOpen(false)}>Proveedores</Link>
                    <Link to="/eventos2" className="text-2xl font-heading font-bold text-white" onClick={() => setIsMobileMenuOpen(false)}>Eventos</Link>

                    <hr className="border-white/10 my-2" />

                    {user ? (
                        <>
                            {/* Mobile User Info */}
                            <div className="flex items-center gap-3 py-2">
                                <div
                                    className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-primary/50"
                                    style={{
                                        backgroundImage: user.photoURL
                                            ? `url(${user.photoURL})`
                                            : 'linear-gradient(135deg, #ffd84d 0%, #ff9500 100%)'
                                    }}
                                />
                                <div>
                                    <p className="text-white font-bold">{user.displayName}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                    {userProfile && (
                                        <p className="text-xs text-primary font-bold mt-1 uppercase">{getModeLabel(userProfile.primaryMode)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Mode Switcher - simplified */}
                            {userProfile && (
                                <div className="flex gap-2 mb-2">
                                    {(Object.keys(userProfile.activeModes) as UserMode[]).map((mode) => (
                                        userProfile.activeModes[mode] ? (
                                            <button
                                                key={mode}
                                                onClick={() => { handleSwitchMode(mode); setIsMobileMenuOpen(false); }}
                                                className={`text-xs py-1 px-3 rounded-full border ${userProfile.primaryMode === mode
                                                    ? 'bg-primary text-black border-primary'
                                                    : 'bg-white/5 text-gray-400 border-white/10'
                                                    }`}
                                            >
                                                {getModeLabel(mode)}
                                            </button>
                                        ) : null
                                    ))}
                                </div>
                            )}

                            {/* Mobile Panel Links */}
                            {userMenuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 text-lg text-gray-300"
                                >
                                    <item.icon size={20} className="text-gray-500" />
                                    {item.label}
                                </Link>
                            ))}

                            <button
                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-3 text-lg text-red-400 mt-2"
                            >
                                <LogOut size={20} />
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-lg font-medium text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Inicia sesión</Link>
                    )}

                    <Link to="/rodrigo" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-background font-bold text-lg mt-auto" onClick={() => setIsMobileMenuOpen(false)}>
                        <Zap size={20} />
                        Habla con Rodrigo
                    </Link>
                </div>
            )}
        </header>
    );
};


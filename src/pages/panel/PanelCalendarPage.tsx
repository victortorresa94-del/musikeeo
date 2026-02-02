import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getArtistByUserId, setDayAvailability } from '../../services/artistService';
import { toLocalDateString } from '../../utils/dateUtils';
import type { Artist, DayAvailability, AvailabilityState } from '../../types';

const DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function PanelCalendarPage() {
    const { user } = useAuth();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const loadArtist = async () => {
        if (!user) return;
        try {
            const data = await getArtistByUserId(user.uid);
            setArtist(data);
        } catch (error) {
            console.error('Error loading artist:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArtist();
    }, [user]);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

        // Adjust for Monday start (0 = Sunday, 1 = Monday)
        const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const days = [];

        // Previous month days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            days.push({
                date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(currentYear, currentMonth, i),
                isCurrentMonth: true
            });
        }

        // Next month days to fill grid (42 days total commonly used for 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(currentYear, currentMonth + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    }, [currentYear, currentMonth]);
    const getDateStatus = (date: Date): DayAvailability | undefined => {
        const dateStr = toLocalDateString(date);
        return artist?.availability.find(d => d.date === dateStr);
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const handleDayClick = async (date: Date, currentStatus?: AvailabilityState) => {
        if (!artist) return;

        const dateStr = toLocalDateString(date);

        // Cycle through states: none -> available -> blocked -> none
        let newStatus: AvailabilityState = 'available';
        if (currentStatus === 'available') newStatus = 'blocked';
        else if (currentStatus === 'blocked') newStatus = 'none';
        else if (currentStatus === 'occupied') return; // Can't change occupied days

        try {
            await setDayAvailability(artist.id, dateStr, newStatus);
            // Refresh artist data
            loadArtist();
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
    };

    // Upcoming gigs (occupied days)
    const upcomingGigs = useMemo(() => {
        if (!artist) return [];
        const today = new Date().toISOString().split('T')[0];
        return artist.availability
            .filter(d => d.status === 'occupied' && d.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5);
    }, [artist]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="w-full px-6 py-8 md:px-10 border-b border-white/10 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <nav className="flex items-center text-sm text-gray-500 mb-1">
                            <span>Panel</span>
                            <ChevronRight size={16} className="mx-1" />
                            <span className="text-white">Calendario</span>
                        </nav>
                        <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Disponibilidad y Calendario</h1>
                        <p className="text-gray-500 text-base max-w-2xl">Gestiona tus fechas disponibles, bloquea días de descanso y sincroniza tus bolos.</p>
                    </div>
                    <button className="flex items-center justify-center gap-2 h-10 px-5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg transition-colors border border-white/5">
                        <RefreshCw size={18} />
                        <span>Sincronizar Google/iCal</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Calendar */}
                    <section className="xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            {/* Decorative glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    📅 {MONTHS[currentMonth]} {currentYear}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="size-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="size-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <div className="ml-4 flex rounded-lg bg-white/10 p-1">
                                        <button
                                            onClick={() => setViewMode('month')}
                                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'month' ? 'bg-background text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Mes
                                        </button>
                                        <button
                                            onClick={() => setViewMode('week')}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'week' ? 'bg-background text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Semana
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 mb-4">
                                {DAYS.map(day => (
                                    <div key={day} className="text-gray-500 text-sm font-bold text-center py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                                    const status = getDateStatus(date);
                                    const today = isToday(date);

                                    const statusStyles: Record<string, string> = {
                                        available: 'bg-primary/10 border-primary/50 hover:bg-primary/20',
                                        occupied: 'border-red-500/30 hover:border-red-500/50',
                                        blocked: 'border-red-500/30 hover:border-red-500/50',
                                        none: 'border-white/10 hover:border-white/20',
                                    };

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleDayClick(date, status?.status)}
                                            disabled={!isCurrentMonth}
                                            className={`aspect-square p-2 rounded-xl bg-background border transition-all flex flex-col items-start justify-between ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed border-transparent' : statusStyles[status?.status || 'none']
                                                } ${today ? 'ring-2 ring-primary shadow-[0_0_15px_rgba(255,216,77,0.15)]' : ''}`}
                                        >
                                            <span className={`text-sm font-medium ${status?.status === 'available' ? 'text-primary font-bold' : 'text-white'
                                                } ${today ? 'bg-primary text-black rounded-full size-6 flex items-center justify-center -mt-1 -ml-1' : ''}`}>
                                                {date.getDate()}
                                            </span>

                                            {status?.status === 'available' && (
                                                <div className="w-full bg-primary text-black text-[9px] font-bold px-1 py-0.5 rounded truncate">
                                                    Disponible
                                                </div>
                                            )}
                                            {status?.status === 'occupied' && (
                                                <div className="w-full bg-red-500/20 text-red-400 text-[9px] font-bold px-1 py-0.5 rounded truncate">
                                                    {status.eventName || 'Ocupado'}
                                                </div>
                                            )}
                                            {status?.status === 'blocked' && (
                                                <div className="w-full bg-red-500/20 text-red-400 text-[9px] font-bold px-1 py-0.5 rounded truncate">
                                                    Bloqueado
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-6 border-t border-white/10 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-primary" />
                                    <span className="text-sm text-gray-500">Disponible</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-red-500" />
                                    <span className="text-sm text-gray-500">Ocupado / Bloqueado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full border border-white/20 bg-background" />
                                    <span className="text-sm text-gray-500">Sin estado</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sidebar: Upcoming Gigs */}
                    <aside className="xl:col-span-4 flex flex-col gap-6">
                        <div className="bg-surface border border-white/10 rounded-2xl p-6 h-full shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Próximos Bolos</h3>
                                <button className="text-xs text-primary font-medium hover:underline">Ver todo</button>
                            </div>

                            {/* Events List */}
                            <div className="flex flex-col gap-4">
                                {upcomingGigs.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">No tienes bolos próximos</p>
                                ) : (
                                    upcomingGigs.map((gig) => {
                                        const date = new Date(gig.date);
                                        return (
                                            <div key={gig.date} className="group flex flex-col gap-3 p-4 rounded-xl bg-background border border-white/10 hover:border-primary/50 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-white/5 rounded-lg border border-white/10">
                                                        <span className="text-xs font-bold text-primary uppercase">
                                                            {MONTHS[date.getMonth()].slice(0, 3)}
                                                        </span>
                                                        <span className="text-lg font-black text-white">{date.getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold leading-tight">{gig.eventName || 'Evento'}</h4>
                                                        <p className="text-gray-500 text-xs mt-1">Fecha confirmada</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Promo Box */}
                            <div className="mt-auto pt-6">
                                <div className="rounded-xl bg-gradient-to-r from-white/10 to-white/5 p-4 border border-white/5 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-white font-bold text-sm mb-1">¡Consigue más bolos!</p>
                                        <p className="text-gray-500 text-xs mb-3">Mantén tu calendario actualizado para aparecer en más búsquedas.</p>
                                    </div>
                                    <span className="absolute -right-2 -bottom-2 text-6xl opacity-10">🚀</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* FAB */}
            <div className="fixed bottom-8 right-8 z-50">
                <button className="flex items-center gap-3 bg-primary hover:bg-primary-hover text-black px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgba(255,216,77,0.3)] hover:shadow-[0_8px_35px_rgba(255,216,77,0.4)] transition-all transform hover:-translate-y-1 font-bold text-base">
                    <Plus size={20} />
                    <span>Añadir Fecha de Bloqueo</span>
                </button>
            </div>
        </div>
    );
}

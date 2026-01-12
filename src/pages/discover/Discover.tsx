import { useState } from 'react';
import { Search, MapPin, Users, Music, Mic2, Star, SlidersHorizontal, X, Check } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DISCOVER_MUSICIANS,
    DISCOVER_BANDS,
    DISCOVER_TECHNICIANS,
    CITIES,
    GENRES,
    ROLES,
    TECH_ROLES
} from '../../services/discoverData';

const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Users },
    { id: 'musicians', label: 'Músicos', icon: Music },
    { id: 'bands', label: 'Bandas', icon: Users },
    { id: 'technicians', label: 'Técnicos', icon: Mic2 },
];

export default function Discover() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [onlyVerified, setOnlyVerified] = useState(false);

    // Toggle functions
    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const clearFilters = () => {
        setSelectedCity(null);
        setSelectedGenres([]);
        setSelectedRoles([]);
        setOnlyAvailable(false);
        setOnlyVerified(false);
    };

    const activeFiltersCount = (selectedCity ? 1 : 0) + selectedGenres.length + selectedRoles.length + (onlyAvailable ? 1 : 0) + (onlyVerified ? 1 : 0);

    // Filter musicians
    const filteredMusicians = DISCOVER_MUSICIANS.filter(m => {
        if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !m.role.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !m.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
        if (selectedCity && m.city !== selectedCity) return false;
        if (selectedGenres.length > 0 && !m.genres.some(g => selectedGenres.includes(g))) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(m.role)) return false;
        if (onlyAvailable && !m.available) return false;
        if (onlyVerified && !m.verified) return false;
        return true;
    });

    // Filter bands
    const filteredBands = DISCOVER_BANDS.filter(b => {
        if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !b.genre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (selectedCity && b.city !== selectedCity) return false;
        if (selectedGenres.length > 0 && !b.genres.some(g => selectedGenres.includes(g))) return false;
        if (onlyAvailable && !b.available) return false;
        if (onlyVerified && !b.verified) return false;
        return true;
    });

    // Filter technicians
    const filteredTechnicians = DISCOVER_TECHNICIANS.filter(t => {
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !t.role.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (selectedCity && t.city !== selectedCity) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(t.role)) return false;
        if (onlyAvailable && !t.available) return false;
        if (onlyVerified && !t.verified) return false;
        return true;
    });

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Descubrir</h1>
                    <p className="text-muted-foreground">Encuentra músicos, bandas y técnicos para tu proyecto.</p>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, instrumento, género..."
                            className="pl-10 bg-white/5 border-white/10 h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-11 w-11 border-white/10 hover:bg-white/5 relative",
                            showFilters && "bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan"
                        )}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-brand-cyan text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-white">Filtros</h3>
                                    {activeFiltersCount > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-white">
                                            <X className="h-4 w-4 mr-1" /> Limpiar filtros
                                        </Button>
                                    )}
                                </div>

                                {/* City Filter */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Ciudad</p>
                                    <div className="flex flex-wrap gap-2">
                                        {CITIES.map(city => (
                                            <Button
                                                key={city}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                                                className={cn(
                                                    "rounded-full text-xs",
                                                    selectedCity === city
                                                        ? "bg-brand-cyan text-black border-brand-cyan"
                                                        : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                                                )}
                                            >
                                                {city}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Genre Filter */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Género Musical</p>
                                    <div className="flex flex-wrap gap-2">
                                        {GENRES.map(genre => (
                                            <Button
                                                key={genre}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleGenre(genre)}
                                                className={cn(
                                                    "rounded-full text-xs",
                                                    selectedGenres.includes(genre)
                                                        ? "bg-purple-500 text-white border-purple-500"
                                                        : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                                                )}
                                            >
                                                {genre}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Filter */}
                                {(activeCategory === 'all' || activeCategory === 'musicians' || activeCategory === 'technicians') && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Rol / Instrumento</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(activeCategory === 'technicians' ? TECH_ROLES : ROLES).map(role => (
                                                <Button
                                                    key={role}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleRole(role)}
                                                    className={cn(
                                                        "rounded-full text-xs",
                                                        selectedRoles.includes(role)
                                                            ? "bg-brand-lime text-black border-brand-lime"
                                                            : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                                                    )}
                                                >
                                                    {role}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Toggle Filters */}
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div
                                            className={cn(
                                                "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                                onlyAvailable ? "bg-brand-lime border-brand-lime" : "border-white/20 bg-white/5"
                                            )}
                                            onClick={() => setOnlyAvailable(!onlyAvailable)}
                                        >
                                            {onlyAvailable && <Check className="h-3 w-3 text-black" />}
                                        </div>
                                        <span className="text-sm text-white">Solo disponibles</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div
                                            className={cn(
                                                "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                                onlyVerified ? "bg-brand-cyan border-brand-cyan" : "border-white/20 bg-white/5"
                                            )}
                                            onClick={() => setOnlyVerified(!onlyVerified)}
                                        >
                                            {onlyVerified && <Check className="h-3 w-3 text-black" />}
                                        </div>
                                        <span className="text-sm text-white">Solo verificados (PRO)</span>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.id ? 'glow' : 'outline'}
                            size="sm"
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "rounded-full px-4 gap-2",
                                activeCategory !== cat.id && 'border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white'
                            )}
                        >
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                        </Button>
                    ))}
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                    {activeCategory === 'all' && `${filteredMusicians.length + filteredBands.length + filteredTechnicians.length} resultados`}
                    {activeCategory === 'musicians' && `${filteredMusicians.length} músicos`}
                    {activeCategory === 'bands' && `${filteredBands.length} bandas`}
                    {activeCategory === 'technicians' && `${filteredTechnicians.length} técnicos`}
                </div>
            </div>

            {/* Musicians Section */}
            {(activeCategory === 'all' || activeCategory === 'musicians') && filteredMusicians.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                            <Music className="h-5 w-5 text-brand-cyan" /> Músicos
                            <span className="text-sm font-normal text-muted-foreground">({filteredMusicians.length})</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredMusicians.slice(0, activeCategory === 'musicians' ? 100 : 8).map((musician) => (
                            <motion.div
                                key={musician.id}
                                whileHover={{ y: -5 }}
                                className="cursor-pointer"
                                onClick={() => navigate(`/profile/${musician.id}`)}
                            >
                                <Card className="bg-card border-white/5 hover:border-brand-cyan/50 transition-all overflow-hidden">
                                    <div className="relative">
                                        <div className="aspect-square bg-zinc-900">
                                            <img src={musician.photoURL} alt={musician.name} className="w-full h-full object-cover" />
                                        </div>
                                        {musician.available && (
                                            <div className="absolute top-2 right-2 bg-brand-lime text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                Disponible
                                            </div>
                                        )}
                                        {musician.verified && (
                                            <div className="absolute top-2 left-2 bg-brand-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                PRO
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-bold text-white text-sm truncate">{musician.name}</h3>
                                        <p className="text-xs text-brand-cyan mb-2">{musician.role}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {musician.city}
                                            </span>
                                            <span className="text-[10px] text-brand-lime flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-current" /> {musician.rating}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    {activeCategory === 'all' && filteredMusicians.length > 8 && (
                        <Button variant="outline" className="w-full border-white/10" onClick={() => setActiveCategory('musicians')}>
                            Ver todos los músicos ({filteredMusicians.length})
                        </Button>
                    )}
                </section>
            )}

            {/* Bands Section */}
            {(activeCategory === 'all' || activeCategory === 'bands') && filteredBands.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-400" /> Bandas y Grupos
                            <span className="text-sm font-normal text-muted-foreground">({filteredBands.length})</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredBands.slice(0, activeCategory === 'bands' ? 100 : 4).map((band) => (
                            <Card
                                key={band.id}
                                className="bg-card border-white/5 hover:border-purple-400/50 transition-all overflow-hidden cursor-pointer group"
                                onClick={() => navigate(`/profile/${band.id}`)}
                            >
                                <div className="flex">
                                    <div className="w-32 h-32 bg-zinc-900 shrink-0 overflow-hidden">
                                        <img src={band.coverImage} alt={band.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <CardContent className="p-4 flex flex-col justify-between flex-1">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white">{band.name}</h3>
                                                {band.verified && (
                                                    <Badge variant="secondary" className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">Verificado</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{band.genre}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {band.members} miembros
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {band.city}
                                            </span>
                                            <span className="flex items-center gap-1 text-brand-lime">
                                                <Star className="h-3 w-3 fill-current" /> {band.rating}
                                            </span>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {activeCategory === 'all' && filteredBands.length > 4 && (
                        <Button variant="outline" className="w-full border-white/10" onClick={() => setActiveCategory('bands')}>
                            Ver todas las bandas ({filteredBands.length})
                        </Button>
                    )}
                </section>
            )}

            {/* Technicians Section */}
            {(activeCategory === 'all' || activeCategory === 'technicians') && filteredTechnicians.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                            <Mic2 className="h-5 w-5 text-orange-400" /> Técnicos y Profesionales
                            <span className="text-sm font-normal text-muted-foreground">({filteredTechnicians.length})</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredTechnicians.slice(0, activeCategory === 'technicians' ? 100 : 6).map((tech) => (
                            <Card
                                key={tech.id}
                                className="bg-card border-white/5 hover:border-orange-400/50 transition-all overflow-hidden cursor-pointer"
                                onClick={() => navigate(`/profile/${tech.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                            <img src={tech.photoURL} alt={tech.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-sm truncate">{tech.name}</h3>
                                                {tech.verified && (
                                                    <span className="bg-orange-500/20 text-orange-300 text-[10px] px-1.5 py-0.5 rounded">PRO</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-orange-400">{tech.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tech.specialties.slice(0, 3).map(s => (
                                            <span key={s} className="bg-white/5 text-white/70 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {tech.city}
                                        </span>
                                        <span className="flex items-center gap-1 text-brand-lime">
                                            <Star className="h-3 w-3 fill-current" /> {tech.rating}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {activeCategory === 'all' && filteredTechnicians.length > 6 && (
                        <Button variant="outline" className="w-full border-white/10" onClick={() => setActiveCategory('technicians')}>
                            Ver todos los técnicos ({filteredTechnicians.length})
                        </Button>
                    )}
                </section>
            )}

            {/* No Results */}
            {filteredMusicians.length === 0 && filteredBands.length === 0 && filteredTechnicians.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No se encontraron resultados con los filtros actuales.</p>
                    <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Speaker, Store, Crown, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

const ROLES = [
    {
        id: 'musician',
        title: 'Músico',
        icon: Mic,
        description: 'Busco bolos, bandas o colaboraciones.',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/10',
        border: 'border-brand-cyan/20'
    },
    {
        id: 'technician',
        title: 'Técnico',
        icon: Speaker,
        description: 'Ofrezco sonido, luces o servicios de stage.',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    },
    {
        id: 'venue',
        title: 'Promotor / Sala',
        icon: Crown,
        description: 'Organizo eventos y busco talento.',
        color: 'text-brand-lime',
        bg: 'bg-brand-lime/10',
        border: 'border-brand-lime/20'
    },
    {
        id: 'store',
        title: 'Tienda / Luthier',
        icon: Store,
        description: 'Vendo equipo o reparo instrumentos.',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    }
];

export const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [location, setLocation] = useState('');
    const [genres, setGenres] = useState<string[]>([]);

    // AI Mock State
    const [aiTyping, setAiTyping] = useState(false);
    const [aiMessage, setAiMessage] = useState('');

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setAiTyping(true);
        setTimeout(() => {
            setAiTyping(false);
            if (roleId === 'musician') setAiMessage("¡Genial! 🎸 Musikeeo te ayudará a encontrar bolos. ¿Qué tocas?");
            if (roleId === 'venue') setAiMessage("Perfecto 🎟️. Te conectaremos con músicos locales para llenar tu agenda.");
            setStep(2);
        }, 1500);
    };

    const handleFinish = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Brand Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <img src="/logo-musikeeo.png" alt="M" className="h-16 w-auto mx-auto mb-4" />
                    <h1 className="text-3xl font-heading font-bold text-white mb-2">Bienvenido a Musikeeo</h1>
                    <p className="text-muted-foreground">Configura tu perfil para empezar a conectar.</p>
                </motion.div>

                {/* AI Bubble */}
                <AnimatePresence>
                    {(aiTyping || aiMessage) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-brand-petrol/20 border border-brand-cyan/30 rounded-2xl p-4 mb-8 flex items-start gap-3 backdrop-blur-sm"
                        >
                            <div className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center shrink-0">
                                {aiTyping ? (
                                    <span className="flex gap-1">
                                        <span className="h-1 w-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="h-1 w-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="h-1 w-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                ) : (
                                    <span className="text-black font-bold text-xs">AI</span>
                                )}
                            </div>
                            <p className="text-sm text-brand-cyan pt-1.5">
                                {aiTyping ? "Analizando perfil..." : aiMessage}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Steps */}
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {ROLES.map((role) => (
                                <Card
                                    key={role.id}
                                    className={`cursor-pointer hover:bg-white/5 transition-all duration-300 border-white/5 hover:border-white/10 group ${selectedRole === role.id ? 'ring-2 ring-brand-cyan' : ''}`}
                                    onClick={() => handleRoleSelect(role.id)}
                                >
                                    <div className="p-6 flex flex-col items-center text-center gap-4">
                                        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${role.bg} ${role.color} group-hover:scale-110 transition-transform`}>
                                            <role.icon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-lg text-white mb-1">{role.title}</h3>
                                            <p className="text-sm text-muted-foreground">{role.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">¿Dónde estás ubicado?</label>
                                        <Input
                                            placeholder="Madrid, Barcelona, Sevilla..."
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Tus Géneros (Max 3)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Rock', 'Jazz', 'Pop', 'Techno', 'Flamenco', 'Indie'].map((genre) => (
                                                <button
                                                    key={genre}
                                                    onClick={() => {
                                                        if (genres.includes(genre)) setGenres(genres.filter(g => g !== genre));
                                                        else if (genres.length < 3) setGenres([...genres, genre]);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${genres.includes(genre)
                                                        ? 'bg-brand-lime text-black shadow-[0_0_10px_rgba(130,255,31,0.3)]'
                                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                                        }`}
                                                >
                                                    {genre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button className="w-full" size="lg" onClick={handleFinish} variant="glow">
                                        Completar Perfil <Check className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                            <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-muted-foreground">
                                Volver atrás
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default Onboarding;

import { useState, useRef, useEffect } from 'react';
import { Zap, Search, Calendar, Users, BarChart3, Sparkles, ArrowRight, ArrowUp, Music, Mic, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../../components/home/Navbar';
import { Footer } from '../../components/layout/Footer';
import {
    generateResponse,
    createInitialState,
    RODRIGO_INITIAL_MESSAGE
} from '../../lib/rodrigoEngine';
import type { ConversationState, ParsedResponse } from '../../lib/rodrigoEngine';
import { ArtistRecommendations, BoloRecommendations } from '../../components/rodrigo/ArtistRecommendation';

const RODRIGO_AVATAR = '/rodrigo-persona.png';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    parsedContent?: ParsedResponse;
}

export default function RodrigoPage() {
    const [chatOpen, setChatOpen] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState>(createInitialState());
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: RODRIGO_INITIAL_MESSAGE,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Generate response using DeepSeek
            const { response, newState } = await generateResponse(content, conversationState);
            setConversationState(newState);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: new Date(),
                parsedContent: response,
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Perdona, he tenido un problema técnico. ¿Puedes repetirme qué necesitas?',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const features = [
        {
            icon: Search,
            title: 'Encuentra Músicos',
            description: 'Descubre artistas curados que encajan perfectamente con tu estilo y evento.',
        },
        {
            icon: Calendar,
            title: 'Crea Eventos',
            description: 'Genera anuncios optimizados con IA para atraer el mejor talento.',
        },
        {
            icon: Users,
            title: 'Matching Inteligente',
            description: 'Rodrigo Score: evalúa postulantes y recomienda los mejores candidatos.',
        },
        {
            icon: BarChart3,
            title: 'Optimiza tu Perfil',
            description: 'Análisis de tu perfil con sugerencias para mejorar tu visibilidad.',
        },
    ];

    const quickPrompts = [
        { icon: Music, text: 'Necesito un cuarteto de jazz' },
        { icon: Sparkles, text: 'Presupuesto para 200 personas' },
        { icon: Search, text: '¿Qué equipo para un DJ?' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Main Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,208,56,0.08)_0%,transparent_50%)]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            {/* Status Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full bg-muted border border-border py-1.5 px-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                                <span className="text-xs font-medium text-primary uppercase tracking-wider">Rodrigo AI Online</span>
                            </div>

                            {/* Title */}
                            <div className="space-y-4">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                    Hola, soy Rodrigo.
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-foreground">
                                        Tu experto en música en vivo.
                                    </span>
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                                    Organiza, reserva y gestiona tus eventos de música en vivo en segundos.
                                    Desde la logística hasta el rider técnico, yo me encargo de todo.
                                </p>
                            </div>

                            {/* Quick Prompts */}
                            <div className="flex flex-wrap gap-3">
                                {quickPrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setChatOpen(true)}
                                        className="group flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 hover:border-primary/40 hover:text-primary transition-colors"
                                    >
                                        <prompt.icon size={16} className="text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{prompt.text}</span>
                                    </button>
                                ))}
                            </div>

                            {/* CTA */}
                            <Button
                                onClick={() => setChatOpen(true)}
                                size="lg"
                                className="h-14 px-8 bg-primary text-primary-foreground font-bold text-base hover:brightness-105 transition-all transform hover:-translate-y-0.5"
                            >
                                <Zap className="mr-2" size={20} />
                                Empieza a hablar conmigo
                            </Button>
                        </motion.div>

                        {/* Right - Avatar Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative flex justify-center"
                        >
                            <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden border border-border shadow-2xl bg-muted group">
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 z-10" />
                                <img
                                    src={RODRIGO_AVATAR}
                                    alt="Rodrigo AI Assistant"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Status Card Overlay */}
                                <div className="absolute bottom-6 left-6 right-6 z-20 bg-muted backdrop-blur-md border border-border rounded-xl p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-primary/10 border border-border flex items-center justify-center text-primary shrink-0">
                                        <Music size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Status</p>
                                        <p className="text-sm font-medium text-white">Buscando bandas disponibles...</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Cómo puedo ayudarte</h2>
                            <p className="text-muted-foreground">Tu asistente integral para eventos inolvidables.</p>
                        </div>
                        <a href="/eventos2" className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            Ver todas las funciones <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="group relative rounded-xl bg-muted border border-border p-6 hover:border-primary/40 transition-colors"
                            >
                                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Cómo aprende Rodrigo</h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        Analizo tus búsquedas, tus anuncios y tu perfil musical para ofrecerte las mejores coincidencias.
                        <br />
                        <span className="text-primary">Nunca comparto tus datos fuera de Musikeeo.</span>
                    </p>
                    <Button
                        onClick={() => setChatOpen(true)}
                        size="lg"
                        className="bg-primary text-primary-foreground font-bold hover:brightness-105"
                    >
                        Habla con Rodrigo ahora <Zap className="ml-2" size={18} />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <Footer />

            {/* Floating Chat Button */}
            <button
                onClick={() => setChatOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 overflow-hidden border-2 border-primary"
            >
                <img src={RODRIGO_AVATAR} alt="Rodrigo" className="w-full h-full object-cover" />
            </button>

            {/* Functional Chat Modal */}
            <AnimatePresence>
                {chatOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 p-4 bg-background/95 backdrop-blur border-b border-border">
                                <div className="relative">
                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-border overflow-hidden shrink-0">
                                        <img src={RODRIGO_AVATAR} alt="Rodrigo" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-background" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-foreground">Rodrigo</h3>
                                    <p className="text-xs text-muted-foreground">AI Assistant</p>
                                </div>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                        {message.role === 'assistant' && (
                                            <div
                                                className="size-8 rounded-full bg-cover bg-center shrink-0 border border-border overflow-hidden"
                                                style={{ backgroundImage: `url(${RODRIGO_AVATAR})` }}
                                            />
                                        )}
                                        <div className="max-w-[85%]">
                                            <div className={`px-4 py-3 rounded-2xl text-sm ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm ml-auto'
                                                : 'bg-muted text-foreground rounded-tl-sm border border-border'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>

                                            {/* Artist Recommendations */}
                                            {message.parsedContent?.artists && message.parsedContent.artists.length > 0 && (
                                                <ArtistRecommendations artists={message.parsedContent.artists} />
                                            )}

                                            {/* Bolo Opportunities */}
                                            {message.parsedContent?.bolos && message.parsedContent.bolos.length > 0 && (
                                                <BoloRecommendations bolos={message.parsedContent.bolos} />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex gap-3">
                                        <div
                                            className="size-8 rounded-full bg-cover bg-center shrink-0 border border-border overflow-hidden"
                                            style={{ backgroundImage: `url(${RODRIGO_AVATAR})` }}
                                        />
                                        <div className="flex items-center gap-1.5 px-4 py-3 bg-muted rounded-2xl rounded-bl-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-border bg-background">
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1 bg-muted border border-border rounded-xl flex items-center focus-within:border-primary/40 transition-colors">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Escríbele a Rodrigo..."
                                            className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                                            disabled={isTyping}
                                        />
                                        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
                                            <Mic size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => sendMessage(input)}
                                        disabled={isTyping || !input.trim()}
                                        className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:brightness-105 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUp size={20} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center mt-2">
                                    Rodrigo AI puede cometer errores. Verifica la información importante.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { MapPin, Plus, Mic, Sparkles, X, Music, Users } from 'lucide-react';

export default function Events() {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [transcript, setTranscript] = useState("");

    const handleMicClick = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            // Simulate voice recognition
            setTimeout(() => {
                setTranscript("Busco una banda de Jazz para tocar este viernes en Gràcia, presupuesto 200 euros.");
                setIsRecording(false);
                setWizardStep(2);
            }, 2000);
        }
    };

    return (
        <div className="min-h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Eventos & Gigs</h1>
                    <p className="text-muted-foreground">Gestiona tu agenda y crea nuevas oportunidades.</p>
                </div>
                <Button onClick={() => setIsWizardOpen(true)} className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold shadow-[0_0_15px_rgba(130,255,31,0.4)]">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Evento IA
                </Button>
            </div>

            {/* AI Wizard Modal (Overlay) */}
            <AnimatePresence>
                {isWizardOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-card border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                                onClick={() => { setIsWizardOpen(false); setWizardStep(1); setTranscript(""); }}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <div className="p-8 pb-0 text-center">
                                <div className="h-12 w-12 bg-brand-lime/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-lime/20">
                                    <Sparkles className="h-6 w-6 text-brand-lime" />
                                </div>
                                <h2 className="text-2xl font-heading font-bold text-white">Asistente de Eventos</h2>
                                <p className="text-sm text-muted-foreground mt-2">Cuéntame qué necesitas y lo organizaré por ti.</p>
                            </div>

                            <div className="p-8 space-y-6">
                                {wizardStep === 1 && (
                                    <div className="flex flex-col items-center gap-6">
                                        <button
                                            onClick={handleMicClick}
                                            className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20'}`}
                                        >
                                            <Mic className={`h-10 w-10 ${isRecording ? 'text-white' : 'text-muted-foreground'}`} />
                                        </button>
                                        <p className="text-sm text-muted-foreground">
                                            {isRecording ? "Escuchando..." : "Pulsa para hablar o escribe abajo"}
                                        </p>
                                        <Input
                                            placeholder="Ej: Necesito un bajista para el sábado..."
                                            className="bg-black/20"
                                            value={transcript}
                                            onChange={(e) => setTranscript(e.target.value)}
                                        />
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-white">Concierto de Jazz</h3>
                                                    <p className="text-xs text-brand-cyan">Viernes, 14 Abr • 22:00h</p>
                                                </div>
                                                <span className="bg-brand-lime text-black text-[10px] font-bold px-2 py-1 rounded">Borrador</span>
                                            </div>
                                            <div className="flex gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4 text-brand-cyan" /> Gràcia, Barcelona
                                            </div>
                                            <div className="flex gap-2 text-sm text-muted-foreground">
                                                <Music className="h-4 w-4 text-purple-400" /> Se busca: Banda Completa
                                            </div>
                                            <div className="flex gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4 text-orange-400" /> Presupuesto: 200€
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button variant="outline" className="flex-1" onClick={() => setWizardStep(1)}>Editar</Button>
                                            <Button className="flex-1 bg-brand-cyan text-white hover:bg-brand-cyan/90 border-none" onClick={() => setIsWizardOpen(false)}>Publicar</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="bg-card border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                        <div className="h-40 bg-zinc-900 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                            <img
                                src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=800&q=80`}
                                alt="Event"
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute bottom-3 left-4 z-20">
                                <span className="text-[10px] font-bold text-brand-lime uppercase tracking-wider mb-1 block">Live Music</span>
                                <h3 className="text-white font-bold leading-tight">Jam Session Abierta</h3>
                            </div>
                            <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                                24 MAR
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-brand-cyan" />
                                <span className="truncate">Sala Bóveda, Barcelona</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(u => (
                                        <div key={u} className="h-6 w-6 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[10px] text-white">
                                            {u}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-brand-cyan hover:underline">Ver detalles</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

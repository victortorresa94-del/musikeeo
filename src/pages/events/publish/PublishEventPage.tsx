import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Step1Details from './steps/Step1Details';
import Step2Talent from './steps/Step2Talent';
import Step3Review from './steps/Step3Review';
import RodrigoAdvisor from './components/RodrigoAdvisor';

export type PublishEventState = {
    // Step 1
    title: string;
    type: string;
    date: string;
    startTime: string;
    location: string;
    lat?: number;
    lng?: number;

    // Step 2
    artistType: string[];
    budget: number;
    currency: 'MXN' | 'EUR' | 'USD';
    negotiable: boolean;
    description: string;
    image?: string; // URL mock

    // Metadata
    step: number;
};

const INITIAL_STATE: PublishEventState = {
    title: '',
    type: '',
    date: '',
    startTime: '',
    location: '',
    artistType: [],
    budget: 0,
    currency: 'MXN',
    negotiable: false,
    description: '',
    step: 1
};

export default function PublishEventPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PublishEventState>(() => {
        const saved = localStorage.getItem('musikeeo_event_draft');
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem('musikeeo_event_draft', JSON.stringify(formData));
    }, [formData]);

    const updateField = (field: keyof PublishEventState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (formData.step < 3) updateField('step', formData.step + 1);
    };

    const prevStep = () => {
        if (formData.step > 1) updateField('step', formData.step - 1);
        else navigate('/eventos2');
    };

    const handlePublish = async () => {
        // Mock API Call
        console.log('Publishing event...', formData);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Clear draft
        localStorage.removeItem('musikeeo_event_draft');

        // Navigate to success or back to board
        navigate('/eventos2');
    };

    return (
        <div className="min-h-screen bg-brand-black text-white flex flex-col">
            {/* Simple Top Bar */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-brand-black/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={prevStep} className="text-gray-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Atrás</span>
                    </Button>
                    <div className="h-6 w-px bg-white/10" />
                    <span className="font-bold text-lg tracking-tight">Publicar Nuevo Bolo</span>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-2 w-12 rounded-full transition-all duration-300 ${s <= formData.step ? 'bg-brand-yellow' : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-6 gap-8">

                {/* Main Form Area */}
                <div className="flex-1 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-6">
                        <h1 className="text-3xl font-heading font-bold mb-2">
                            {formData.step === 1 && "Detalles del Evento"}
                            {formData.step === 2 && "Talento y Presupuesto"}
                            {formData.step === 3 && "Revisión Final"}
                        </h1>
                        <p className="text-gray-400">
                            {formData.step === 1 && "Comencemos con la información básica de tu convocatoria."}
                            {formData.step === 2 && "Define qué tipo de artista buscas y cuál es tu oferta."}
                            {formData.step === 3 && "Revisa que todo esté correcto antes de lanzar tu anuncio."}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={formData.step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {formData.step === 1 && (
                                <Step1Details data={formData} update={updateField} onNext={nextStep} />
                            )}
                            {formData.step === 2 && (
                                <Step2Talent data={formData} update={updateField} onNext={nextStep} onPrev={prevStep} />
                            )}
                            {formData.step === 3 && (
                                <Step3Review data={formData} onPublish={handlePublish} onPrev={prevStep} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Rodrigo AI Sidebar - Always visible but contextual */}
                <aside className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-24">
                        <RodrigoAdvisor step={formData.step} data={formData} update={updateField} />
                    </div>
                </aside>

            </main>
        </div>
    );
}

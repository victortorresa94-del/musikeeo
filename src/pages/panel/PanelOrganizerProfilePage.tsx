import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOrganizerByUserId, updateOrganizer, createOrganizer } from '../../services/organizerService';
import type { EventCreatorProfile } from '../../types';

export default function PanelOrganizerProfilePage() {
    const { user } = useAuth();
    const [organizer, setOrganizer] = useState<EventCreatorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        loadOrganizerProfile();
    }, [user]);

    const loadOrganizerProfile = async () => {
        if (!user) return;

        try {
            let data = await getOrganizerByUserId(user.uid);

            // If no profile exists, create one
            if (!data) {
                data = await createOrganizer(user.uid, {
                    displayName: user.displayName || 'Nuevo Organizador',
                });
            }

            setOrganizer(data);
            setDisplayName(data.displayName || '');
            setCompanyName(data.companyName || '');
            setIsPublic(data.isPublic || false);
        } catch (error) {
            console.error('Error loading organizer profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!organizer) return;

        setSaving(true);
        try {
            const updates: Partial<EventCreatorProfile> = {
                displayName,
                companyName,
                isPublic,
            };

            await updateOrganizer(organizer.id, updates);
            setOrganizer({ ...organizer, ...updates });
            setHasChanges(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (organizer) {
            setDisplayName(organizer.displayName || '');
            setCompanyName(organizer.companyName || '');
            setIsPublic(organizer.isPublic || false);
            setHasChanges(false);
        }
    };

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
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Perfil de Organizador</h2>
                    <p className="text-muted-foreground text-sm mt-1">Gestiona tu identidad como creador de eventos.</p>
                </div>

                {/* Public View Toggle */}
                <div className="flex items-center gap-4 bg-card border border-border rounded-full px-4 py-2">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Perfil Público</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => { setIsPublic(e.target.checked); setHasChanges(true); }}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-24">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-6">
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <h3 className="text-foreground text-lg font-bold mb-6 flex items-center gap-2">
                                🏢 Información de la Organización
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-foreground text-sm font-medium">Nombre Público (Display Name)</span>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => { setDisplayName(e.target.value); setHasChanges(true); }}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground"
                                        placeholder="Tu nombre o alias"
                                    />
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-foreground text-sm font-medium">Nombre de la Empresa / Organización</span>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => { setCompanyName(e.target.value); setHasChanges(true); }}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground"
                                        placeholder="Ej. Eventos Madrid S.L."
                                    />
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Floating Action Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 md:left-[280px] right-0 p-4 bg-background border-t border-border flex justify-between items-center z-30">
                    <p className="text-muted-foreground text-sm hidden sm:block">Tienes cambios sin guardar</p>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleDiscard}
                            className="px-6 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-card transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(130,255,31,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 ${showSuccess
                                    ? 'bg-green-500 text-foreground hover:bg-green-600'
                                    : 'bg-primary text-black hover:bg-primary/90'
                                }`}
                        >
                            {showSuccess ? <Check size={16} /> : <Save size={16} />}
                            {saving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

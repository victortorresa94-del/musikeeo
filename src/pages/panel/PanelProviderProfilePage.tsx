import { useState, useEffect } from 'react';
import { Save, Briefcase, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProviderByUserId, updateProvider, createProvider } from '../../services/providerService';
import type { ProviderProfile } from '../../types';

export default function PanelProviderProfilePage() {
    const { user } = useAuth();
    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState('');
    const [providerType, setProviderType] = useState<'freelance' | 'empresa'>('freelance');
    const [servicesText, setServicesText] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        loadProviderProfile();
    }, [user]);

    const loadProviderProfile = async () => {
        if (!user) return;

        try {
            let data = await getProviderByUserId(user.uid);

            // If no profile exists, create one
            if (!data) {
                data = await createProvider(user.uid, {
                    businessName: user.displayName || 'Nuevo Proveedor',
                });
            }

            setProvider(data);
            setBusinessName(data.businessName || '');
            setProviderType(data.providerType || 'freelance');
            setServicesText(data.services ? data.services.join(', ') : '');
            setIsPublic(data.isPublic || false);
        } catch (error) {
            console.error('Error loading provider profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!provider) return;

        setSaving(true);
        try {
            const updates: Partial<ProviderProfile> = {
                businessName,
                providerType,
                services: servicesText.split(',').map(s => s.trim()).filter(Boolean),
                isPublic,
            };

            await updateProvider(provider.id, updates);
            setProvider({ ...provider, ...updates });
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (provider) {
            setBusinessName(provider.businessName || '');
            setProviderType(provider.providerType || 'freelance');
            setServicesText(provider.services ? provider.services.join(', ') : '');
            setIsPublic(provider.isPublic || false);
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
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/10 px-6 py-4 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Perfil Técnico / Servicios</h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona tu oferta de servicios y equipamiento.</p>
                </div>

                {/* Public View Toggle */}
                <div className="flex items-center gap-4 bg-surface border border-white/10 rounded-full px-4 py-2">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Perfil Público</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => { setIsPublic(e.target.checked); setHasChanges(true); }}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-24">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-6">
                        <div className="bg-surface rounded-xl p-6 border border-white/10 shadow-sm">
                            <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                                <Briefcase className="text-purple-400" size={24} /> Información del Negocio
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-white text-sm font-medium">Nombre del Negocio / Profesional</span>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => { setBusinessName(e.target.value); setHasChanges(true); }}
                                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-gray-600"
                                        placeholder="Tu nombre o marca comercial"
                                    />
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-white text-sm font-medium">Tipo de Perfil</span>
                                        <select
                                            value={providerType}
                                            onChange={(e) => { setProviderType(e.target.value as any); setHasChanges(true); }}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                        >
                                            <option value="freelance">Freelance / Autónomo</option>
                                            <option value="empresa">Empresa / S.L.</option>
                                        </select>
                                    </label>
                                </div>

                                <label className="flex flex-col gap-2">
                                    <span className="text-white text-sm font-medium">Servicios Ofrecidos (separados por coma)</span>
                                    <div className="relative">
                                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={servicesText}
                                            onChange={(e) => { setServicesText(e.target.value); setHasChanges(true); }}
                                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-gray-600"
                                            placeholder="Ej. Sonido Directo, Iluminación, Backline, Grabación..."
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Ej: Sonido, Luces, Montaje de Escenarios</p>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Floating Action Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 md:left-[280px] right-0 p-4 bg-background border-t border-white/10 flex justify-between items-center z-30">
                    <p className="text-gray-500 text-sm hidden sm:block">Tienes cambios sin guardar</p>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleDiscard}
                            className="px-6 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-surface transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

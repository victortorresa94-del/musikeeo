import { useState, useEffect } from 'react';
import { Plus, X, Box, Settings, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ProviderProfile } from '../../types';

export default function PanelServicesPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProviderProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [services, setServices] = useState<string[]>([]);
    const [newService, setNewService] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'providers', `prov_${user.uid}`);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const data = snap.data() as ProviderProfile;
                setProfile(data);
                setServices(data.services || []);
            } else {
                // Initialize if not exists
                const newProfile: Partial<ProviderProfile> = {
                    id: `prov_${user.uid}`,
                    userId: user.uid,
                    businessName: user.displayName || 'Proveedor Técnico',
                    providerType: 'freelance',
                    services: [],
                    equipmentTypes: [],
                    isPublic: true,
                    createdAt: new Date().toISOString()
                };
                await setDoc(docRef, newProfile);
                setProfile(newProfile as ProviderProfile);
            }
        } catch (error) {
            console.error("Error loading provider profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = () => {
        if (!newService.trim()) return;
        if (!services.includes(newService.trim())) {
            setServices([...services, newService.trim()]);
            setNewService('');
        }
    };

    const handleRemoveService = (service: string) => {
        setServices(services.filter(s => s !== service));
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'providers', profile.id);
            await updateDoc(docRef, {
                services: services
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving services", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <header className="px-6 py-6 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Mis Servicios Técnicos</h1>
                    <p className="text-gray-400 text-sm">Gestiona el catálogo de servicios que ofreces.</p>
                </div>
                <div className="bg-purple-500/10 p-2 rounded-lg">
                    <Box className="text-purple-400" size={24} />
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
                <div className="bg-surface border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Settings size={18} />
                        Lista de Servicios
                    </h3>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                            placeholder="Ej. Sonorización de eventos, Alquiler de luces..."
                            className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                        />
                        <button
                            onClick={handleAddService}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {services.length === 0 && (
                            <p className="text-gray-500 italic text-sm w-full text-center py-4">
                                No has añadido ningún servicio aún.
                            </p>
                        )}

                        {services.map((service, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg pl-4 pr-2 py-2 flex items-center gap-3 group hover:border-purple-500/50 transition-colors">
                                <span className="text-white font-medium">{service}</span>
                                <button
                                    onClick={() => handleRemoveService(service)}
                                    className="p-1 rounded-md text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${showSuccess
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                        >
                            {showSuccess ? <Check size={16} /> : <Save size={16} />}
                            {saving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

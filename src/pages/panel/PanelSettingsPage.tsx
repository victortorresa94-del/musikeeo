
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function PanelSettingsPage() {
    const { user, userProfile, logout } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
    const [location, setLocation] = useState(userProfile?.location || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSaved(false);
        try {
            await userService.updateProfile(user.uid, { displayName, location });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-10 space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-white">Ajustes de Cuenta</h2>
                <p className="text-muted-foreground">Gestiona tus preferencias y sesión.</p>
            </header>

            <div className="bg-surface border border-white/10 rounded-xl p-6 max-w-2xl space-y-6">
                <div>
                    <h3 className="text-white font-bold mb-1">Información Personal</h3>
                    <p className="text-gray-500 text-sm mb-4">Email: {user?.email} · Modo: {userProfile?.primaryMode}</p>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Nombre público</label>
                            <Input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Tu nombre o nombre artístico"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Ciudad</label>
                            <Input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="Ej: Barcelona, España"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-primary text-black font-bold hover:bg-primary/90 min-w-[120px]"
                        >
                            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
                        </Button>
                    </form>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <h3 className="text-white font-bold mb-4">Zona de Peligro</h3>
                    <Button variant="destructive" onClick={logout}>
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}

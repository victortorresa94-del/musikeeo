
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";

export default function PanelSettingsPage() {
    const { user, userProfile, logout } = useAuth();

    return (
        <div className="p-10 space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-white">Ajustes de Cuenta</h2>
                <p className="text-muted-foreground">Gestiona tus preferencias y sesión.</p>
            </header>

            <div className="bg-surface border border-white/10 rounded-xl p-6 max-w-2xl space-y-6">
                <div>
                    <h3 className="text-white font-bold mb-2">Información Personal</h3>
                    <p className="text-gray-400 text-sm">Email: {user?.email}</p>
                    <p className="text-gray-400 text-sm">Nombre: {user?.displayName}</p>
                    <p className="text-gray-400 text-sm">Modo Principal: {userProfile?.primaryMode}</p>
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


import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { deleteUser } from "firebase/auth";
import { toast } from "sonner";
import { Loader2, Download, AlertTriangle } from "lucide-react";

export default function PanelSettingsPage() {
    const { user, userProfile, logout } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
    const [location, setLocation] = useState(userProfile?.location || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

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
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const exportData: Record<string, any> = {
                exportedAt: new Date().toISOString(),
                user: userProfile,
                listings: [],
                applications: [],
                events: [],
            };

            const [listingsSnap, appsSnap, eventsSnap] = await Promise.all([
                getDocs(query(collection(db, 'listings'), where('userId', '==', user.uid))),
                getDocs(query(collection(db, 'applications'), where('applicantId', '==', user.uid))),
                getDocs(query(collection(db, 'events'), where('organizerId', '==', user.uid))),
            ]);
            exportData.listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            exportData.applications = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            exportData.events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `musikeeo-mis-datos-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Datos descargados');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Error al descargar tus datos');
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (deleteConfirm !== user.email) {
            toast.error('El email no coincide');
            return;
        }
        setDeleting(true);
        try {
            // Mark user's listings unavailable (soft-delete; physical purge is v1.1 deuda)
            const listingsSnap = await getDocs(query(collection(db, 'listings'), where('userId', '==', user.uid)));
            const batch = writeBatch(db);
            listingsSnap.docs.forEach(d => batch.update(d.ref, { available: false, deletedByUser: true }));
            await batch.commit();

            // Delete user profile doc
            await deleteDoc(doc(db, 'users', user.uid));

            // Delete Firebase Auth account (must be recent login — Firebase exigirá re-auth si no)
            if (auth.currentUser) {
                await deleteUser(auth.currentUser);
            }

            toast.success('Cuenta eliminada. Hasta pronto.');
            await logout();
            window.location.href = '/';
        } catch (err: any) {
            console.error('Delete error:', err);
            if (err?.code === 'auth/requires-recent-login') {
                toast.error('Por seguridad debes iniciar sesión de nuevo antes de borrar tu cuenta.');
                await logout();
                window.location.href = '/login';
            } else {
                toast.error('Error al borrar la cuenta. Escríbenos a legal@musikeeo.com');
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 bg-background min-h-screen">
            <header>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Ajustes de Cuenta</h2>
                <p className="text-muted-foreground text-sm mt-1">Gestiona tus preferencias y sesión.</p>
            </header>

            <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">Información Personal</h3>
                    <p className="text-muted-foreground text-sm mb-4">Email: {user?.email} · Modo: {userProfile?.primaryMode}</p>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Nombre público</label>
                            <Input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Tu nombre o nombre artístico"
                                className="bg-muted border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Ciudad</label>
                            <Input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="Ej: Barcelona, España"
                                className="bg-muted border-border text-foreground"
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

                <div className="pt-4 border-t border-border">
                    <h3 className="text-base font-semibold text-foreground tracking-tight mb-4">Apariencia</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Tema</span>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="pt-4 border-t border-border">
                    <h3 className="text-base font-semibold text-foreground tracking-tight mb-4">Tus datos (GDPR)</h3>
                    <p className="text-muted-foreground text-sm mb-3">Descarga una copia en JSON de tu perfil, anuncios, eventos y solicitudes.</p>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting}
                        className="gap-2"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Descargar mis datos
                    </Button>
                </div>

                <div className="pt-4 border-t border-border">
                    <h3 className="text-base font-semibold text-foreground tracking-tight mb-4">Sesión</h3>
                    <Button variant="outline" onClick={logout}>
                        Cerrar Sesión
                    </Button>
                </div>

                <div className="pt-4 border-t border-red-500/30">
                    <h3 className="text-base font-semibold text-red-400 tracking-tight mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Zona de peligro
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                        Borrar tu cuenta es <strong className="text-red-400">permanente</strong>. Se eliminará tu
                        perfil y desactivarán tus anuncios. Para confirmar, escribe tu email <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{user?.email}</code>:
                    </p>
                    <div className="space-y-3">
                        <Input
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="tu@email.com"
                            className="bg-muted border-red-500/30 text-foreground max-w-sm"
                        />
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting || deleteConfirm !== user?.email}
                            className="gap-2"
                        >
                            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Borrar mi cuenta para siempre
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

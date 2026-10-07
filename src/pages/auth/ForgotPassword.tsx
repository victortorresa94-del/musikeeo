import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err: any) {
            // No revelamos si el email existe: solo errores de formato o de red
            if (err?.code === 'auth/user-not-found') setSent(true);
            else if (err?.code === 'auth/invalid-email') setError('Ese email no parece válido.');
            else setError('No hemos podido enviar el email. Inténtalo de nuevo en un momento.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Recuperar contraseña" subtitle="Te enviamos un enlace para crear una nueva">
            {sent ? (
                <div className="space-y-4 text-center">
                    <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                    <p className="text-foreground font-semibold">Revisa tu correo</p>
                    <p className="text-sm text-muted-foreground">
                        Si hay una cuenta con <span className="text-foreground">{email}</span>, te llegará un enlace para cambiar la contraseña. Mira también en spam.
                    </p>
                    <Link to="/login" className="inline-block text-sm text-primary font-medium hover:underline">Volver a entrar</Link>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" placeholder="nombre@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar enlace
                    </Button>
                    <p className="text-center text-sm">
                        <Link to="/login" className="text-muted-foreground hover:text-foreground">Volver a entrar</Link>
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}

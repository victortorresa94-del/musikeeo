import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

// Shadcn-like naive UI components (inline for now until fully scaffolded)
const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
        {children}
    </label>
);

const loginSchema = z.object({
    email: z.string().email('Introduce un email válido'),
    password: z.string().min(6, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            navigate('/');
        } catch (err: any) {
            setError('Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    const { loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err: any) {
            setError('Falló el inicio de sesión con Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Bienvenido" subtitle="Ingresa tus credenciales para acceder">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        placeholder="nombre@ejemplo.com"
                        type="email"
                        {...register('email')}
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                </Button>

            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground bg-card">O continúa con</span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Google
            </Button>

            <div className="mt-6 text-center text-sm">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                    Regístrate
                </Link>
            </div>
        </AuthLayout>
    );
}

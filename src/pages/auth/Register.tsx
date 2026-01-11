import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
        {children}
    </label>
);

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Introduce un email válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['musician', 'technician', 'promoter']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'musician'
        }
    });

    const roleValue = watch('role');

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError(null);
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Update profile
            await updateProfile(user, {
                displayName: data.name,
            });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: data.name,
                email: data.email,
                role: data.role,
                createdAt: new Date().toISOString(),
                stats: {
                    reputation: 0,
                    projects: 0,
                    completedGigs: 0
                }
            });

            // Force token refresh to get custom claims if we were using them
            await user.getIdToken(true);

            // Navigate to home
            navigate('/');
        } catch (err: any) {
            setError('Error al crear la cuenta. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Crear Cuenta" subtitle="Únete al ecosistema musical">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                        id="name"
                        placeholder="Tu nombre artísitico o real"
                        {...register('name')}
                        className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        {...register('email')}
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...register('password')}
                        className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Soy...</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <label className={`
                            flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                            ${roleValue === 'musician' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}
                        `}>
                            <input type="radio" value="musician" className="sr-only" {...register('role')} />
                            <span className="text-xs font-semibold">Músico</span>
                        </label>
                        <label className={`
                            flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                            ${roleValue === 'technician' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}
                        `}>
                            <input type="radio" value="technician" className="sr-only" {...register('role')} />
                            <span className="text-xs font-semibold">Técnico</span>
                        </label>
                        <label className={`
                            flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                            ${roleValue === 'promoter' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}
                        `}>
                            <input type="radio" value="promoter" className="sr-only" {...register('role')} />
                            <span className="text-xs font-semibold">Promotor</span>
                        </label>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrarse
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                    Inicia Sesión
                </Link>
            </div>
        </AuthLayout>
    );
}

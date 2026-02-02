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
import type { User } from '../../types';

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
        {children}
    </label>
);

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Introduce un email válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError(null);
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const firebaseUser = userCredential.user;

            // Update profile
            await updateProfile(firebaseUser, {
                displayName: data.name,
            });

            // Create initial user document in Firestore (No roles yet)
            const newUser: User = {
                uid: firebaseUser.uid,
                displayName: data.name,
                email: data.email,
                createdAt: new Date().toISOString(),
                onboardingCompleted: false, // Critical: sends them to onboarding
                primaryMode: 'musician', // Default
                activeModes: {
                    musician: false,
                    organizer: false,
                    provider: false
                }
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

            // Navigate to onboarding
            navigate('/onboarding');
        } catch (err: any) {
            console.error(err);
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

                {/* Removed role selection - now handled in Onboarding */}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuar a Onboarding
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

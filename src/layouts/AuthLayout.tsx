import React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] opacity-30" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-12 w-auto mb-4" />
                    <p className="text-muted-foreground text-center max-w-xs">El ecosistema para profesionales de la música.</p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

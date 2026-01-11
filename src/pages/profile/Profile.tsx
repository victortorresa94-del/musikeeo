import { Button } from '../../components/ui/button';
import { MapPin, Link as LinkIcon, Edit, ShieldCheck } from 'lucide-react';

export default function Profile() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">
                {/* Cover */}
                <div className="h-40 bg-gradient-to-r from-primary/30 to-secondary/30"></div>

                <div className="px-6 pb-6 pt-0 relative">
                    {/* Avatar */}
                    <div className="absolute -top-16 left-6 h-32 w-32 rounded-full border-4 border-card bg-muted shadow-lg"></div>

                    <div className="ml-0 md:ml-36 pt-4 md:pt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                Músico Dev <ShieldCheck className="h-5 w-5 text-primary" />
                            </h1>
                            <p className="text-muted-foreground">Guitarrista Profesional & Productor</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Madrid, ES</span>
                                <span className="flex items-center gap-1 text-primary hover:underline cursor-pointer"><LinkIcon className="h-3 w-3" /> musikeeo.com/dev</span>
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Edit className="h-4 w-4" /> Editar Perfil
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-6 rounded-2xl border border-border text-center">
                    <h3 className="text-4xl font-bold text-primary mb-1">98</h3>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Reputación</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border text-center">
                    <h3 className="text-4xl font-bold text-foreground mb-1">24</h3>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Proyectos</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border text-center">
                    <h3 className="text-4xl font-bold text-foreground mb-1">156</h3>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Conexiones</p>
                </div>
            </div>

            {/* Bio & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border">
                    <h3 className="font-bold mb-4">Sobre Mí</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Músico con más de 10 años de experiencia en la escena local. Especializado en Jazz, Funk y producciones híbridas.
                        Siempre buscando nuevas colaboraciones y sonidos experimentales.
                    </p>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border">
                    <h3 className="font-bold mb-4">Habilidades</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Guitarra', 'Ableton Live', 'Producción', 'Teoría Musical', 'Directo'].map(skill => (
                            <span key={skill} className="bg-secondary px-3 py-1 rounded-full text-xs font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { projectService, type Project } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            try {
                const data = await projectService.getProjectsByUser(user.uid);
                setProjects(data);
            } catch (error) {
                console.error("Error loading projects", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [user]);

    const getProjectsByStatus = (status: Project['status']) => projects.filter(p => p.status === status);

    const handleCreateProject = async () => {
        if (!user) return;
        try {
            await projectService.createProject({
                title: 'Nuevo Proyecto',
                description: 'Descripción pendiente...',
                status: 'planning',
                type: 'other',
                ownerId: user.uid,
                createdAt: new Date().toISOString()
            });
            const data = await projectService.getProjectsByUser(user.uid);
            setProjects(data);
        } catch (error) {
            console.error("Error creating project", error);
        }
    };

    if (loading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Proyectos</h1>
                    <p className="text-muted-foreground">Gestiona tus lanzamientos y colaboraciones.</p>
                </div>
                <Button className="gap-2 bg-brand-lime text-black hover:bg-brand-lime/90 font-bold" onClick={handleCreateProject}>
                    <Plus className="h-4 w-4" /> Crear Proyecto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Planning */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-white/80">Planificación</h3>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white">{getProjectsByStatus('planning').length}</span>
                    </div>

                    {getProjectsByStatus('planning').map((project) => (
                        <Card key={project.id} className="bg-card border-white/5 hover:border-brand-cyan/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded font-bold",
                                        project.type === 'ep_launch' ? "bg-indigo-500/10 text-indigo-400" :
                                            project.type === 'tour' ? "bg-emerald-500/10 text-emerald-400" :
                                                "bg-white/10 text-white/70"
                                    )}>
                                        {project.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <h4 className="font-bold text-sm text-white mb-1">{project.title}</h4>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {project.dueDate || 'Sin fecha'}
                                    </div>
                                    <div className="flex -space-x-2">
                                        <div className="h-6 w-6 rounded-full bg-zinc-800 border-2 border-card"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Column 2: In Progress */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-white/80">En Progreso</h3>
                        <span className="text-xs bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded-full">{getProjectsByStatus('in_progress').length}</span>
                    </div>

                    {getProjectsByStatus('in_progress').map((project) => (
                        <Card key={project.id} className="bg-card border-brand-cyan/20 hover:border-brand-cyan/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded font-bold",
                                        project.type === 'tour' ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/70"
                                    )}>
                                        {project.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <h4 className="font-bold text-sm text-white mb-1">{project.title}</h4>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1 text-brand-cyan">
                                        <Clock className="h-3 w-3" /> En curso
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Column 3: Done */}
                <div className="space-y-4 opacity-70">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-sm text-white/80">Completado</h3>
                        <span className="text-xs bg-brand-lime/20 text-brand-lime px-2 py-0.5 rounded-full">{getProjectsByStatus('completed').length}</span>
                    </div>

                    {getProjectsByStatus('completed').map((project) => (
                        <div key={project.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-brand-lime" />
                            <span className="text-sm line-through text-muted-foreground">{project.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

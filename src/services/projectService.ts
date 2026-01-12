import { firestoreService } from './firestoreService';

export interface Project {
    id: string;
    title: string;
    description?: string;
    status: 'planning' | 'in_progress' | 'completed';
    type: 'ep_launch' | 'tour' | 'single' | 'collab' | 'other';
    ownerId: string;
    collaborators?: string[];
    dueDate?: string;
    createdAt: string;
}

const MOCK_PROJECTS: Project[] = [
    { id: '1', title: 'Neon Skies - Single', description: 'Coordinar sesión de fotos y máster final.', status: 'planning', type: 'ep_launch', ownerId: 'user1', dueDate: '2024-10-12', createdAt: new Date().toISOString() },
    { id: '2', title: 'Acoustic Sessions EP', description: 'Grabar 4 temas acústicos en estudio.', status: 'planning', type: 'ep_launch', ownerId: 'user1', createdAt: new Date().toISOString() },
    { id: '3', title: 'Summer Tour 2024', description: 'Contactar salas de Madrid y Valencia.', status: 'in_progress', type: 'tour', ownerId: 'user1', createdAt: new Date().toISOString() },
    { id: '4', title: 'Revisión Contrato', description: 'Revisar términos legales.', status: 'completed', type: 'other', ownerId: 'user1', createdAt: new Date().toISOString() },
];

export const projectService = {
    getProjectsByUser: async (userId: string): Promise<Project[]> => {
        try {
            const projects = await firestoreService.getAll<Project>('projects');
            if (projects && projects.length > 0) {
                return projects.filter(p => p.ownerId === userId || p.collaborators?.includes(userId));
            }
            throw new Error("No projects in DB");
        } catch (error) {
            console.warn("Using Mock Projects:", error);
            await new Promise(resolve => setTimeout(resolve, 400));
            return MOCK_PROJECTS;
        }
    },

    createProject: async (project: Omit<Project, 'id'>): Promise<string> => {
        try {
            const id = await firestoreService.add('projects', project);
            return id;
        } catch (error) {
            console.error("Error creating project", error);
            throw error;
        }
    },

    updateProjectStatus: async (projectId: string, status: Project['status']): Promise<void> => {
        try {
            await firestoreService.update('projects', projectId, { status });
        } catch (error) {
            console.error("Error updating project status", error);
            throw error;
        }
    }
};

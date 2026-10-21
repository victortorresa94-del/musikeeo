import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/home/Navbar';

export const EventsLayout = () => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Top Navigation from Landing/Home style as requested */}
            <Navbar />

            <main className="pt-20 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
};

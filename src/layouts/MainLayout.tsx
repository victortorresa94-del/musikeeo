import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { AIContextPanel } from '../components/layout/AIContextPanel';

export const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // In a real implementation, we would toggle a mobile sidebar or drawer here
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-cyan/30">
            {/* Left Column: Navigation Sidebar */}
            <Sidebar />

            {/* Middle Column: Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <TopBar onMenuClick={toggleMobileMenu} />

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto scroll-smooth pb-24 md:pb-6 relative z-0">
                    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav />
            </div>

            {/* Right Column: AI Context Panel (Hidden on tablet, visible on large desktop) */}
            <AIContextPanel />
        </div>
    );
};

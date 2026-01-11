import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { AIContextPanel } from '../components/layout/AIContextPanel';

export const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);

    // In a real implementation, we would toggle a mobile sidebar or drawer here
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleAIPanel = () => setIsAIPanelOpen(!isAIPanelOpen);

    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-cyan/30">
            {/* Left Column: Navigation Sidebar */}
            <Sidebar />

            {/* Middle Column: Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <TopBar onMenuClick={toggleMobileMenu} onAIToggle={toggleAIPanel} isAIOpen={isAIPanelOpen} />

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto scroll-smooth pb-24 md:pb-6 relative z-0">
                    <div className="animate-fade-in-up w-full">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav />
            </div>

            {/* Right Column: AI Context Panel (Hidden on tablet, visible on large desktop) */}
            <AIContextPanel isOpen={isAIPanelOpen} />
        </div>
    );
};

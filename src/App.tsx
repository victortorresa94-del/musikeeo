import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, Suspense, lazy, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Loader2 } from 'lucide-react';
import { EventsLayout } from './layouts/EventsLayout';
import { PanelLayout } from './layouts/PanelLayout';
import SplashScreen from './components/layout/SplashScreen';
import { RodrigoFloatingChat } from './components/rodrigo/RodrigoFloatingChat';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Toaster } from 'sonner';

// Lazy Imports
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Home = lazy(() => import('./pages/home/Home'));
const Feed = lazy(() => import('./pages/feed/Feed'));
const Events = lazy(() => import('./pages/events/Events'));
const EventsV2 = lazy(() => import('./pages/events/EventsV2'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const CreateEvent = lazy(() => import('./pages/events/CreateEvent'));
const PublishEventPage = lazy(() => import('./pages/events/publish/PublishEventPage'));
const Messages = lazy(() => import('./pages/messages/Messages'));
const Market = lazy(() => import('./pages/market/Market'));
const ProductDetail = lazy(() => import('./pages/market/ProductDetail'));
const CreateListing = lazy(() => import('./pages/market/CreateListing'));
const Projects = lazy(() => import('./pages/projects/Projects'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const PublicProfile = lazy(() => import('./pages/profile/PublicProfile'));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));
const Discover = lazy(() => import('./pages/discover/Discover'));
const Reels = lazy(() => import('./pages/reels/Reels'));
const RodrigoPage = lazy(() => import('./pages/rodrigo/RodrigoPage'));

// Artist/Panel Lazy Imports
const ArtistProfilePage = lazy(() => import('./pages/artist/ArtistProfilePage'));
const PanelProfilePage = lazy(() => import('./pages/panel/PanelProfilePage'));
const PanelOrganizerProfilePage = lazy(() => import('./pages/panel/PanelOrganizerProfilePage'));
const PanelProviderProfilePage = lazy(() => import('./pages/panel/PanelProviderProfilePage'));
const PanelCalendarPage = lazy(() => import('./pages/panel/PanelCalendarPage'));
const PanelMultimediaPage = lazy(() => import('./pages/panel/PanelMultimediaPage'));
const PanelServicesPage = lazy(() => import('./pages/panel/PanelServicesPage'));
const PanelSettingsPage = lazy(() => import('./pages/panel/PanelSettingsPage'));

// Guard: Requires Auth only (for Onboarding)
const RequireAuthSimple = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// Guard: Requires Auth + Onboarding Completed
const RequireAuthCompleted = () => {
  const { user, userProfile, loading } = useAuth();

  // FIX: Safety Timeout for Infinite Loading
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !userProfile) {
        setShowTimeoutError(true);
      }
    }, 8000); // 8 seconds timeout
    return () => clearTimeout(timer);
  }, [loading, userProfile]);

  if (showTimeoutError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-red-400">La carga está tardando demasiado.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
        >
          Recargar Página
        </button>
      </div>
    );
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!userProfile) {
    console.warn("RequireAuthCompleted: User exists but no profile found. Redirecting to onboarding.");
    return <Navigate to="/onboarding" replace />;
  }

  if (!userProfile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <MainLayout />;
};

// Guard for Panel routes
const RequirePanelAuth = () => {
  const { user, userProfile, loading } = useAuth(); // Need profile

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    // FIX: Profile missing? Go to onboarding to fix/create it.
    console.warn("RequirePanelAuth: User exists but no profile. Redirecting.");
    return <Navigate to="/onboarding" replace />;
  }

  if (!userProfile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <PanelLayout />;
};

// Intelligent Redirect for /panel
const PanelGateway = () => {
  const { userProfile, loading } = useAuth();

  if (loading) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Redirect based on primary mode
  const mode = userProfile?.primaryMode || 'musician';

  if (mode === 'organizer') return <Navigate to="/panel/eventos" replace />;
  if (mode === 'provider') return <Navigate to="/panel/servicios-tecnicos" replace />;

  // Default to musician
  return <Navigate to="/panel/perfil" replace />;
};

// Check if already logged in to redirect from auth pages
const RequireAnon = () => {
  const { user, loading } = useAuth();
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};



function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <AuthProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <Router>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/artistas" element={<Discover />} />
              <Route path="/sonido" element={<Discover />} />
              <Route path="/rodrigo" element={<RodrigoPage />} />
              <Route path="/publicar" element={<PublishEventPage />} />

              {/* Public Artist Profile */}
              <Route path="/artist/:slug" element={<ArtistProfilePage />} />

              {/* Events V2 */}
              <Route element={<EventsLayout />}>
                <Route path="/eventos2" element={<EventsV2 />} />
              </Route>

              <Route element={<RequireAnon />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Onboarding - Protected but no layout */}
              <Route element={<RequireAuthSimple />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>

              {/* Protected App Routes (MainLayout) */}
              <Route element={<RequireAuthCompleted />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/eventos" element={<Events />} />
                <Route path="/eventos/:id" element={<EventDetail />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/market" element={<Market />} />
                <Route path="/market/:id" element={<ProductDetail />} />
                <Route path="/market/create" element={<CreateListing />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/reels/:id" element={<Reels />} />
                <Route path="/eventos/crear" element={<CreateEvent />} />
              </Route>

              {/* Panel Routes */}
              {/* Panel Routes (Dynamic based on role) */}
              <Route element={<RequirePanelAuth />}>
                {/* Dashboard Gateway - Redirects to primary mode dashboard */}
                <Route path="/panel" element={<PanelGateway />} />

                {/* Musician Routes */}
                <Route path="/panel/perfil" element={<PanelProfilePage />} />
                <Route path="/panel/multimedia" element={<PanelMultimediaPage />} />
                <Route path="/panel/servicios" element={<PanelServicesPage />} />

                {/* Organizer Routes */}
                <Route path="/panel/eventos" element={<EventsV2 />} />
                <Route path="/panel/perfil-organizador" element={<PanelOrganizerProfilePage />} />

                {/* Provider Routes */}
                <Route path="/panel/servicios-tecnicos" element={<PanelServicesPage />} />
                <Route path="/panel/perfil-tecnico" element={<PanelProviderProfilePage />} />

                {/* Common Routes */}
                <Route path="/panel/calendario" element={<PanelCalendarPage />} />
                <Route path="/panel/ajustes" element={<PanelSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <RodrigoFloatingChat />
          <Toaster position="top-center" richColors />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

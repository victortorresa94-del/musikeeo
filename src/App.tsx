import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect, Suspense, lazy } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { THEME_KEY, applyTheme } from './hooks/useTheme';
import { Loader2 } from 'lucide-react';

// Apply saved theme before first render to prevent flash
function ThemeInit() {
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* sin almacenamiento */ }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  }, []);
  return null;
}
import { PanelLayout } from './layouts/PanelLayout';
const RodrigoFloatingChat = lazy(() =>
  import('./components/rodrigo/RodrigoFloatingChat').then(m => ({ default: m.RodrigoFloatingChat }))
);
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Toaster } from 'sonner';
import AvisoPruebas from './components/AvisoPruebas';

// Lazy Imports
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Home = lazy(() => import('./pages/home/Home'));
const Feed = lazy(() => import('./pages/feed/Feed'));
const EventsV2 = lazy(() => import('./pages/events/EventsV2'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const PublishEventPage = lazy(() => import('./pages/events/publish/PublishEventPage'));
const Messages = lazy(() => import('./pages/messages/Messages'));
const ProductDetail = lazy(() => import('./pages/market/ProductDetail'));
const CreateListing = lazy(() => import('./pages/market/CreateListing'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const PublicProfile = lazy(() => import('./pages/profile/PublicProfile'));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));
const Explorar = lazy(() => import('./pages/explorar/Explorar'));
const Categoria = lazy(() => import('./pages/explorar/Categoria'));
const Reels = lazy(() => import('./pages/reels/Reels'));
const RodrigoPage = lazy(() => import('./pages/rodrigo/RodrigoPage'));
const Cancionero = lazy(() => import('./pages/cancionero/Cancionero'));
const EditarCancion = lazy(() => import('./pages/cancionero/EditarCancion'));
const LeerCancion = lazy(() => import('./pages/cancionero/LeerCancion'));
const Repertorio = lazy(() => import('./pages/cancionero/Repertorio'));
const TocarRepertorio = lazy(() => import('./pages/cancionero/TocarRepertorio'));
const SacarAcordes = lazy(() => import('./pages/cancionero/SacarAcordes'));

// Legal pages (public, no layout)
const LegalNotice = lazy(() => import('./pages/legal/LegalNotice'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));

const CookieBanner = lazy(() => import('./components/CookieBanner'));
const Analytics = lazy(() => import('./components/Analytics'));
const EmailVerificationBanner = lazy(() => import('./components/EmailVerificationBanner'));

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
  const location = useLocation();
  if (loading) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
};

// Guard: Requires Auth + Onboarding Completed (para ACCIONES: publicar, mensajes, perfil propio).
// Se anida dentro de MainLayout, así que solo renderiza el Outlet.
const RequireAuthCompleted = () => {
  const { user, userProfile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) return <div className="h-full min-h-[60vh] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-ink" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (!userProfile || !userProfile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
};

// Guard for Panel routes
const RequirePanelAuth = () => {
  const { user, userProfile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary-ink">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!userProfile) {
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
  const { userProfile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Redirect based on primary mode
  const mode = userProfile?.primaryMode || 'musician';

  if (mode === 'organizer') return <Navigate to="/panel/perfil-organizador" replace />;
  if (mode === 'provider') return <Navigate to="/panel/servicios-tecnicos" replace />;

  // Default to musician
  return <Navigate to="/panel/perfil" replace />;
};

// Enlaces antiguos: /discover?q=… y /market?category=… van a su sitio del marketplace
const RedirigeExplorar = () => {
  const { search } = useLocation();
  return <Navigate to={`/explorar${search}`} replace />;
};
const MERCADO_A_CATEGORIA: Record<string, string> = {
  guitarras: 'guitarras', bajos: 'guitarras', teclados: 'teclados', bateria: 'bateria', cuerdas: 'cuerdas',
  pa_sonido: 'altavoces', iluminacion: 'altavoces', recording: 'altavoces',
};
const RedirigeMercado = () => {
  const cat = new URLSearchParams(useLocation().search).get('category');
  return <Navigate to={cat && MERCADO_A_CATEGORIA[cat] ? `/explorar/${MERCADO_A_CATEGORIA[cat]}` : '/explorar/segunda-mano'} replace />;
};

// La home es el escaparate para quien llega sin cuenta. Con cuenta, se entra al feed.
const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary-ink" /></div>;
  return <Navigate to={user ? '/feed' : '/home'} replace />;
};

const HomeOrFeed = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/feed" replace />;
  return <Home />;
};

// Check if already logged in to redirect from auth pages
const RequireAnon = () => {
  const { user, userProfile, loading, profileLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  if (!loading && !profileLoading && user) {
    // Sin ficha todavía (alta a medias) o sin onboarding: primero el onboarding
    if (!userProfile || !userProfile.onboardingCompleted) return <Navigate to="/onboarding" replace state={{ from }} />;
    return <Navigate to={from || '/feed'} replace />;
  }

  return <Outlet />;
};



function App() {
  useAutoUpdate();

  return (
    <ErrorBoundary>
      <ThemeInit />
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary-ink" />
            </div>
          }>
            <Routes>
              {/* Root: authenticated → /home, else → landing */}
              <Route path="/" element={<RootRoute />} />

              {/* Legal — públicas, sin layout */}
              <Route path="/aviso-legal" element={<LegalNotice />} />
              <Route path="/privacidad" element={<PrivacyPolicy />} />
              <Route path="/terminos" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />


              <Route element={<RequireAnon />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* El bolo: el repertorio a pantalla completa, sin barras de la app */}
              <Route path="/cancionero/repertorio/:id/tocar" element={<TocarRepertorio />} />

              {/* Onboarding - Protected but no layout */}
              <Route element={<RequireAuthSimple />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/publicar" element={<PublishEventPage />} />
              </Route>

              <Route element={<MainLayout />}>
                {/* Con la barra de la app (antes tenían la de la web: se cortaba bajo la barra de estado del iPhone) */}
                <Route path="/artist/:slug" element={<ArtistProfilePage />} />
                <Route path="/rodrigo" element={<RodrigoPage />} />
                {/* Públicas: todo se puede VER sin cuenta */}
                <Route path="/home" element={<HomeOrFeed />} />
                <Route path="/feed" element={<Feed />} />
                {/* El marketplace: Explorar y el Mercado son lo mismo */}
                <Route path="/explorar" element={<Explorar />} />
                <Route path="/explorar/:slug" element={<Categoria />} />
                <Route path="/discover" element={<RedirigeExplorar />} />
                <Route path="/artistas" element={<Navigate to="/explorar/bandas" replace />} />
                <Route path="/sonido" element={<Navigate to="/explorar/tecnicos" replace />} />
                <Route path="/eventos" element={<EventsV2 />} />
                <Route path="/eventos/:id" element={<EventDetail />} />
                <Route path="/market" element={<RedirigeMercado />} />
                <Route path="/market/:id" element={<ProductDetail />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/reels/:id" element={<Reels />} />
                {/* Cancionero: letras y acordes pegados de cualquier web, limpios. Sin cuenta se guarda en
                    el dispositivo; con cuenta, también en users/{uid}/canciones */}
                <Route path="/cancionero" element={<Cancionero />} />
                <Route path="/cancionero/nueva" element={<EditarCancion />} />
                <Route path="/cancionero/escuchar" element={<SacarAcordes />} />
                <Route path="/cancionero/:id" element={<LeerCancion />} />
                <Route path="/cancionero/:id/editar" element={<EditarCancion />} />
                <Route path="/cancionero/repertorio/:id" element={<Repertorio />} />

                {/* Acciones: publicar, escribir y gestionar requieren cuenta */}
                <Route element={<RequireAuthCompleted />}>
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/market/create" element={<CreateListing />} />
                  {/* Un solo flujo para publicar bolos: /publicar (este tenía una «IA» de mentira) */}
                  <Route path="/eventos/crear" element={<Navigate to="/publicar" replace />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
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
                {/* «Mis bolos» vive en Mi perfil (antes enseñaba los de todo el mundo) */}
                <Route path="/panel/eventos" element={<Navigate to="/profile?tab=bolos" replace />} />
                <Route path="/panel/perfil-organizador" element={<PanelOrganizerProfilePage />} />

                {/* Provider Routes */}
                <Route path="/panel/servicios-tecnicos" element={<PanelServicesPage />} />
                <Route path="/panel/perfil-tecnico" element={<PanelProviderProfilePage />} />

                {/* Common Routes */}
                <Route path="/panel/calendario" element={<PanelCalendarPage />} />
                <Route path="/panel/ajustes" element={<PanelSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <RodrigoFloatingChat />
          </Suspense>
          <Suspense fallback={null}>
            <CookieBanner />
          </Suspense>
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
          <Suspense fallback={null}>
            <EmailVerificationBanner />
          </Suspense>
          <Toaster position="top-center" richColors />
          <AvisoPruebas />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

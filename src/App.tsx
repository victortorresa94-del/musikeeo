import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Feed from './pages/feed/Feed';
import Events from './pages/events/Events';
import Messages from './pages/messages/Messages';
import Market from './pages/market/Market';
import Projects from './pages/projects/Projects';
import Profile from './pages/profile/Profile';
import { MainLayout } from './layouts/MainLayout';
import { Loader2 } from 'lucide-react';

// Guard Component
const RequireAuth = () => {
  const { user, loading } = useAuth();

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

  return <MainLayout />;
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
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<RequireAnon />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Feed />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/market" element={<Market />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

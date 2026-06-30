import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layouts
import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import TrackerPage from './pages/TrackerPage';
import CommunityPage from './pages/CommunityPage';
import DashboardPage from './pages/DashboardPage';
import OfficialDashboardPage from './pages/OfficialDashboardPage';
import ScorecardPage from './pages/ScorecardPage';
import HeatmapPage from './pages/HeatmapPage';
import LoginPage from './pages/LoginPage';
import ChatWidget from './components/chat/ChatWidget';

// Route Guards
const RequireAuth = ({ children, allowedRoles }) => {
  const { currentUser, role } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin') {
    return <Navigate to="/" />; // Redirect if role not allowed
  }
  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
          <Route path="/tracker/:id" element={<TrackerPage />} />

          {/* Citizen Routes */}
          <Route path="/report" element={<RequireAuth><ReportPage /></RequireAuth>} />
          <Route path="/community" element={<RequireAuth><CommunityPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />

          {/* Official Hub Route (System Overview merged in here) */}
          <Route 
            path="/official" 
            element={<RequireAuth allowedRoles={['official']}><OfficialDashboardPage /></RequireAuth>} 
          />

          <Route 
            path="/heatmap" 
            element={<RequireAuth allowedRoles={['official']}><HeatmapPage /></RequireAuth>} 
          />
        </Routes>
      </main>
      
      {/* Global AI Chatbot */}
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

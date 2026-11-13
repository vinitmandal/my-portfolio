import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PortfolioPage from './pages/PortfolioPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/projects/:slug" element={<ProjectDetailPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/setup" element={<AdminSetupPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

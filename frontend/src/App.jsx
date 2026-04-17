import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import Stations from './pages/Stations/Stations';
import Dashboard from './pages/Dashboard/Dashboard';
import { useAuth } from './context/AuthContext';
import AdminStations from './pages/Admin/AdminStations';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import StationPortal from './pages/StationPortal/StationPortal';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth?mode=login" />;
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth?mode=login&role=admin" />;
  if (user?.role !== 'admin') return <Navigate to="/stations" />;
  return children;
};

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/stations" element={<Stations />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route path="/station" element={<StationPortal />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

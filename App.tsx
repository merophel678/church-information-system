import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Schedules from './pages/Schedules';
import Bulletin from './pages/Bulletin';
import Donations from './pages/Donations';
import Login from './pages/Login';
import RequestService from './pages/RequestService';
import AdminDashboard from './pages/AdminDashboard';
import Records from './pages/Records';
import ManageSchedules from './pages/admin/ManageSchedules';
import ManageBulletin from './pages/admin/ManageBulletin';
import ManageDonations from './pages/admin/ManageDonations';
import ManageRequests from './pages/admin/ManageRequests';
import CertificateRegistry from './pages/admin/CertificateRegistry';
import { User } from './types';
import { ParishProvider } from './context/ParishContext';
import { DialogProvider } from './context/DialogContext';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

// Protected Route Wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('parish_user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('parish_token'));

  const handleLogin = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    setAuthToken(token);
    localStorage.setItem('parish_user', JSON.stringify(loggedInUser));
    localStorage.setItem('parish_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('parish_user');
    localStorage.removeItem('parish_token');
  };

  return (
    <DialogProvider>
      <ParishProvider authToken={authToken}>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar user={user} onLogout={handleLogout} />
          
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/bulletin" element={<Bulletin />} />
              <Route path="/donations" element={<Donations />} />
              <Route
                path="/services"
                element={user ? <Navigate to="/admin/dashboard" replace /> : <RequestService />}
              />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />

              {/* Protected Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute user={user}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/records" 
                element={
                  <ProtectedRoute user={user}>
                    <Records />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage-schedules" 
                element={
                  <ProtectedRoute user={user}>
                    <ManageSchedules />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage-bulletin" 
                element={
                  <ProtectedRoute user={user}>
                    <ManageBulletin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage-donations" 
                element={
                  <ProtectedRoute user={user}>
                    <ManageDonations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage-requests" 
                element={
                  <ProtectedRoute user={user}>
                    <ManageRequests />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/registry" 
                element={
                  <ProtectedRoute user={user}>
                    <CertificateRegistry />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ParishProvider>
    </DialogProvider>
  );
};

export default App;

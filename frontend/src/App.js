import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddChildPage from './pages/AddChildPage';
import ChildProfilePage from './pages/ChildProfilePage';
import GrowthTrackerPage from './pages/GrowthTrackerPage';
import GrowthChartPage from './pages/GrowthChartPage';
import MealPlanPage from './pages/MealPlanPage';
import VaccinationPage from './pages/VaccinationPage';

// Protected route — redirects to login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — must be logged in */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/children/add" element={
            <ProtectedRoute><AddChildPage /></ProtectedRoute>
          } />
          <Route path="/children/:id" element={
            <ProtectedRoute><ChildProfilePage /></ProtectedRoute>
          } />
          <Route path="/children/:id/growth" element={
            <ProtectedRoute><GrowthTrackerPage /></ProtectedRoute>
          } />
          <Route path="/children/:id/charts" element={
            <ProtectedRoute><GrowthChartPage /></ProtectedRoute>
          } />
          <Route path="/children/:id/meals" element={
            <ProtectedRoute><MealPlanPage /></ProtectedRoute>
          } />
          <Route path="/children/:id/vaccines" element={
            <ProtectedRoute><VaccinationPage /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
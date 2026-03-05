import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import MainLayout from './layouts/MainLayout';
import WorkerLayout from './layouts/WorkerLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import PendingOrders from './pages/PendingOrders';
import AllOrders from './pages/AllOrders';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerHistory from './pages/WorkerHistory';
import LandingPage from './pages/LandingPage';
import { WorkOrderProvider } from './context/WorkOrderContext';
import { NotificationProvider } from './context/NotificationContext';

// Guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando sistema...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <WorkOrderProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="crear-orden" element={<CreateOrder />} />
              <Route path="pendientes" element={<PendingOrders />} />
              <Route path="historial" element={<AllOrders />} />
              <Route path="ajustes" element={<div className="p-8"><h1>Ajustes de Sistema (Próximamente)</h1></div>} />
            </Route>

            {/* Worker Routes */}
            <Route path="/operario" element={<ProtectedRoute><WorkerLayout /></ProtectedRoute>}>
              <Route index element={<WorkerDashboard />} />
              <Route path="historial" element={<WorkerHistory />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkOrderProvider>
    </NotificationProvider>
  );
};

export default App;

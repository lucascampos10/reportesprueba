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
import EdificioLayout from './layouts/EdificioLayout';
import EdificioDashboard from './pages/EdificioDashboard';
import LandingPage from './pages/LandingPage';
import Finanzas from './pages/Finanzas';
import Presupuestos from './pages/Presupuestos';
import Recibos from './pages/Recibos';
import FinanceOverview from './pages/FinanceOverview';
import { AgendaPage, ContactosPage } from './pages/ComingSoon';
import { WorkOrderProvider } from './context/WorkOrderContext';
import { NotificationProvider } from './context/NotificationContext';
import { BudgetProvider } from './context/BudgetContext';
import { ReceiptProvider } from './context/ReceiptContext';
import { ThemeProvider } from './context/ThemeContext';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

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
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        background: 'var(--color-bg)'
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Cargando sistema...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
      <WorkOrderProvider>
        <BudgetProvider>
          <ReceiptProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Route */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />

                  {/* Órdenes de Trabajo */}
                  <Route path="ordenes/nueva" element={<CreateOrder />} />
                  <Route path="ordenes/pendientes" element={<PendingOrders />} />
                  <Route path="ordenes/historial" element={<AllOrders />} />

                  {/* Legacy redirects for old URLs */}
                  <Route path="crear-orden" element={<Navigate to="/admin/ordenes/nueva" replace />} />
                  <Route path="pendientes" element={<Navigate to="/admin/ordenes/pendientes" replace />} />
                  <Route path="historial" element={<Navigate to="/admin/ordenes/historial" replace />} />

                  {/* Finanzas */}
                  <Route path="finanzas" element={<Navigate to="/admin/finanzas/general" replace />} />
                  <Route path="finanzas/menu" element={<Finanzas />} />
                  <Route path="finanzas/general" element={<FinanceOverview />} />
                  <Route path="finanzas/presupuestos" element={<Presupuestos />} />
                  <Route path="finanzas/recibos" element={<Recibos />} />

                  {/* Coming Soon */}
                  <Route path="agenda" element={<AgendaPage />} />
                  <Route path="contactos" element={<ContactosPage />} />
                  <Route path="ajustes" element={<SettingsPage />} />
                </Route>

                {/* Worker Routes */}
                <Route path="/operario" element={<ProtectedRoute><WorkerLayout /></ProtectedRoute>}>
                  <Route index element={<WorkerDashboard />} />
                  <Route path="historial" element={<WorkerHistory />} />
                </Route>

                {/* Edificio Admin Routes */}
                <Route path="/edificio" element={<ProtectedRoute><EdificioLayout /></ProtectedRoute>}>
                  <Route index element={<EdificioDashboard />} />
                  <Route path="presupuestos" element={<EdificioDashboard />} /> {/* For now reuse dashboard or specific list */}
                  <Route path="reportes" element={<EdificioDashboard />} />    {/* For now reuse dashboard or specific list */}
                </Route>
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ReceiptProvider>
        </BudgetProvider>
      </WorkOrderProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;

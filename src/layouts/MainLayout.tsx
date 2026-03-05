import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './MainLayout.css';

// Mock auth hook for demo
const useAuth = () => {
    return { isAuthenticated: true }; // Toggle this for testing
};

const MainLayout: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated && location.pathname !== '/login') {
        return <Navigate to="/login" replace />;
    }

    if (!isAuthenticated) {
        return <Outlet />;
    }

    return (
        <div className="layout-container">
            <Sidebar />
            <div className="layout-main">
                <Header />
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

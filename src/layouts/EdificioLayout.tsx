import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './MainLayout.css';

const EdificioLayout: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (isAuthenticated === null) return <div style={{ padding: '2rem' }}>Cargando...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <img src="/logo-novak.png" alt="Novak Soluciones" />
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <div className="nav-link active" style={{ cursor: 'default' }}>
                                <span className="nav-icon"><Building2 size={20} /></span>
                                <span className="nav-text">Aprobaciones</span>
                            </div>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <div className="layout-main">
                <header className="header" style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="header-left">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Portal de Administrador de Edificios</h2>
                    </div>
                </header>
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default EdificioLayout;

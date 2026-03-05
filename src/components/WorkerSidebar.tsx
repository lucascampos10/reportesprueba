import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import '../components/Sidebar.css';

const WorkerSidebar: React.FC = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => setIsMobileOpen(!isMobileOpen);

    const handleLogout = () => {
        navigate('/');
    };

    const navItems = [
        { name: 'Mis Órdenes', path: '/operario', icon: <LayoutDashboard size={20} /> },
        { name: 'Historial', path: '/operario/historial', icon: <ClipboardList size={20} /> },
    ];

    return (
        <>
            <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <img src="/logo-novak.png" alt="Novak Soluciones" />
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {navItems.map((item) => (
                            <li key={item.path} className="nav-item">
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/operario'}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => setIsMobileOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {isMobileOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
        </>
    );
};

export default WorkerSidebar;

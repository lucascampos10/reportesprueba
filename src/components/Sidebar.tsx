import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Settings, LogOut, Menu, X, Building2, ClipboardList } from 'lucide-react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => setIsMobileOpen(!isMobileOpen);

    const handleLogout = () => {
        navigate('/');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Nueva Orden', path: '/admin/crear-orden', icon: <FilePlus size={20} /> },
        { name: 'Órdenes Pendientes', path: '/admin/pendientes', icon: <Building2 size={20} /> },
        { name: 'Historial de Órdenes', path: '/admin/historial', icon: <ClipboardList size={20} /> },
        { name: 'Ajustes', path: '/admin/ajustes', icon: <Settings size={20} /> },
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
                                    end={item.path === '/admin'}
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

export default Sidebar;

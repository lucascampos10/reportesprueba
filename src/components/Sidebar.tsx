import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FilePlus, Settings, LogOut, Menu, X,
    ClipboardList, ChevronDown, DollarSign, Calendar, Users,
    FileText, Receipt, ListChecks, Clock, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Sidebar.css';

interface NavGroup {
    label: string;
    icon: React.ReactNode;
    basePath: string;
    soon?: boolean;
    items?: { name: string; path: string; icon: React.ReactNode }[];
    singlePath?: string;
}

// ─── Role-based Navigation Configurations ────────────────────────────────────
const ADMIN_NAV: NavGroup[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, basePath: '/admin', singlePath: '/admin' },
    {
        label: 'Órdenes de Trabajo',
        icon: <ClipboardList size={20} />,
        basePath: '/admin/ordenes',
        items: [
            { name: 'Nueva Orden', path: '/admin/ordenes/nueva', icon: <FilePlus size={16} /> },
            { name: 'Órdenes Pendientes', path: '/admin/ordenes/pendientes', icon: <Clock size={16} /> },
            { name: 'Historial', path: '/admin/ordenes/historial', icon: <ListChecks size={16} /> },
        ],
    },
    {
        label: 'Finanzas',
        icon: <DollarSign size={20} />,
        basePath: '/admin/finanzas',
        items: [
            { name: 'General', path: '/admin/finanzas/general', icon: <TrendingUp size={16} /> },
            { name: 'Presupuestos', path: '/admin/finanzas/presupuestos', icon: <FileText size={16} /> },
            { name: 'Recibos', path: '/admin/finanzas/recibos', icon: <Receipt size={16} /> },
        ],
    },
    { label: 'Agenda', icon: <Calendar size={20} />, basePath: '/admin/agenda', singlePath: '/admin/agenda', soon: true },
    { label: 'Contactos', icon: <Users size={20} />, basePath: '/admin/contactos', singlePath: '/admin/contactos', soon: true },
    { label: 'Ajustes', icon: <Settings size={20} />, basePath: '/admin/ajustes', singlePath: '/admin/ajustes', soon: true },
];

const WORKER_NAV: NavGroup[] = [
    { label: 'Mis Órdenes', icon: <LayoutDashboard size={20} />, basePath: '/operario', singlePath: '/operario' },
    { label: 'Historial', icon: <ClipboardList size={20} />, basePath: '/operario/historial', singlePath: '/operario/historial' },
];

const EDIFICIO_NAV: NavGroup[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, basePath: '/edificio', singlePath: '/edificio' },
    { label: 'Presupuestos', icon: <FileText size={20} />, basePath: '/edificio/presupuestos', singlePath: '/edificio/presupuestos' },
    { label: 'Reportes Vecinos', icon: <ClipboardList size={20} />, basePath: '/edificio/reportes', singlePath: '/edificio/reportes' },
];

const Sidebar: React.FC = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<string[]>(['Órdenes de Trabajo', 'Finanzas']);
    const [userRole, setUserRole] = useState<string>('admin');
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile) setUserRole(profile.role);
            }
        };
        fetchRole();
    }, []);

    const navGroups = userRole === 'operario' ? WORKER_NAV : userRole === 'edificio_admin' ? EDIFICIO_NAV : ADMIN_NAV;

    const toggleSidebar = () => setIsMobileOpen(!isMobileOpen);

    const toggleGroup = (label: string) => {
        setOpenGroups(prev =>
            prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
        );
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isGroupActive = (group: NavGroup) => {
        if (group.singlePath) return location.pathname === group.singlePath;
        return location.pathname.startsWith(group.basePath);
    };

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
                        {navGroups.map((group) => {
                            const active = isGroupActive(group);

                            // Single link (no sub-items)
                            if (group.singlePath) {
                                return (
                                    <li key={group.label} className="nav-item">
                                        <NavLink
                                            to={group.singlePath}
                                            end={['/admin', '/operario', '/edificio'].includes(group.singlePath)}
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${group.soon ? 'nav-link-soon' : ''}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="nav-icon">{group.icon}</span>
                                            <span className="nav-text">{group.label}</span>
                                            {group.soon && <span className="soon-badge">Próx.</span>}
                                        </NavLink>
                                    </li>
                                );
                            }

                            // Group with sub-items
                            const isOpen = openGroups.includes(group.label);
                            return (
                                <li key={group.label} className="nav-item nav-group">
                                    <button
                                        className={`nav-group-header ${active ? 'active' : ''}`}
                                        onClick={() => toggleGroup(group.label)}
                                    >
                                        <span className="nav-icon">{group.icon}</span>
                                        <span className="nav-text">{group.label}</span>
                                        <ChevronDown
                                            size={16}
                                            className={`chevron ${isOpen ? 'open' : ''}`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <ul className="nav-sub-list">
                                            {group.items!.map(item => (
                                                <li key={item.path}>
                                                    <NavLink
                                                        to={item.path}
                                                        className={({ isActive }) => `nav-sub-link ${isActive ? 'active' : ''}`}
                                                        onClick={() => setIsMobileOpen(false)}
                                                    >
                                                        <span className="nav-icon">{item.icon}</span>
                                                        <span>{item.name}</span>
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
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

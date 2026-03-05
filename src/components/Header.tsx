import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Check, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import './Header.css';

const Header: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const isWorker = location.pathname.startsWith('/operario');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // User profile state
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Filter notifications for workers: only show assignment and status changes for their orders
    const visibleNotifications = isWorker
        ? notifications.filter(n => n.type === 'status_change' || n.message.includes('asignada'))
        : notifications;
    const visibleUnreadCount = isWorker
        ? visibleNotifications.filter(n => !n.read).length
        : unreadCount;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'new_order': return '🆕';
            case 'status_change': return '🔄';
            default: return 'ℹ️';
        }
    };

    useEffect(() => {
        const fetchUserMenu = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
                if (data) {
                    setUserName(data.full_name || user.email?.split('@')[0] || '');
                    setUserRole(data.role === 'admin' ? 'Super Administrador' : 'Operario');
                }
            }
        };
        fetchUserMenu();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <header className="app-header">
            <div />

            <div className="header-actions">
                <div className="notification-wrapper" ref={dropdownRef}>
                    <button
                        className="icon-btn notification-btn"
                        aria-label="Notifications"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Bell size={20} />
                        {visibleUnreadCount > 0 && (
                            <span className="notification-badge">{visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}</span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="notification-dropdown">
                            <div className="notif-dropdown-header">
                                <h4>Notificaciones</h4>
                                {visibleUnreadCount > 0 && (
                                    <button className="notif-mark-all" onClick={markAllAsRead}>
                                        <Check size={14} /> Marcar todo leído
                                    </button>
                                )}
                            </div>
                            <div className="notif-dropdown-body">
                                {visibleNotifications.length > 0 ? (
                                    visibleNotifications.slice(0, 15).map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`notif-item ${!notif.read ? 'unread' : ''}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <span className="notif-type-icon">{getTypeIcon(notif.type)}</span>
                                            <div className="notif-content">
                                                <p className="notif-message">{notif.message}</p>
                                                <span className="notif-time">{notif.timestamp}</span>
                                            </div>
                                            {!notif.read && <span className="notif-unread-dot" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="notif-empty">
                                        No hay notificaciones aún.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-profile-wrapper" ref={profileRef}>
                    <div className="user-profile" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                        <div className="avatar">
                            <User size={20} />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{userName || (isWorker ? 'Operario' : 'Admin')}</span>
                            <span className="user-role">{userRole || (isWorker ? 'Operario' : 'Super Administrador')}</span>
                        </div>
                    </div>
                    {isProfileMenuOpen && (
                        <div className="profile-dropdown">
                            <button className="profile-dropdown-item" onClick={handleLogout}>
                                <LogOut size={16} />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

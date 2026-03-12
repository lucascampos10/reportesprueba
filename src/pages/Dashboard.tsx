import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { formatOrderId, useWorkOrders } from '../context/WorkOrderContext';
import {
    CheckCircle2,
    AlertTriangle,
    Building2,
    Clock,
    Droplets,
    MapPin,
    Filter,
    Plus
} from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { orders } = useWorkOrders();
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="status-badge badge-warning">Pendiente</span>;
            case 'in_progress': return <span className="status-badge badge-info">En Progreso</span>;
            case 'resolved': return <span className="status-badge badge-success">Completado</span>;
            default: return <span className="status-badge badge-warning">Pendiente</span>;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'plomería':
            case 'agua':
                return <Droplets className="category-icon text-blue" />;
            case 'electricidad':
                return <AlertTriangle className="category-icon text-yellow" />;
            case 'limpieza':
                return <CheckCircle2 className="category-icon text-green" />;
            default:
                return <AlertTriangle className="category-icon text-yellow" />;
        }
    };

    const activeOrdersCount = orders.filter(o => o.status !== 'resolved').length;
    const resolvedOrdersCount = orders.filter(o => o.status === 'resolved').length;

    // Filter by search
    const filteredOrders = orders.filter(order =>
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.building.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Panel de Control</h1>
                    <p className="page-subtitle">Gestiona las órdenes de trabajo de todos los edificios.</p>
                </div>
                <div className="header-actions-mobile">
                    <Button leftIcon={<Plus size={18} />}>Nueva Orden</Button>
                </div>
            </div>

            <div className="stats-grid">
                <Card hoverable className="stat-card">
                    <CardContent className="stat-content">
                        <div className="stat-info">
                            <p className="stat-label">Órdenes Activas</p>
                            <h3 className="stat-value">{activeOrdersCount}</h3>
                        </div>
                        <div className="stat-icon-wrapper bg-warning-light text-warning">
                            <Clock size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card hoverable className="stat-card">
                    <CardContent className="stat-content">
                        <div className="stat-info">
                            <p className="stat-label">Resueltas (Total)</p>
                            <h3 className="stat-value">{resolvedOrdersCount}</h3>
                        </div>
                        <div className="stat-icon-wrapper bg-success-light text-success">
                            <CheckCircle2 size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Critical Tasks Section */}
            <div className="critical-tasks-section mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={20} className="text-danger" />
                    <h2 className="section-title" style={{ margin: 0 }}>Tareas Críticas (Pendientes de Presupuesto)</h2>
                </div>
                
                <div className="critical-tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {orders.filter(o => o.status === 'pending' && (!o.budgetStatus || o.budgetStatus === 'borrador')).slice(0, 3).length > 0 ? (
                        orders.filter(o => o.status === 'pending' && (!o.budgetStatus || o.budgetStatus === 'borrador')).slice(0, 3).map(order => (
                            <div key={order.id} className="card critical-card" style={{ borderLeft: '4px solid #EF4444', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>{formatOrderId(order.orderNumber)}</span>
                                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Sin Presupuesto</span>
                                </div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'white' }}>{order.title}</h4>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'rgba(255,255,255,0.7)' }}>
                                    {order.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                        <Building2 size={14} />
                                        <span>{order.building}</span>
                                    </div>
                                    <Button size="sm" onClick={() => navigate('/admin/finanzas/presupuestos')}>Presupuestar</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/ -1', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No hay reportes críticos pendientes de presupuesto. ¡Buen trabajo!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="orders-section">
                <div className="section-toolbar">
                    <h2 className="section-title">Órdenes Recientes</h2>
                    <div className="toolbar-actions">
                        <Input
                            placeholder="Buscar órdenes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-mw"
                        />
                        <Button variant="outline" leftIcon={<Filter size={18} />}>
                            Filtrar
                        </Button>
                    </div>
                </div>

                <div className="orders-grid">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <Card key={order.id} hoverable className="order-card">
                                <CardHeader className="order-header">
                                    <div className="order-title-row">
                                        <div className="order-icon-bg">
                                            {getCategoryIcon(order.category)}
                                        </div>
                                        <div className="order-id-status">
                                            <span className="order-id">{formatOrderId(order.orderNumber)}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </div>
                                    <CardTitle className="order-title">{order.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="order-body">
                                    <p className="order-description">{order.description}</p>
                                    <div className="order-details">
                                        <div className="detail-item">
                                            <Building2 size={16} />
                                            <span>{order.building}</span>
                                        </div>
                                        <div className="detail-item">
                                            <MapPin size={16} />
                                            <span>{order.location}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="order-footer">
                                    <div className="reporter-info">
                                        <div className="reporter-avatar">{order.reporterName.charAt(0)}</div>
                                        <span className="reporter-name">{order.reporterName}</span>
                                    </div>
                                    <span className="order-date">{order.date}</span>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-muted">
                            No se encontraron órdenes.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

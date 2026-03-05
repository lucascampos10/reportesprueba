import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
    Building2,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Droplets,
    Plus,
    Filter
} from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
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
                                            <span className="order-id">{order.id}</span>
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

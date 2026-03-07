import React, { useState } from 'react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText, Upload, X
} from 'lucide-react';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import type { WorkOrder, OrderStatus } from '../context/WorkOrderContext';
import './AllOrders.css';

const AllOrders: React.FC = () => {
    const { orders, closeOrder } = useWorkOrders();
    const [filter, setFilter] = useState<'all' | OrderStatus>('all');
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Close order modal - separate state so modals don't conflict
    const [closeOrderTarget, setCloseOrderTarget] = useState<WorkOrder | null>(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeImages, setCloseImages] = useState<string[]>([]);
    const [closeNotes, setCloseNotes] = useState('');

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    const countByStatus = (status: OrderStatus) => orders.filter(o => o.status === status).length;

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'plomería': case 'agua': return <Droplets size={18} className="text-blue" />;
            case 'electricidad': return <AlertTriangle size={18} className="text-yellow" />;
            case 'limpieza': return <CheckCircle2 size={18} className="text-green" />;
            default: return <AlertTriangle size={18} className="text-yellow" />;
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_progress': return 'En Progreso';
            case 'resolved': return 'Resuelta';
        }
    };

    const handleViewDetail = (order: WorkOrder) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const handleOpenCloseModal = (order: WorkOrder) => {
        setCloseOrderTarget(order);
        setCloseImages([]);
        setCloseNotes('');
        setIsDetailOpen(false); // close detail modal if open
        setTimeout(() => setIsCloseModalOpen(true), 100);
    };

    const handleCloseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result && closeImages.length < 3) {
                    setCloseImages([...closeImages, ev.target.result as string]);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleConfirmClose = () => {
        if (!closeOrderTarget) return;
        closeOrder(closeOrderTarget.id, closeImages, closeNotes);
        setIsCloseModalOpen(false);
        setCloseOrderTarget(null);
    };

    return (
        <div className="all-orders-container animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Historial de Órdenes</h1>
                    <p className="page-subtitle">Consulta todas las órdenes, incluyendo las resueltas con evidencia fotográfica.</p>
                </div>
            </div>

            {/* Filter chips */}
            <div className="orders-filter-bar">
                <button
                    className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas <span className="chip-count">{orders.length}</span>
                </button>
                <button
                    className={`filter-chip ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pendientes <span className="chip-count">{countByStatus('pending')}</span>
                </button>
                <button
                    className={`filter-chip ${filter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setFilter('in_progress')}
                >
                    En Progreso <span className="chip-count">{countByStatus('in_progress')}</span>
                </button>
                <button
                    className={`filter-chip ${filter === 'resolved' ? 'active' : ''}`}
                    onClick={() => setFilter('resolved')}
                >
                    Resueltas <span className="chip-count">{countByStatus('resolved')}</span>
                </button>
            </div>

            {/* Orders list */}
            <div className="orders-list">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className="order-list-card"
                            onClick={() => handleViewDetail(order)}
                        >
                            <div className={`order-status-stripe stripe-${order.status}`} />
                            <div className="order-list-body">
                                <div className="order-list-top">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {getCategoryIcon(order.category)}
                                        <h4 className="order-list-title">{order.title}</h4>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={`status-badge badge-${order.status === 'pending' ? 'warning' : order.status === 'in_progress' ? 'info' : 'success'}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        {order.status !== 'resolved' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCloseModal(order);
                                                }}
                                            >
                                                Cerrar Orden
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="order-list-meta">
                                    <span className="meta-inline"><Building2 size={14} /> {order.building}</span>
                                    <span className="meta-inline"><MapPin size={14} /> {order.location}</span>
                                    <span className="meta-inline"><User size={14} /> {order.reporterName}</span>
                                    <span className="meta-inline"><Clock size={14} /> {order.date}</span>
                                    <span className="order-list-id">{formatOrderId(order.orderNumber)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No hay órdenes con este filtro.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detail modal (especially for resolved orders) */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Detalle: ${selectedOrder?.id}`}
                maxWidth="750px"
            >
                {selectedOrder && (
                    <div className="resolved-detail">
                        <div className="resolved-info-grid">
                            <div className="resolved-info-item">
                                <Building2 size={16} className="info-icon" />
                                <div>
                                    <span className="info-label">Edificio</span>
                                    <span className="info-value">{selectedOrder.building}</span>
                                </div>
                            </div>
                            <div className="resolved-info-item">
                                <MapPin size={16} className="info-icon" />
                                <div>
                                    <span className="info-label">Ubicación</span>
                                    <span className="info-value">{selectedOrder.location}</span>
                                </div>
                            </div>
                            <div className="resolved-info-item">
                                <User size={16} className="info-icon" />
                                <div>
                                    <span className="info-label">Reportado por</span>
                                    <span className="info-value">{selectedOrder.reporterName}</span>
                                </div>
                            </div>
                            <div className="resolved-info-item">
                                <Clock size={16} className="info-icon" />
                                <div>
                                    <span className="info-label">Fecha del reporte</span>
                                    <span className="info-value">{selectedOrder.date}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} /> Descripción
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{selectedOrder.description}</p>
                        </div>

                        {/* Before / After photos */}
                        <div className="photos-comparison">
                            <div className="photos-column">
                                <h4 className="photos-column-title before">
                                    <Camera size={16} /> Fotos del Reporte (Antes)
                                </h4>
                                {selectedOrder.images.length > 0 ? (
                                    <div className="photo-grid">
                                        {selectedOrder.images.map((img, i) => (
                                            <img key={i} src={img} alt={`Antes ${i + 1}`} className="comparison-photo" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-photos-placeholder">Sin fotos del reporte</div>
                                )}
                            </div>

                            <div className="photos-column">
                                <h4 className="photos-column-title after">
                                    <CheckCircle2 size={16} /> Fotos de Resolución (Después)
                                </h4>
                                {selectedOrder.resolvedImages && selectedOrder.resolvedImages.length > 0 ? (
                                    <div className="photo-grid">
                                        {selectedOrder.resolvedImages.map((img, i) => (
                                            <img key={i} src={img} alt={`Después ${i + 1}`} className="comparison-photo" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-photos-placeholder">
                                        {selectedOrder.status === 'resolved' ? 'No se adjuntaron fotos de resolución' : 'Orden aún no resuelta'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resolution notes */}
                        {selectedOrder.status === 'resolved' && selectedOrder.resolutionNotes && (
                            <div className="resolution-notes-box">
                                <h4><CheckCircle2 size={16} /> Notas de Resolución</h4>
                                <p>{selectedOrder.resolutionNotes}</p>
                            </div>
                        )}

                        {selectedOrder.resolvedDate && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                                Resuelta el: {selectedOrder.resolvedDate}
                            </p>
                        )}
                    </div>
                )}
            </Modal>

            {/* Close order modal */}
            <Modal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                title={`Cerrar Orden: ${closeOrderTarget?.id}`}
                maxWidth="500px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmClose}>Confirmar Cierre</Button>
                    </>
                }
            >
                <div className="close-order-form">
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Sube las fotos de cómo quedó el trabajo y deja tus notas de resolución.
                    </p>

                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Camera size={16} /> Fotos del resultado (después)
                        </label>
                        <label className="close-upload-zone">
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleCloseImageUpload}
                            />
                            <Upload size={24} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                Haz clic para subir fotos (máx. 3)
                            </p>
                        </label>
                        {closeImages.length > 0 && (
                            <div className="close-preview-grid">
                                {closeImages.map((img, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={img} alt={`Preview ${i}`} className="close-preview-thumb" />
                                        <button
                                            onClick={() => setCloseImages(closeImages.filter((_, idx) => idx !== i))}
                                            style={{
                                                position: 'absolute', top: '-6px', right: '-6px',
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                background: 'var(--color-danger)', border: 'none',
                                                color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notas de resolución</label>
                        <textarea
                            className="form-textarea minimal-textarea"
                            placeholder="Describe qué se hizo para resolver el problema..."
                            rows={4}
                            value={closeNotes}
                            onChange={(e) => setCloseNotes(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AllOrders;

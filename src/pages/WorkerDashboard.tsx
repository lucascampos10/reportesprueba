import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import { supabase } from '../lib/supabase';
import './WorkerDashboard.css';

const PAGE_SIZE = 20;

const WorkerDashboard: React.FC = () => {
    const { orders, updateOrderStatus } = useWorkOrders();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentWorkerId, setCurrentWorkerId] = useState<string>('');
    const [workerName, setWorkerName] = useState<string>('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentWorkerId(user.id);
                const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (data) {
                    setWorkerName(data.full_name);
                }
            }
        };
        fetchUser();
    }, []);

    // Show only active orders assigned to the current logged-in worker
    const myActiveOrders = orders.filter(
        o => o.assignedToId === currentWorkerId && o.status === 'in_progress'
    );

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const activeCount = myActiveOrders.length;
    const resolvedCount = orders.filter(o => o.assignedToId === currentWorkerId && o.status === 'resolved').length;

    const totalPages = Math.max(1, Math.ceil(myActiveOrders.length / PAGE_SIZE));
    const pagedOrders = myActiveOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleViewDetail = (order: WorkOrder) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const handleMarkResolved = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation(); // prevent modal opening
        if (window.confirm('¿Confirmas que terminaste este trabajo? El administrador deberá aprobar el cierre con fotos.')) {
            try {
                // Change status to resolved. Note: The complete flow requires photos, 
                // but this allows the worker to unblock their queue.
                await updateOrderStatus(orderId, 'resolved');
                setIsDetailOpen(false);
            } catch (error) {
                console.error("Error updating status:", error);
                alert("Hubo un error al actualizar el estado de la orden.");
            }
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'plomería': case 'agua': return <Droplets size={24} />;
            case 'electricidad': return <AlertTriangle size={24} />;
            case 'limpieza': return <CheckCircle2 size={24} />;
            default: return <AlertTriangle size={24} />;
        }
    };

    return (
        <div className="worker-dashboard animate-fade-in">
            {/* Welcome Banner */}
            <div className="worker-welcome">
                <h1>Hola, {workerName || 'Operario'}</h1>
                <p>Acá tenés el resumen de tus tareas de hoy.</p>
            </div>

            {/* Quick Stats */}
            <div className="worker-stats-row">
                <div className="worker-stat-card">
                    <div className="worker-stat-icon progress">
                        <Clock size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{activeCount}</div>
                        <div className="stat-desc">En Progreso</div>
                    </div>
                </div>
                <div className="worker-stat-card">
                    <div className="worker-stat-icon done">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{resolvedCount}</div>
                        <div className="stat-desc">Completadas</div>
                    </div>
                </div>
                <div className="worker-stat-card" style={{ opacity: 0.7 }}>
                    <div className="worker-stat-icon pending">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{pendingCount}</div>
                        <div className="stat-desc">En espera gral.</div>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="worker-orders-section">
                <h2>Tus Órdenes Activas</h2>

                {myActiveOrders.length > 0 ? (
                    <>
                        <div style={{ padding: '0 0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Mostrando {pagedOrders.length} de {myActiveOrders.length} orden{myActiveOrders.length !== 1 ? 'es' : ''}</span>
                        </div>

                        <div className="worker-order-list">
                            {pagedOrders.map(order => (
                                <div key={order.id} className="worker-order-card" onClick={() => handleViewDetail(order)}>
                                    <div className="worker-order-stripe stripe-in_progress" />
                                    <div className="worker-order-body">
                                        <div className="worker-order-top" style={{ alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <div className="icon-col text-primary-dark">
                                                    {getCategoryIcon(order.category)}
                                                </div>
                                                <h4 className="worker-order-title">{order.title}</h4>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span className={`worker-order-priority p-${order.priority}`}>
                                                    {order.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="worker-order-meta" style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <span className="order-list-id-badge" style={{ background: 'var(--color-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center' }}>
                                                    {formatOrderId(order.orderNumber)}
                                                </span>
                                                <span className="meta-inline"><Building2 size={14} /> {order.building}</span>
                                                <span className="meta-inline"><MapPin size={14} /> {order.location}</span>
                                                <span className="meta-inline"><Clock size={14} /> {order.date}</span>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem' }}
                                                onClick={(e) => handleMarkResolved(e, order.id)}
                                            >
                                                <Check size={14} /> Listo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)} style={{ background: p === page ? 'var(--color-primary)' : 'var(--color-surface)', color: p === page ? '#fff' : 'var(--color-text)', border: '1px solid var(--color-border)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: p === page ? 700 : 500, transition: 'all 0.2s' }}>
                                        {p}
                                    </button>
                                ))}
                                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="worker-empty">
                                No tenés ninguna orden en progreso en este momento.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detail modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Orden: ${selectedOrder ? formatOrderId(selectedOrder.orderNumber) : ''}`}
                maxWidth="700px"
            >
                {selectedOrder && (
                    <div className="worker-detail">
                        <div className="worker-detail-info-grid">
                            <div className="worker-detail-info-item">
                                <Building2 size={16} className="icon-col" />
                                <div>
                                    <span className="label">Edificio</span>
                                    <span className="value">{selectedOrder.building}</span>
                                </div>
                            </div>
                            <div className="worker-detail-info-item">
                                <MapPin size={16} className="icon-col" />
                                <div>
                                    <span className="label">Ubicación</span>
                                    <span className="value">{selectedOrder.location}</span>
                                </div>
                            </div>
                            <div className="worker-detail-info-item">
                                <User size={16} className="icon-col" />
                                <div>
                                    <span className="label">Reportado por</span>
                                    <span className="value">{selectedOrder.reporterName}</span>
                                </div>
                            </div>
                            <div className="worker-detail-info-item">
                                <Clock size={16} className="icon-col" />
                                <div>
                                    <span className="label">Fecha</span>
                                    <span className="value">{selectedOrder.date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="worker-desc-box">
                            <h4><FileText size={16} /> Descripción d. Problema</h4>
                            <p>{selectedOrder.description}</p>
                        </div>

                        {selectedOrder.images && selectedOrder.images.length > 0 && (
                            <div className="worker-photos-section">
                                <h4><Camera size={16} /> Fotos del reporte</h4>
                                <div className="worker-photos-grid">
                                    {selectedOrder.images.map((img, idx) => (
                                        <img key={idx} src={img} alt={`Evidencia ${idx}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="worker-contact-box">
                            <h4><AlertTriangle size={16} /> Contacto</h4>
                            <p>Si necesitás más detalles, comunicate con el solicitante vía {selectedOrder.contactMethod}: <strong>{selectedOrder.contactValue}</strong></p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WorkerDashboard;

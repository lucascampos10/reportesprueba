import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText
} from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import { supabase } from '../lib/supabase';
import './WorkerDashboard.css';

const WorkerHistory: React.FC = () => {
    const { orders } = useWorkOrders();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentWorkerId, setCurrentWorkerId] = useState<string>('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentWorkerId(user.id);
            }
        };
        fetchUser();
    }, []);

    // Show only resolved orders assigned to the current logged-in worker
    const myResolvedOrders = orders.filter(
        o => o.assignedToId === currentWorkerId && o.status === 'resolved'
    );

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'plomería': case 'agua': return <Droplets size={18} className="text-blue" />;
            case 'electricidad': return <AlertTriangle size={18} className="text-yellow" />;
            case 'limpieza': return <CheckCircle2 size={18} className="text-green" />;
            default: return <AlertTriangle size={18} className="text-yellow" />;
        }
    };

    return (
        <div className="worker-dashboard animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Mi Historial</h1>
                    <p className="page-subtitle">Órdenes que completaste, con fotos de antes y después.</p>
                </div>
            </div>

            {myResolvedOrders.length > 0 ? (
                <div className="worker-order-list">
                    {myResolvedOrders.map(order => (
                        <div key={order.id} className="worker-order-card" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}>
                            <div className="worker-order-stripe stripe-resolved" />
                            <div className="worker-order-body">
                                <div className="worker-order-top">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {getCategoryIcon(order.category)}
                                        <h4 className="worker-order-title">{order.title}</h4>
                                    </div>
                                    <span className="status-badge badge-success">Resuelta</span>
                                </div>
                                <div className="worker-order-meta">
                                    <span className="meta-inline"><Building2 size={14} /> {order.building}</span>
                                    <span className="meta-inline"><MapPin size={14} /> {order.location}</span>
                                    <span className="meta-inline"><Clock size={14} /> {order.resolvedDate || order.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent>
                        <div className="worker-empty">
                            Todavía no tenés órdenes completadas.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail modal with before/after */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Orden: ${selectedOrder?.id}`}
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
                                    <span className="label">Resuelta el</span>
                                    <span className="value">{selectedOrder.resolvedDate || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="worker-desc-box">
                            <h4><FileText size={16} /> Descripción</h4>
                            <p>{selectedOrder.description}</p>
                        </div>

                        {/* Before / After */}
                        <div className="photos-comparison">
                            <div className="photos-column">
                                <h4 className="photos-column-title before">
                                    <Camera size={16} /> Antes
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
                                    <CheckCircle2 size={16} /> Después
                                </h4>
                                {selectedOrder.resolvedImages && selectedOrder.resolvedImages.length > 0 ? (
                                    <div className="photo-grid">
                                        {selectedOrder.resolvedImages.map((img, i) => (
                                            <img key={i} src={img} alt={`Después ${i + 1}`} className="comparison-photo" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-photos-placeholder">Sin fotos de resolución</div>
                                )}
                            </div>
                        </div>

                        {selectedOrder.resolutionNotes && (
                            <div className="resolution-notes-box">
                                <h4><CheckCircle2 size={16} /> Notas de Resolución</h4>
                                <p>{selectedOrder.resolutionNotes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WorkerHistory;

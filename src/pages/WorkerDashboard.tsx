import React, { useState } from 'react';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText, Phone, Mail, Upload, X
} from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import { supabase } from '../lib/supabase';
import './WorkerDashboard.css';

const WorkerDashboard: React.FC = () => {
    const { orders, closeOrder } = useWorkOrders();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentWorkerId, setCurrentWorkerId] = useState<string>('');
    const [currentWorkerName, setCurrentWorkerName] = useState('Operario');

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentWorkerId(user.id);
                // Try fetching full name
                const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (data && data.full_name) {
                    setCurrentWorkerName(data.full_name);
                }
            }
        };
        fetchUser();
    }, []);

    // Close order modal
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeTarget, setCloseTarget] = useState<WorkOrder | null>(null);
    const [closeImages, setCloseImages] = useState<string[]>([]);
    const [closeNotes, setCloseNotes] = useState('');

    // Filter orders assigned to this worker
    const myOrders = orders.filter(o => o.assignedToId === currentWorkerId);
    const pendingCount = myOrders.filter(o => o.status === 'pending').length;
    const inProgressCount = myOrders.filter(o => o.status === 'in_progress').length;
    const resolvedCount = myOrders.filter(o => o.status === 'resolved').length;
    const activeOrders = myOrders.filter(o => o.status !== 'resolved');

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'plomería': case 'agua': return <Droplets size={18} className="text-blue" />;
            case 'electricidad': return <AlertTriangle size={18} className="text-yellow" />;
            case 'limpieza': return <CheckCircle2 size={18} className="text-green" />;
            default: return <AlertTriangle size={18} className="text-yellow" />;
        }
    };

    const handleViewDetail = (order: WorkOrder) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const handleOpenCloseModal = (order: WorkOrder) => {
        setCloseTarget(order);
        setCloseImages([]);
        setCloseNotes('');
        setIsDetailOpen(false);
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

    const handleConfirmClose = async () => {
        if (!closeTarget) return;
        try {
            await closeOrder(closeTarget.id, closeImages, closeNotes);
            setIsCloseModalOpen(false);
            setCloseTarget(null);
        } catch (error) {
            console.error('Error cerrando orden:', error);
            alert('Hubo un error al cerrar la orden.');
        }
    };

    return (
        <div className="worker-dashboard animate-fade-in">
            <div className="worker-welcome">
                <h1>👋 Hola, {currentWorkerName}</h1>
                <p>Acá están tus órdenes de trabajo asignadas.</p>
            </div>

            {/* Stats */}
            <div className="worker-stats-row">
                <div className="worker-stat-card">
                    <div className="worker-stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{pendingCount}</div>
                        <div className="stat-desc">Pendientes</div>
                    </div>
                </div>
                <div className="worker-stat-card">
                    <div className="worker-stat-icon progress">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{inProgressCount}</div>
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
            </div>

            {/* Active orders */}
            <div className="worker-orders-section">
                <h2>📋 Órdenes Activas</h2>
                {activeOrders.length > 0 ? (
                    <div className="worker-order-list">
                        {activeOrders.map(order => (
                            <div key={order.id} className="worker-order-card" onClick={() => handleViewDetail(order)}>
                                <div className={`worker-order-stripe stripe-${order.status}`} />
                                <div className="worker-order-body">
                                    <div className="worker-order-top">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {getCategoryIcon(order.category)}
                                            <h4 className="worker-order-title">{order.title}</h4>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span className={`worker-order-priority p-${order.priority}`}>
                                                {order.priority === 'alta' ? 'Alta' : order.priority === 'media' ? 'Media' : 'Baja'}
                                            </span>
                                            <span className={`status-badge badge-${order.status === 'pending' ? 'warning' : 'info'}`}>
                                                {order.status === 'pending' ? 'Pendiente' : 'En Progreso'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="worker-order-meta">
                                        <span className="meta-inline"><Building2 size={14} /> {order.building}</span>
                                        <span className="meta-inline"><MapPin size={14} /> {order.location}</span>
                                        <span className="meta-inline"><Clock size={14} /> {order.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="worker-empty">
                                🎉 ¡No tenés órdenes activas! Todo al día.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Order detail modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={selectedOrder?.title || ''}
                maxWidth="700px"
                footer={
                    selectedOrder && selectedOrder.status !== 'resolved' ? (
                        <>
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            <Button onClick={() => handleOpenCloseModal(selectedOrder)}>
                                <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} />
                                Marcar como Resuelta
                            </Button>
                        </>
                    ) : undefined
                }
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
                                <Building2 size={16} className="icon-col" />
                                <div>
                                    <span className="label">Departamento</span>
                                    <span className="value">{selectedOrder.department}</span>
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
                            <div className="worker-detail-info-item">
                                <FileText size={16} className="icon-col" />
                                <div>
                                    <span className="label">ID Orden</span>
                                    <span className="value">{selectedOrder.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="worker-desc-box">
                            <h4><FileText size={16} /> Descripción del Problema</h4>
                            <p>{selectedOrder.description}</p>
                        </div>

                        {/* Photos */}
                        {selectedOrder.images.length > 0 && (
                            <div className="worker-photos-section">
                                <h4><Camera size={16} /> Fotos del Reporte</h4>
                                <div className="worker-photos-grid">
                                    {selectedOrder.images.map((img, i) => (
                                        <img key={i} src={img} alt={`Foto ${i + 1}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact info */}
                        <div className="worker-contact-box">
                            <h4>
                                {selectedOrder.contactMethod === 'whatsapp' ? <Phone size={16} /> : <Mail size={16} />}
                                Contacto del Reportante
                            </h4>
                            <p>
                                <strong>{selectedOrder.reporterName}</strong> — {selectedOrder.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}: {selectedOrder.contactValue}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Close order modal */}
            <Modal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                title={`Cerrar Orden: ${closeTarget?.id}`}
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
                        Subí las fotos del trabajo terminado y dejá tus notas.
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
                                Hacé clic para subir fotos (máx. 3)
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
                            placeholder="Describí qué hiciste para resolver el problema..."
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

export default WorkerDashboard;

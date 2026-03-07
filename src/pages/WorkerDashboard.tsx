import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText, ChevronLeft, ChevronRight, Play, Upload, X
} from 'lucide-react';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import { uploadImage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import './WorkerDashboard.css';

const PAGE_SIZE = 20;

const WorkerDashboard: React.FC = () => {
    const { orders, updateOrderStatus, closeOrder } = useWorkOrders();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Start Task Confirmation State
    const [startOrderTarget, setStartOrderTarget] = useState<WorkOrder | null>(null);
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);

    // Close Order State
    const [closeOrderTarget, setCloseOrderTarget] = useState<WorkOrder | null>(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeImages, setCloseImages] = useState<string[]>([]);      // preview URLs
    const [closeImageFiles, setCloseImageFiles] = useState<File[]>([]);
    const [closeNotes, setCloseNotes] = useState('');

    // Toast Notification State
    const [toastMessage, setToastMessage] = useState<{ title: string, type: 'success' | 'error' } | null>(null);

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

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Show pending and in_progress orders assigned to this worker
    const myActiveOrders = orders.filter(
        o => o.assignedToId === currentWorkerId && (o.status === 'in_progress' || o.status === 'pending')
    );

    const pendingCount = myActiveOrders.filter(o => o.status === 'pending').length;
    const activeCount = myActiveOrders.filter(o => o.status === 'in_progress').length;
    const resolvedCount = orders.filter(o => o.assignedToId === currentWorkerId && o.status === 'resolved').length;

    const totalPages = Math.max(1, Math.ceil(myActiveOrders.length / PAGE_SIZE));
    const pagedOrders = myActiveOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleViewDetail = (order: WorkOrder) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    const handleOpenStartModal = (e: React.MouseEvent, order: WorkOrder) => {
        e.stopPropagation();
        setStartOrderTarget(order);
        setIsDetailOpen(false);
        setTimeout(() => setIsStartModalOpen(true), 100);
    };

    const handleConfirmStartTask = async () => {
        if (!startOrderTarget) return;
        try {
            await updateOrderStatus(startOrderTarget.id, 'in_progress');
            setIsStartModalOpen(false);
            setStartOrderTarget(null);
            showToast('Tarea iniciada exitosamente', 'success');
        } catch (error) {
            console.error("Error starting task:", error);
            showToast('Hubo un error al iniciar la tarea', 'error');
        }
    };

    const handleOpenCloseModal = (e: React.MouseEvent, order: WorkOrder) => {
        e.stopPropagation();
        setCloseOrderTarget(order);
        setCloseImages([]);
        setCloseImageFiles([]);
        setCloseNotes('');
        setIsDetailOpen(false);
        setTimeout(() => setIsCloseModalOpen(true), 100);
    };

    const handleCloseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && closeImages.length < 3) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setCloseImages(prev => [...prev, previewUrl]);
            setCloseImageFiles(prev => [...prev, file]);
        }
    };

    const handleConfirmClose = async () => {
        if (!closeOrderTarget) return;
        if (closeImageFiles.length === 0) {
            showToast('Adjuntá al menos una foto del trabajo terminado', 'error');
            return;
        }
        if (!closeNotes.trim()) {
            showToast('Agrega una breve descripción', 'error');
            return;
        }

        try {
            const uploadedUrls: string[] = [];
            for (const file of closeImageFiles) {
                const url = await uploadImage(file, 'resoluciones');
                uploadedUrls.push(url);
            }
            await closeOrder(closeOrderTarget.id, uploadedUrls, closeNotes);
            setIsCloseModalOpen(false);
            setCloseOrderTarget(null);
            showToast('Tarea finalizada y enviada', 'success');
        } catch (error) {
            console.error('Error closing order from worker:', error);
            showToast('Hubo un error al cerrar la orden', 'error');
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
        <div className="worker-dashboard animate-fade-in" style={{ position: 'relative' }}>

            {/* Custom Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    zIndex: 9999,
                    animation: 'slideInRight 0.3s ease-out forwards'
                }}>
                    {toastMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{toastMessage.title}</span>
                </div>
            )}

            {/* Welcome Banner */}
            <div className="worker-welcome">
                <h1>Hola, {workerName || 'Operario'}</h1>
                <p>Acá tenés el resumen de tus tareas de hoy.</p>
            </div>

            {/* Quick Stats */}
            <div className="worker-stats-row">
                <div className="worker-stat-card">
                    <div className="worker-stat-icon pending">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="worker-stat-info">
                        <div className="stat-number">{pendingCount}</div>
                        <div className="stat-desc">Tareas Asignadas</div>
                    </div>
                </div>
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
            </div>

            {/* Orders List */}
            <div className="worker-orders-section">
                <h2>Tus Tareas</h2>

                {myActiveOrders.length > 0 ? (
                    <>
                        <div style={{ padding: '0 0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Mostrando {pagedOrders.length} de {myActiveOrders.length} orden{myActiveOrders.length !== 1 ? 'es' : ''}</span>
                        </div>

                        <div className="worker-order-list">
                            {pagedOrders.map(order => (
                                <div key={order.id} className="worker-order-card" onClick={() => handleViewDetail(order)}>
                                    <div className={`worker-order-stripe stripe-${order.status}`} />
                                    <div className="worker-order-body">
                                        <div className="worker-order-top" style={{ alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <div className="icon-col text-primary-dark">
                                                    {getCategoryIcon(order.category)}
                                                </div>
                                                <h4 className="worker-order-title">{order.title}</h4>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span className={`status-badge badge-${order.status === 'pending' ? 'warning' : 'info'}`}>
                                                    {order.status === 'pending' ? 'Pendiente' : 'En Progreso'}
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
                                            <div>
                                                {order.status === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => handleOpenStartModal(e, order)}
                                                    >
                                                        <Play size={14} style={{ marginRight: '0.3rem' }} /> Comenzar Tarea
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => handleOpenCloseModal(e, order)}
                                                    >
                                                        <CheckCircle2 size={14} style={{ marginRight: '0.3rem' }} /> Finalizar Tarea
                                                    </Button>
                                                )}
                                            </div>
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
                                No tenés ninguna tarea asignada en este momento.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detail modal for info only */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Orden: ${selectedOrder ? formatOrderId(selectedOrder.orderNumber) : ''}`}
                maxWidth="700px"
                footer={
                    selectedOrder && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '1rem' }}>
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            {selectedOrder.status === 'pending' ? (
                                <Button onClick={(e) => handleOpenStartModal(e, selectedOrder)}>
                                    <Play size={16} style={{ marginRight: '0.5rem' }} /> Comenzar Tarea
                                </Button>
                            ) : (
                                <Button onClick={(e) => handleOpenCloseModal(e, selectedOrder)}>
                                    <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} /> Finalizar Tarea
                                </Button>
                            )}
                        </div>
                    )
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

            {/* Start Task Confirmation Modal */}
            <Modal
                isOpen={isStartModalOpen}
                onClose={() => setIsStartModalOpen(false)}
                title="Comenzar Tarea"
                maxWidth="400px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsStartModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmStartTask}>
                            <Play size={16} style={{ marginRight: '0.5rem' }} /> Confirmar e Iniciar
                        </Button>
                    </>
                }
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <Play size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>¿Comenzar esta tarea?</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        Al confirmar, esta orden ({startOrderTarget ? formatOrderId(startOrderTarget.orderNumber) : ''}) pasará a estado "En Progreso" y se notificará a administración.
                    </p>
                </div>
            </Modal>

            {/* Close order modal (For the worker) */}
            <Modal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                title={`Finalizar Tarea: ${closeOrderTarget ? formatOrderId(closeOrderTarget.orderNumber) : ''}`}
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
                        Para finalizar esta tarea, adjuntá fotos del resultado y detallá lo que hiciste. Esta información llegará a administración.
                    </p>

                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Camera size={16} /> Fotos del trabajo terminado (Obligatorio)
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
                        <label className="form-label">Detalles de la resolución (Obligatorio)</label>
                        <textarea
                            className="form-textarea minimal-textarea"
                            placeholder="Ej: Se cambió la lamparita por una de 10W..."
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

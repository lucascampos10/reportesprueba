import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import {
    Building2, MapPin, Clock, User, Camera, CheckCircle2,
    AlertTriangle, Droplets, FileText, Upload, X, SlidersHorizontal, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import type { WorkOrder, OrderStatus } from '../context/WorkOrderContext';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import { generateBudgetPDF } from './EdificioDashboard';
import { uploadImage } from '../lib/storage';
import './AllOrders.css';

const PAGE_SIZE = 20;
type SortKey = 'date_desc' | 'date_asc' | 'priority_high' | 'priority_low';

const AllOrders: React.FC = () => {
    const { orders, closeOrder } = useWorkOrders();
    const { budgets, fetchBudgets } = useBudgets();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        // Asegurar que los presupuestos estén cargados si el usuario entra directo a esta vista
        if (budgets.length === 0) fetchBudgets();
    }, []);

    // Close order modal - separate state so modals don't conflict
    const [closeOrderTarget, setCloseOrderTarget] = useState<WorkOrder | null>(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeImages, setCloseImages] = useState<string[]>([]);      // preview URLs
    const [closeImageFiles, setCloseImageFiles] = useState<File[]>([]); // File objects
    const [closeNotes, setCloseNotes] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    // Filter & sort state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
    const [filterBuilding, setFilterBuilding] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterReporter, setFilterReporter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date_desc');
    const [page, setPage] = useState(1);

    const countByStatus = (status: OrderStatus) => orders.filter(o => o.status === status).length;
    const uniqueBuildings = [...new Set(orders.map(o => o.building).filter(Boolean))];
    const hasActiveFilters = filterBuilding || filterPriority || filterReporter || filterStatus !== 'all';

    // Apply filters
    let processedOrders = orders
        .filter(o => filterStatus === 'all' || o.status === filterStatus)
        .filter(o => !filterBuilding || o.building === filterBuilding)
        .filter(o => !filterPriority || o.priority === filterPriority)
        .filter(o => !filterReporter || o.reporterName.toLowerCase().includes(filterReporter.toLowerCase()));

    // Apply sort
    processedOrders = [...processedOrders].sort((a, b) => {
        if (sortKey === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortKey === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        const priorityOrder = { alta: 3, media: 2, baja: 1 };
        if (sortKey === 'priority_high') return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (sortKey === 'priority_low') return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        return 0;
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(processedOrders.length / PAGE_SIZE));
    const pagedOrders = processedOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleClearFilters = () => {
        setFilterStatus('all');
        setFilterBuilding('');
        setFilterPriority('');
        setFilterReporter('');
        setSortKey('date_desc');
        setPage(1);
    };

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
        if (closeImageFiles.length === 0) { alert('Adjuntá al menos una foto.'); return; }
        if (!closeNotes.trim()) { alert('Completá las notas de resolución.'); return; }
        setIsClosing(true);
        try {
            const uploadedUrls: string[] = [];
            for (const file of closeImageFiles) {
                const url = await uploadImage(file, 'resoluciones');
                uploadedUrls.push(url);
            }
            await closeOrder(closeOrderTarget.id, uploadedUrls, closeNotes);
            setIsCloseModalOpen(false);
            setCloseOrderTarget(null);
        } catch (err) {
            console.error('Error closing order:', err);
            alert('Hubo un error al cerrar la orden.');
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <div className="all-orders-container animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Historial de Órdenes</h1>
                    <p className="page-subtitle">Consulta todas las órdenes, incluyendo las resueltas con evidencia fotográfica.</p>
                </div>
            </div>

            {/* Filter controls */}
            <div style={{ marginBottom: '1.5rem' }}>
                <Card className="filter-card mix-glass">
                    <CardContent className="p-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: isFilterOpen ? '1rem' : '0' }}>
                            <Button
                                variant={isFilterOpen ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                            >
                                <SlidersHorizontal size={15} style={{ marginRight: '0.375rem' }} />
                                Filtrar y Ordenar
                                {hasActiveFilters && <span style={{ marginLeft: '0.375rem', background: 'var(--color-primary-dark)', color: '#fff', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>!</span>}
                            </Button>

                            {/* Quick Status Chips */}
                            <div className="quick-filter-chips" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: '0.5rem' }}>
                                <button className={`chip-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>
                                    Todas <span className="chip-count">{orders.length}</span>
                                </button>
                                <button className={`chip-btn ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => { setFilterStatus('pending'); setPage(1); }}>
                                    Pendientes <span className="chip-count">{countByStatus('pending')}</span>
                                </button>
                                <button className={`chip-btn ${filterStatus === 'in_progress' ? 'active' : ''}`} onClick={() => { setFilterStatus('in_progress'); setPage(1); }}>
                                    En Progreso <span className="chip-count">{countByStatus('in_progress')}</span>
                                </button>
                                <button className={`chip-btn ${filterStatus === 'resolved' ? 'active' : ''}`} onClick={() => { setFilterStatus('resolved'); setPage(1); }}>
                                    Resueltas <span className="chip-count">{countByStatus('resolved')}</span>
                                </button>
                            </div>

                            {hasActiveFilters && (
                                <button onClick={handleClearFilters} style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', background: 'none', border: 'none' }}>
                                    <X size={13} /> Limpiar filtros
                                </button>
                            )}
                        </div>

                        {isFilterOpen && (
                            <div className="filter-panel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <div className="filter-group">
                                    <label className="filter-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Ordenar por</label>
                                    <select className="form-select" value={sortKey} onChange={e => { setSortKey(e.target.value as SortKey); setPage(1); }}>
                                        <option value="date_desc">Fecha (más nueva primero)</option>
                                        <option value="date_asc">Fecha (más antigua primero)</option>
                                        <option value="priority_high">Prioridad (alta primero)</option>
                                        <option value="priority_low">Prioridad (baja primero)</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Edificio</label>
                                    <select className="form-select" value={filterBuilding} onChange={e => { setFilterBuilding(e.target.value); setPage(1); }}>
                                        <option value="">Todos</option>
                                        {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Prioridad</label>
                                    <select className="form-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
                                        <option value="">Todas</option>
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Reportado por</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Buscar por nombre..."
                                        value={filterReporter}
                                        onChange={e => { setFilterReporter(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Orders list */}
            <div className="orders-list">
                <div style={{ padding: '0 0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Mostrando {pagedOrders.length} de {processedOrders.length} orden{processedOrders.length !== 1 ? 'es' : ''}</span>
                </div>

                {pagedOrders.length > 0 ? (
                    pagedOrders.map(order => (
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
                                        {order.budgetStatus && order.budgetStatus !== 'aprobado' && (
                                            <span className={`status-badge badge-${order.budgetStatus === 'borrador' ? 'warning' : order.budgetStatus === 'enviado' ? 'info' : 'danger'}`}>
                                                {order.budgetStatus === 'borrador' ? 'Pendiente de Envío' : `Presupuesto ${order.budgetStatus.charAt(0).toUpperCase() + order.budgetStatus.slice(1)}`}
                                            </span>
                                        )}
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
                                    <span className="order-list-id-badge" style={{ background: 'var(--color-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center' }}>
                                        {formatOrderId(order.orderNumber)}
                                    </span>
                                    <span className="meta-inline"><Building2 size={14} /> {order.building}</span>
                                    <span className="meta-inline"><MapPin size={14} /> {order.location}</span>
                                    <span className="meta-inline"><User size={14} /> {order.reporterName}</span>
                                    <span className="meta-inline"><Clock size={14} /> {order.date}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No hay órdenes con estos filtros.
                            </div>
                        </CardContent>
                    </Card>
                )}
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

            {/* Detail modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Detalle: ${selectedOrder ? formatOrderId(selectedOrder.orderNumber) : ''}`}
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

                        {(() => {
                            const linkedBudget = budgets.find(b => b.orderId === selectedOrder.id);
                            if (!linkedBudget) return null;

                            return (
                                <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Presupuesto Vinculado</span>
                                            <span className={`status-badge badge-${linkedBudget.status === 'borrador' ? 'warning' : linkedBudget.status === 'enviado' ? 'info' : linkedBudget.status === 'aprobado' ? 'success' : 'danger'}`}>
                                                {linkedBudget.status === 'borrador' ? 'Borrador' : linkedBudget.status.charAt(0).toUpperCase() + linkedBudget.status.slice(1)}
                                            </span>
                                        </div>
                                        {linkedBudget && (
                                            <Button size="sm" variant="outline" onClick={() => generateBudgetPDF(linkedBudget)}>
                                                <Download size={14} style={{ marginRight: '0.25rem' }} /> Descargar PDF
                                            </Button>
                                        )}
                                    </div>
                                    {linkedBudget && (
                                        <div style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ID Presupuesto</p>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{formatBudgetId(linkedBudget.budgetNumber)}</p>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Total</p>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                                                    ${linkedBudget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div style={{ flexBasis: '100%' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600 }}>Ítems a presupuestar:</p>
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                                                    {linkedBudget.items.map((item, idx) => (
                                                        <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                            {item.qty}x {item.description} — ${Number(item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

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
                                {selectedOrder.images && selectedOrder.images.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                                        {selectedOrder.images.map((img: string, idx: number) => (
                                            <Zoom key={idx}>
                                                <img
                                                    src={img}
                                                    alt={`Evidencia inicial ${idx + 1}`}
                                                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            </Zoom>
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

                        {/* Signature block */}
                        {selectedOrder.status === 'resolved' && (selectedOrder.signatureUrl || selectedOrder.receptorName) && (
                            <div className="resolution-notes-box" style={{ background: 'var(--color-bg)' }}>
                                <h4 style={{ color: 'var(--color-text)' }}><FileText size={16} /> Conformidad del Cliente</h4>
                                {selectedOrder.receptorName && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                        <strong>Recibido / Aprobado por:</strong> {selectedOrder.receptorName}
                                    </p>
                                )}
                                {selectedOrder.signatureUrl && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Firma:</p>
                                        <div style={{ background: 'white', display: 'inline-block', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                            <img src={selectedOrder.signatureUrl} alt="Firma de conformidad" style={{ maxHeight: '120px' }} />
                                        </div>
                                    </div>
                                )}
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
                title={`Cerrar Orden: ${closeOrderTarget ? formatOrderId(closeOrderTarget.orderNumber) : ''}`}
                maxWidth="500px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmClose} isLoading={isClosing} disabled={isClosing}>Confirmar Cierre</Button>
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

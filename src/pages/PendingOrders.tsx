import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import {
    Building2, MapPin, Clock, AlertTriangle, Droplets,
    User, Camera, CheckCircle2, SlidersHorizontal, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import { useBudgets } from '../context/BudgetContext';
import './PendingOrders.css';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

interface WorkerProfile {
    id: string;
    name: string;
    role: string;
}

type SortKey = 'date_desc' | 'date_asc' | 'priority_high' | 'priority_low';

const PendingOrders: React.FC = () => {
    const { orders, assignWorker } = useWorkOrders();
    const { budgets } = useBudgets();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

    // Helper: get the best budget status for an order by checking BudgetContext directly
    // This is bulletproof even if the backend `budget_status` column isn't backfilled yet.
    const getOrderBudgetStatus = (orderId: string, fallbackStatus?: string) => {
        const order = orders.find(o => o.id === orderId);
        const linkedBudgets = budgets.filter(b => {
            if (b.orderId === orderId) return true;
            if (!order || !order.orderNumber) return false;
            
            const searchStr = `${b.notes || ''} ${b.clientName || ''} ${b.building || ''}`.toUpperCase();
            const orderNumStr = String(order.orderNumber);
            return searchStr.includes(`NP-${orderNumStr.padStart(4, '0')}`) || searchStr.includes(`NP ${orderNumStr}`) || searchStr.includes(orderNumStr);
        });
        
        if (linkedBudgets.length > 0) {
            // Priority: aprobado > enviado > borrador > rechazado
            if (linkedBudgets.some(b => b.status === 'aprobado')) return 'aprobado';
            if (linkedBudgets.some(b => b.status === 'enviado')) return 'enviado';
            if (linkedBudgets.some(b => b.status === 'borrador')) return 'borrador';
            return linkedBudgets[0].status;
        }
        
        return fallbackStatus; // Trust the context only if we didn't find local budgets
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [workersList, setWorkersList] = useState<WorkerProfile[]>([]);

    // Filter & sort state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterBuilding, setFilterBuilding] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterReporter, setFilterReporter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date_desc');

    // Pagination
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchWorkers = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .eq('role', 'operario');

            if (error) {
                console.error('Error fetching workers (RLS may be blocking):', error);
            }
            if (data && data.length > 0) {
                setWorkersList(data.map(p => ({ id: p.id, name: p.full_name || 'Operario sin nombre', role: 'Mantenedor' })));
            } else {
                console.warn('No se encontraron operarios. Verifica las políticas RLS en Supabase.');
            }
        };
        fetchWorkers();
    }, []);

    const pendingOrders = orders.filter(o => o.status === 'pending');

    // Unique values for filter dropdowns
    const uniqueBuildings = [...new Set(pendingOrders.map(o => o.building).filter(Boolean))];
    const hasActiveFilters = filterBuilding || filterPriority || filterReporter;

    // Apply filters
    let processedOrders = pendingOrders
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

    const handleOpenDetails = (order: WorkOrder) => {
        setSelectedOrder(order);
        setSelectedWorker('');
        setIsModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedWorker || !selectedOrder) return;
        try {
            await assignWorker(selectedOrder.id, selectedWorker);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error al asignar operario:', error);
            alert('Error al asignar la orden.');
        }
    };

    const handleClearFilters = () => {
        setFilterBuilding('');
        setFilterPriority('');
        setFilterReporter('');
        setSortKey('date_desc');
        setPage(1);
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

    return (
        <div className="pending-orders-container animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Órdenes Pendientes</h1>
                    <p className="page-subtitle">Revisa los detalles y asigna el personal correspondiente.</p>
                </div>
            </div>

            <Card className="full-height-card">
                <CardHeader className="orders-table-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Button
                            variant={isFilterOpen ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <SlidersHorizontal size={15} style={{ marginRight: '0.375rem' }} />
                            Filtrar y Ordenar
                            {hasActiveFilters && <span style={{ marginLeft: '0.375rem', background: 'var(--color-primary-dark)', color: '#fff', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>!</span>}
                        </Button>
                        {hasActiveFilters && (
                            <button onClick={handleClearFilters} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', background: 'none', border: 'none' }}>
                                <X size={13} /> Limpiar filtros
                            </button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {processedOrders.length} orden{processedOrders.length !== 1 ? 'es' : ''}
                        </span>
                    </div>

                    {/* Filter panel */}
                    {isFilterOpen && (
                        <div className="filter-panel">
                            <div className="filter-panel-grid">
                                <div className="filter-group">
                                    <label className="filter-label">Ordenar por</label>
                                    <select className="form-select" value={sortKey} onChange={e => { setSortKey(e.target.value as SortKey); setPage(1); }}>
                                        <option value="date_desc">Fecha (más nueva primero)</option>
                                        <option value="date_asc">Fecha (más antigua primero)</option>
                                        <option value="priority_high">Prioridad (alta primero)</option>
                                        <option value="priority_low">Prioridad (baja primero)</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label">Edificio</label>
                                    <select className="form-select" value={filterBuilding} onChange={e => { setFilterBuilding(e.target.value); setPage(1); }}>
                                        <option value="">Todos</option>
                                        {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label">Prioridad</label>
                                    <select className="form-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
                                        <option value="">Todas</option>
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label className="filter-label">Persona que reporta</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Buscar por nombre..."
                                        value={filterReporter}
                                        onChange={e => { setFilterReporter(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-0">
                    <div className="table-responsive">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Detalle</th>
                                    <th>Ubicación</th>
                                    <th>Fecha</th>
                                    <th>Prioridad</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedOrders.map(order => (
                                    <tr key={order.id} className="table-row-hover">
                                        <td className="font-medium text-muted">{formatOrderId(order.orderNumber)}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="icon-bg-small">{getCategoryIcon(order.category)}</div>
                                                <div>
                                                    <p className="font-semibold">{order.title}</p>
                                                    <p className="text-xs text-muted">{order.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-medium">{order.building}</p>
                                                <p className="text-xs text-muted">{order.location}</p>
                                            </div>
                                        </td>
                                        <td className="text-sm">{order.date}</td>
                                        <td>
                                            <span className={`priority-badge priority-${order.priority === 'alta' ? 'high' : order.priority === 'media' ? 'medium' : 'low'}`}>
                                                {order.priority === 'alta' ? 'Alta' : order.priority === 'media' ? 'Media' : 'Baja'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button size="sm" onClick={() => handleOpenDetails(order)}>Ver Detalle</Button>
                                        </td>
                                    </tr>
                                ))}
                                {pagedOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted">No hay órdenes pendientes con estos filtros.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Detalle: ${selectedOrder ? formatOrderId(selectedOrder.orderNumber) : ''}`}
                maxWidth="800px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        {selectedOrder && getOrderBudgetStatus(selectedOrder.id, selectedOrder.budgetStatus) === 'aprobado' ? (
                            <Button onClick={handleAssign} disabled={!selectedWorker}>Confirmar Asignación</Button>
                        ) : (
                            <Button disabled>Confirme Presupuesto Primero</Button>
                        )}
                    </>
                }
            >
                {selectedOrder && (
                    <div className="order-detail-view">
                        <div className="detail-header">
                            <div className="detail-title-group">
                                <div className="icon-bg-large">{getCategoryIcon(selectedOrder.category)}</div>
                                <div>
                                    <h3 className="detail-title">{selectedOrder.title}</h3>
                                    <span className={`priority-badge priority-${selectedOrder.priority === 'alta' ? 'high' : selectedOrder.priority === 'media' ? 'medium' : 'low'}`}>
                                        Prioridad: {selectedOrder.priority === 'alta' ? 'Alta' : selectedOrder.priority === 'media' ? 'Media' : 'Baja'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-info-card">
                                <h4 className="info-title">Descripción del Problema</h4>
                                <p className="info-text">{selectedOrder.description}</p>

                                <div className="info-meta-grid">
                                    <div className="meta-item">
                                        <Building2 size={16} className="text-primary-dark" />
                                        <div>
                                            <span className="meta-label">Edificio / Depto</span>
                                            <span className="meta-value">{selectedOrder.building} {selectedOrder.department ? `- ${selectedOrder.department}` : ''}</span>
                                        </div>
                                    </div>
                                    <div className="meta-item">
                                        <MapPin size={16} className="text-primary-dark" />
                                        <div>
                                            <span className="meta-label">Ubicación Especifica</span>
                                            <span className="meta-value">{selectedOrder.location}</span>
                                        </div>
                                    </div>
                                    <div className="meta-item">
                                        <User size={16} className="text-primary-dark" />
                                        <div>
                                            <span className="meta-label">Reportado por</span>
                                            <span className="meta-value">{selectedOrder.reporterName}</span>
                                        </div>
                                    </div>
                                    {selectedOrder.availability && (
                                        <div className="meta-item">
                                            <Clock size={16} className="text-primary-dark" />
                                            <div>
                                                <span className="meta-label">Disponibilidad</span>
                                                <span className="meta-value">{selectedOrder.availability}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="meta-item">
                                        <Clock size={16} className="text-primary-dark" />
                                        <div>
                                            <span className="meta-label">Fecha del Reporte</span>
                                            <span className="meta-value">{selectedOrder.date}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-sidebar">
                                <Card className="assignment-card mix-glass">
                                    <CardContent className="p-4">
                                        <h4 className="info-title mb-3">Asignar Personal</h4>
                                        {getOrderBudgetStatus(selectedOrder.id, selectedOrder.budgetStatus) === 'aprobado' ? (
                                            <select
                                                className="form-select"
                                                value={selectedWorker}
                                                onChange={(e) => setSelectedWorker(e.target.value)}
                                            >
                                                <option value="" disabled>Seleccionar un operario...</option>
                                                {workersList.length === 0 && (
                                                    <option disabled>No se encontraron operarios</option>
                                                )}
                                                {workersList.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
                                                <strong>Atención:</strong> El presupuesto de esta orden no está aprobado. No se puede asignar personal.
                                                <br />Estado actual: {getOrderBudgetStatus(selectedOrder.id, selectedOrder.budgetStatus) || 'Sin Presupuesto'}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="images-section">
                                    <h4 className="info-title flex items-center gap-2 mb-3">
                                        <Camera size={16} /> Evidencia Fotográfica
                                    </h4>
                                    {selectedOrder.images && selectedOrder.images.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                                        {selectedOrder.images.map((img: string, idx: number) => (
                                            <Zoom key={idx}>
                                                <img
                                                    src={img}
                                                    alt="Evidencia"
                                                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            </Zoom>
                                        ))}
                                    </div>
                                    ) : (
                                        <div className="no-evidence">
                                            No se adjuntaron fotografías.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PendingOrders;

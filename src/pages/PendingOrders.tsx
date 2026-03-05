import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Building2, MapPin, Clock, AlertTriangle, Droplets, User, Camera, CheckCircle2 } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import type { WorkOrder } from '../context/WorkOrderContext';
import './PendingOrders.css';

// Mock workers
const workersList = [
    { id: 'w1', name: 'Carlos Rodríguez', role: 'Plomero' },
    { id: 'w2', name: 'Ana Martínez', role: 'Electricista' },
    { id: 'w3', name: 'Roberto Sánchez', role: 'Mantenimiento General' },
    { id: 'w4', name: 'Lucía Fernández', role: 'Supervisora de Limpieza' },
];

const PendingOrders: React.FC = () => {
    const { orders, assignWorker } = useWorkOrders();
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const pendingOrders = orders.filter(o => o.status === 'pending');

    const handleOpenDetails = (order: WorkOrder) => {
        setSelectedOrder(order);
        setSelectedWorker(''); // Reset assignment
        setIsModalOpen(true);
    };

    const handleAssign = () => {
        if (!selectedWorker || !selectedOrder) return;
        assignWorker(selectedOrder.id, selectedWorker);
        setIsModalOpen(false);
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

    // Filter by search
    const filteredPendingOrders = pendingOrders.filter(order =>
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.building.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <Input
                        placeholder="Buscar por ID, título o edificio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-mw"
                    />
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
                                {filteredPendingOrders.map(order => (
                                    <tr key={order.id} className="table-row-hover">
                                        <td className="font-medium text-muted">{order.id}</td>
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
                                {filteredPendingOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted">No hay órdenes pendientes buscando por "{searchTerm}".</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Detalle de Orden: ${selectedOrder?.id}`}
                maxWidth="800px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAssign} disabled={!selectedWorker}>Confirmar Asignación</Button>
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
                                            <span className="meta-label">Edificio</span>
                                            <span className="meta-value">{selectedOrder.building}</span>
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
                                        <select
                                            className="form-select"
                                            value={selectedWorker}
                                            onChange={(e) => setSelectedWorker(e.target.value)}
                                        >
                                            <option value="" disabled>Seleccionar un operario...</option>
                                            {workersList.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                                            ))}
                                        </select>
                                    </CardContent>
                                </Card>

                                <div className="images-section">
                                    <h4 className="info-title flex items-center gap-2 mb-3">
                                        <Camera size={16} /> Evidencia Fotográfica
                                    </h4>
                                    {selectedOrder.images && selectedOrder.images.length > 0 ? (
                                        <div className="evidence-grid">
                                            {selectedOrder.images.map((img, idx) => (
                                                <div key={idx} className="evidence-img">
                                                    <img src={img} alt={`Evidencia ${idx + 1}`} />
                                                </div>
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

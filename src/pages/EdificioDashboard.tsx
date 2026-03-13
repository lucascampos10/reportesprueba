import React, { useState } from 'react';
import {
    CheckCircle2,
    FileText,
    Download,
    ClipboardList,
    Clock,
    ArrowRight,
    Building2
} from 'lucide-react';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import { useWorkOrders } from '../context/WorkOrderContext';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { PasswordConfirmModal } from '../components/PasswordConfirmModal';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import './FinanceOverview.css'; // Reutilizamos estética premium

// Reuse budget PDF generation logic
export const generateBudgetPDF = (budget: any) => {
    const doc = new jsPDF();
    doc.setFillColor(26, 60, 52);
    doc.rect(0, 0, 210, 42, 'F');

    try {
        doc.addImage(logoBase64, 'PNG', 15, 10, 22, 22);
    } catch (e) { }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NOVAK SERVICIOS', 42, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('BV Rivadavia 3848', 42, 22);
    doc.text('Tel: 3517585241', 42, 27);
    doc.text('novak.limpieza@gmail.com', 42, 32);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 195, 14, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`N°: ${formatBudgetId(budget.budgetNumber)}`, 195, 22, { align: 'right' });
    doc.text(`Fecha: ${new Date(budget.createdAt).toLocaleDateString('es-AR')}`, 195, 28, { align: 'right' });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO PARA:', 15, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clientName, 15, 60);
    doc.text(`Edificio: ${budget.building}`, 15, 66);

    autoTable(doc, {
        startY: 80,
        head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: budget.items.map((item: any) => [
            item.description,
            item.qty.toString(),
            `$${Number(item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            `$${(Number(item.qty) * Number(item.unit_price)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        ]),
        headStyles: { fillColor: [26, 60, 52], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [247, 247, 247] },
        columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`$${(budget.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`PRECIO TOTAL:`, 125, finalY + 8);
    doc.text(`$${(budget.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY + 8, { align: 'right' });

    // IVA Note
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('(El precio mencionado ya incluye IVA)', 195, finalY + 12, { align: 'right' });

    if (budget.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Notas:', 15, finalY);
        doc.text(doc.splitTextToSize(budget.notes, 110), 15, finalY + 6);
    }

    doc.save(`${formatBudgetId(budget.budgetNumber)}_${budget.building}.pdf`);
};

const EdificioDashboard: React.FC = () => {
    const { budgets, updateBudgetStatus } = useBudgets();
    const { orders } = useWorkOrders();
    const [activeTab] = useState<'overview' | 'reports' | 'budgets'>('overview');

    // Password confirmation state
    const [isPswModalOpen, setIsPswModalOpen] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
    const [viewingOrder, setViewingOrder] = useState<any | null>(null);

    // Filter relevant data
    const pendingBudgets = budgets.filter(b => b.status === 'enviado');
    const activeOrders = orders.filter(o => o.status !== 'resolved');
    const recentOrders = orders.slice(0, 5);

    // Get unique departments from managed buildings or fallback to generic ones
    const activeDepts = Array.from(new Set(orders.map(o => o.department).filter(Boolean)));
    const genericDepts = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B'];
    const departments = activeDepts.length > 0 ? activeDepts : genericDepts;

    const handleApproveClick = (budgetId: string) => {
        setSelectedBudgetId(budgetId);
        setIsPswModalOpen(true);
    };

    const confirmApproval = async (password: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) throw new Error('Usuario no encontrado');

        // Verify password by attempting to sign in
        const { error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password,
        });

        if (error) throw error;

        // If success, update budget
        if (selectedBudgetId) {
            await updateBudgetStatus(selectedBudgetId, 'aprobado');
        }
    };

    return (
        <div className="finance-overview animate-fade-in" style={{ padding: '2rem' }}>
            <div className="dashboard-header mb-8">
                <div>
                    <h1 className="page-title">Panel de Administración</h1>
                    <p className="page-subtitle">Gestioná los reportes de tus vecinos y aprobá presupuestos de mantenimiento.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid mb-8">
                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-warning-light text-warning">
                                <Clock size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Presupuestos por Aprobar</p>
                            <h3 className="kpi-value">{pendingBudgets.length}</h3>
                            <p className="kpi-subtext">Requieren tu revisión</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-info-light text-info">
                                <ClipboardList size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Reportes Activos</p>
                            <h3 className="kpi-value">{activeOrders.length}</h3>
                            <p className="kpi-subtext">Problemas reportados por vecinos</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-success-light text-success">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Trabajos Finalizados</p>
                            <h3 className="kpi-value">{orders.filter(o => o.status === 'resolved').length}</h3>
                            <p className="kpi-subtext">Mes actual</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="stats-layout">
                {/* Pending Actions List */}
                <div className="actions-section">
                    <div className="section-header">
                        <h2>Reportes de Vecinos (Recientes)</h2>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>Ver todos</Button>
                    </div>
                    <div className="action-list">
                        {recentOrders.length > 0 ? (
                            recentOrders.map(order => (
                                <div key={order.id} className="action-item cursor-pointer" onClick={() => setViewingOrder(order)}>
                                    <div className={`action-indicator ${order.priority === 'alta' ? 'danger' : 'warning'}`}></div>
                                    <div className="action-details">
                                        <p className="action-title">{order.title}</p>
                                        <p className="action-meta">{order.building} · {order.department || 'Área Común'}</p>
                                        <p className="action-meta" style={{ fontSize: '0.7rem' }}>Reportado por: {order.reporterName}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                        {order.status === 'pending' ? 'Pendiente' : order.status === 'in_progress' ? 'En Curso' : 'Resuelto'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <CheckCircle2 size={32} className="text-success" />
                                <p>No hay reportes activos.</p>
                            </div>
                        )}
                    </div>

                    {/* Departamentos Section */}
                    {departments.length > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 size={18} className="text-primary" />
                                Estructura del Consorcio
                            </h3>
                            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Unidades funcionales bajo seguimiento:</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.75rem' }}>
                                    {departments.map(dept => (
                                        <div key={dept} style={{
                                            background: activeDepts.includes(dept) ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.05)',
                                            border: activeDepts.includes(dept) ? '1px solid var(--color-primary)' : '1px solid transparent',
                                            padding: '0.6rem 0.4rem',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            color: activeDepts.includes(dept) ? 'var(--color-primary-dark)' : 'inherit',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {dept}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Approvals in progress */}
                <div className="actions-section">
                    <div className="section-header">
                        <h2>Presupuestos por Aprobar</h2>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>Ver todos</Button>
                    </div>
                    <div className="action-list">
                        {pendingBudgets.length > 0 ? (
                            pendingBudgets.map(budget => (
                                <div key={budget.id} className="action-item">
                                    <div className="action-indicator warning"></div>
                                    <div className="action-details">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p className="action-title">{budget.building}</p>
                                            <span style={{ fontWeight: 800 }}>${budget.total.toLocaleString('es-AR')}</span>
                                        </div>
                                        <p className="action-meta">{formatBudgetId(budget.budgetNumber)} · {new Date(budget.createdAt).toLocaleDateString()}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <Button size="sm" variant="primary" style={{ background: '#10B981', color: 'white', border: 'none' }} onClick={() => handleApproveClick(budget.id)}>Aprobar</Button>
                                            <Button size="sm" variant="outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => { if (confirm('¿Rechazar presupuesto?')) updateBudgetStatus(budget.id, 'rechazado') }}>Rechazar</Button>
                                            <Button size="sm" variant="outline" onClick={() => generateBudgetPDF(budget)}><Download size={12} /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FileText size={32} className="text-muted" />
                                <p>No hay presupuestos pendientes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PasswordConfirmModal
                isOpen={isPswModalOpen}
                onClose={() => setIsPswModalOpen(false)}
                onConfirm={confirmApproval}
                title="Confirmar Aprobación"
                message="Para aprobar este presupuesto, por favor ingresá tu contraseña de administrador como confirmación."
            />

            <Modal
                isOpen={!!viewingOrder}
                onClose={() => setViewingOrder(null)}
                title="Detalle del Reporte"
                maxWidth="600px"
            >
                {viewingOrder && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Problema</h4>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{viewingOrder.title}</p>
                            <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>{viewingOrder.description}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Depto / Unidad</h4>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{viewingOrder.department || 'Área Común'}</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Prioridad</h4>
                                <span className={`priority-badge priority-${viewingOrder.priority === 'alta' ? 'high' : viewingOrder.priority === 'media' ? 'medium' : 'low'}`}>
                                    {viewingOrder.priority.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Fecha</h4>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{viewingOrder.date}</p>
                            </div>
                            {viewingOrder.availability && (
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Disponibilidad</h4>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{viewingOrder.availability}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Evidencia Fotográfica</h4>
                            {viewingOrder.images && viewingOrder.images.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    {viewingOrder.images.map((img: string, idx: number) => (
                                        <Zoom key={idx}>
                                            <img 
                                                src={img} 
                                                alt="Evidencia" 
                                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                            />
                                        </Zoom>
                                    ))}
                                </div>
                            ) : <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No se adjuntaron fotos.</p>}
                        </div>
                        {viewingOrder.status === 'resolved' && viewingOrder.resolvedImages && viewingOrder.resolvedImages.length > 0 && (
                             <div>
                             <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Trabajo Finalizado</h4>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                 {viewingOrder.resolvedImages.map((img: string, idx: number) => (
                                     <Zoom key={idx}>
                                         <img 
                                             key={idx} 
                                             src={img} 
                                             alt="Resultado" 
                                             style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                         />
                                     </Zoom>
                                 ))}
                             </div>
                         </div>
                        )}
                    </div>
                )}
            </Modal>

            {activeTab === 'overview' && null}
        </div>
    );
};

export default EdificioDashboard;

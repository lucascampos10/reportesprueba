import React, { useState } from 'react';
import { Plus, FileText, Download, Send, X, Edit, MessageCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useBudgets, formatBudgetId, type BudgetItem, type BudgetStatus } from '../context/BudgetContext';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import './Presupuestos.css';

const ADMIN_NAMES = [
    "Juan Pérez", "María Gómez", "Carlos López", "Ana Martínez", "Roberto Fernández",
    "Laura Rodríguez", "Diego García", "Sofía Díaz", "Marcelo Silva", "Paula Romero"
];

const statusLabel: Record<BudgetStatus, string> = {
    borrador: 'Borrador',
    enviado: 'Enviado',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
};

const statusClass: Record<BudgetStatus, string> = {
    borrador: 'badge-warning',
    enviado: 'badge-info',
    aprobado: 'badge-success',
    rechazado: 'badge-danger',
};

// ─── PDF Generation ────────────────────────────────────────────────────────
const generateBudgetPDF = (budget: any) => {
    const doc = new jsPDF();

    // ─── Header background ────────────────────────────────────────────
    doc.setFillColor(26, 60, 52);
    doc.rect(0, 0, 210, 42, 'F');

    // ─── LEFT: Logo + Company info ──────────────────────────────────
    try {
        doc.addImage(logoBase64, 'PNG', 15, 10, 22, 22);
    } catch (e) {
        // Continue if image fails
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NOVAK SERVICIOS', 42, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('BV Rivadavia 3848', 42, 22);
    doc.text('Tel: 3517585241', 42, 27);
    doc.text('novak.limpieza@gmail.com', 42, 32);

    // ─── RIGHT: Budget title + details ───────────────────────────────
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 195, 14, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`N°: ${formatBudgetId(budget.budgetNumber)}`, 195, 22, { align: 'right' });
    doc.text(`Fecha: ${new Date(budget.createdAt).toLocaleDateString('es-AR')}`, 195, 28, { align: 'right' });
    if (budget.validUntil) {
        doc.text(`Vencimiento: ${new Date(budget.validUntil).toLocaleDateString('es-AR')}`, 195, 34, { align: 'right' });
    }

    // ─── Client info block ─────────────────────────────────────────
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO PARA:', 15, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clientName, 15, 60);
    doc.text(`Edificio: ${budget.building}`, 15, 66);

    // Items table
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
    doc.text(`$${budget.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL:`, 140, finalY + 8);
    doc.text(`$${budget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY + 8, { align: 'right' });

    // Notes
    if (budget.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Notas:', 15, finalY);
        doc.text(doc.splitTextToSize(budget.notes, 110), 15, finalY + 6);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este presupuesto tiene validez por el plazo indicado a partir de la fecha de emisión.', 105, 285, { align: 'center' });

    doc.save(`${formatBudgetId(budget.budgetNumber)}_${budget.building.replace(/\s+/g, '_')}.pdf`);
};

// ─── Helper ────────────────────────────────────────────────────────────────
const emptyItem = (): BudgetItem => ({ description: '', qty: 1, unit_price: '' as any });

const Presupuestos: React.FC = () => {
    const { budgets, addBudget, updateBudget, updateBudgetStatus } = useBudgets();
    const { orders } = useWorkOrders();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | BudgetStatus>('all');

    // Form state
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
    const [linkedOrderId, setLinkedOrderId] = useState('');
    const [building, setBuilding] = useState('');
    const [clientName, setClientName] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<BudgetItem[]>([emptyItem()]);

    const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unit_price) || 0), 0);
    const tax = 0; // Removed IVA calculation
    const total = subtotal;

    const handleLinkedOrderChange = (orderId: string) => {
        setLinkedOrderId(orderId);
        if (orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                setBuilding(order.building);
                setClientName(order.reporterName);
            }
        }
    };

    const updateItem = (idx: number, field: keyof BudgetItem, value: string | number) => {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handleEditBudget = (b: any) => {
        setEditingBudgetId(b.id);
        setLinkedOrderId(b.orderId || '');
        setBuilding(b.building);
        setClientName(b.clientName);
        setValidUntil(b.validUntil ? b.validUntil.split('T')[0] : '');
        setNotes(b.notes || '');
        setItems(b.items.length > 0 ? b.items : [emptyItem()]);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingBudgetId(null);
        setLinkedOrderId('');
        setBuilding('');
        setClientName('');
        setValidUntil('');
        setNotes('');
        setItems([emptyItem()]);
    };

    const handleSubmit = async () => {
        if (!building || !clientName || items.some(i => !i.description)) {
            alert('Completá todos los campos requeridos e ítems.');
            return;
        }
        setIsLoading(true);
        try {
            if (editingBudgetId) {
                await updateBudget(editingBudgetId, {
                    orderId: linkedOrderId || undefined,
                    building,
                    clientName,
                    items,
                    subtotal,
                    tax,
                    total,
                    validUntil,
                    notes,
                });
            } else {
                await addBudget({
                    orderId: linkedOrderId || undefined,
                    building,
                    clientName,
                    items,
                    subtotal,
                    tax,
                    total,
                    status: 'borrador',
                    validUntil,
                    notes,
                });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            console.error(err);
            alert(`Error al guardar el presupuesto: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWhatsAppShare = (budget: any) => {
        // Trigger download of the PDF so the user has it ready
        generateBudgetPDF(budget);

        const message = `*NOVAK SERVICIOS - PRESUPUESTO*%0A%0A` +
            `Hola! Te envío el presupuesto solicitado por los servicios realizados.%0A%0A` +
            `*N° Presupuesto:* ${formatBudgetId(budget.budgetNumber)}%0A` +
            `*Fecha:* ${new Date(budget.createdAt).toLocaleDateString('es-AR')}%0A` +
            `*Edificio/Cliente:* ${budget.building}%0A%0A` +
            `¡Muchas gracias!`;

        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const filtered = filterStatus === 'all' ? budgets : budgets.filter(b => b.status === filterStatus);

    return (
        <div className="presupuestos-container animate-fade-in">
            {/* Header */}
            <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Presupuestos</h1>
                    <p className="page-subtitle">Generá y gestioná presupuestos vinculados a órdenes de trabajo.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.4rem' }} /> Nuevo Presupuesto
                </Button>
            </div>

            {/* Filter chips */}
            <div className="pres-filter-bar">
                {(['all', 'borrador', 'enviado', 'aprobado', 'rechazado'] as const).map(s => (
                    <button
                        key={s}
                        className={`pres-chip ${filterStatus === s ? 'active' : ''} chip-${s}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === 'all' ? `Todos (${budgets.length})` : `${statusLabel[s]} (${budgets.filter(b => b.status === s).length})`}
                    </button>
                ))}
            </div>

            {/* Budget list */}
            {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                        <FileText size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No hay presupuestos</h2>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '320px' }}>Creá tu primer presupuesto vinculado a una orden de trabajo.</p>
                </div>
            ) : (
                <div className="pres-list">
                    {filtered.map(b => (
                        <div key={b.id} className="pres-card">
                            <div className="pres-card-top">
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span className="pres-number">{formatBudgetId(b.budgetNumber)}</span>
                                        <span className={`status-badge ${statusClass[b.status]}`}>{statusLabel[b.status]}</span>
                                        {b.orderId && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                → {formatOrderId(orders.find(o => o.id === b.orderId)?.orderNumber ?? 0)}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ marginTop: '0.3rem', fontWeight: 600 }}>{b.building} · {b.clientName}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(b.createdAt).toLocaleDateString('es-AR')} · {b.items.length} ítem{b.items.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="pres-total">${b.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total sin IVA</div>
                                </div>
                            </div>

                            <div className="pres-card-actions">
                                <button className="pres-action-btn" onClick={() => generateBudgetPDF(b)} title="Descargar PDF">
                                    <Download size={15} /> PDF
                                </button>
                                <button className="pres-action-btn" onClick={() => handleWhatsAppShare(b)} title="Enviar por WhatsApp" style={{ color: '#25D366' }}>
                                    <MessageCircle size={15} /> WhatsApp
                                </button>
                                {b.status === 'borrador' && (
                                    <>
                                        <button className="pres-action-btn" onClick={() => handleEditBudget(b)} title="Editar Presupuesto">
                                            <Edit size={15} /> Editar
                                        </button>
                                        <button className="pres-action-btn blue" onClick={() => updateBudgetStatus(b.id, 'enviado')} title="Marcar como enviado">
                                            <Send size={15} /> Enviar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Budget Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingBudgetId ? "Editar Presupuesto" : "Nuevo Presupuesto"}
                maxWidth="840px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
                        <Button isLoading={isLoading} onClick={handleSubmit}>Guardar Presupuesto</Button>
                    </>
                }
            >
                <div className="pres-form">
                    {/* Link to order */}
                    <div className="form-group">
                        <label className="form-label">Vincular a Orden de Trabajo (opcional)</label>
                        <select className="form-select" value={linkedOrderId} onChange={e => handleLinkedOrderChange(e.target.value)}>
                            <option value="">Sin vinculación</option>
                            {orders.filter(o => o.status !== 'resolved' && (!o.budgetStatus || o.budgetStatus !== 'aprobado')).map(o => (
                                <option key={o.id} value={o.id}>{formatOrderId(o.orderNumber)} — {o.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label className="form-label">Edificio / Cliente *</label>
                            <input className="form-input" value={building} onChange={e => setBuilding(e.target.value)} placeholder="Ej. Torre Alvear" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nombre del Administrador *</label>
                            <select className="form-select" value={clientName} onChange={e => setClientName(e.target.value)} required>
                                <option value="">Seleccionar administrador...</option>
                                {ADMIN_NAMES.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="form-group">
                        <label className="form-label">Ítems del presupuesto *</label>
                        <div className="pres-items-table">
                            <div className="pres-items-header">
                                <span style={{ flex: 3 }}>Descripción</span>
                                <span style={{ flex: 1 }}>Cant.</span>
                                <span style={{ flex: 1.5 }}>P. Unit. ($)</span>
                                <span style={{ flex: 1.5, textAlign: 'right' }}>Subtotal</span>
                                <span style={{ width: '24px' }}></span>
                            </div>
                            {items.map((item, idx) => (
                                <div key={idx} className="pres-item-row">
                                    <input
                                        className="form-input"
                                        style={{ flex: 3 }}
                                        placeholder="Descripción del servicio"
                                        value={item.description}
                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                    />
                                    <input
                                        className="form-input"
                                        style={{ flex: 1 }}
                                        type="number" min={1}
                                        value={item.qty}
                                        onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                    />
                                    <input
                                        className="form-input"
                                        style={{ flex: 1.5 }}
                                        type="number" min={0} step={0.01}
                                        placeholder="0.00"
                                        value={item.unit_price === ('' as any) ? '' : item.unit_price}
                                        onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                                    />
                                    <span style={{ flex: 1.5, textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>
                                        ${((Number(item.qty) || 0) * (Number(item.unit_price) || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', alignSelf: 'center', padding: '0.25rem' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="pres-add-item-btn"
                                onClick={() => setItems([...items, emptyItem()])}
                            >
                                <Plus size={14} /> Agregar ítem
                            </button>
                        </div>
                    </div>

                    {/* Totals summary */}
                    <div className="pres-totals">
                        <div className="pres-total-row total"><span>TOTAL</span><span>${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label className="form-label">Válido hasta</label>
                            <input className="form-input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notas adicionales</label>
                        <textarea className="form-textarea minimal-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condiciones, aclaraciones..." />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Presupuestos;

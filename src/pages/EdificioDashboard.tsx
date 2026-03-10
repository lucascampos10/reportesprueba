import React from 'react';
import { CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../pages/Presupuestos.css'; // Reutilizamos estilos de tarjetas

export const generateBudgetPDF = (budget: any) => {
    const doc = new jsPDF();
    // ─── Header background ────────────────────────────────────────────
    doc.setFillColor(26, 60, 52);
    doc.rect(0, 0, 210, 42, 'F');

    // ─── LEFT: Logo + Company info ──────────────────────────────────
    try {
        doc.addImage('/logo-novak.png', 'PNG', 15, 10, 22, 22);
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
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`$${budget.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL:`, 140, finalY + 8);
    doc.text(`$${budget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 195, finalY + 8, { align: 'right' });

    doc.save(`${formatBudgetId(budget.budgetNumber)}_${budget.building}.pdf`);
};

const EdificioDashboard: React.FC = () => {
    const { budgets, updateBudgetStatus } = useBudgets();

    // El admin de edificio solo ve los presupuestos enviados, aprobados o rechazados
    const visibleBudgets = budgets.filter(b => b.status !== 'borrador');
    const pendingCount = visibleBudgets.filter(b => b.status === 'enviado').length;

    return (
        <div style={{ padding: '2rem' }} className="animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Bienvenido</h1>
                    <p className="page-subtitle">Revisá y aprobá los presupuestos de tus edificios.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', flex: 1 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Presupuestos Pendientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: pendingCount > 0 ? '#E88B2D' : 'var(--color-text)' }}>{pendingCount}</p>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', flex: 1 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Aprobados</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>{visibleBudgets.filter(b => b.status === 'aprobado').length}</p>
                </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Presupuestos Recientes</h2>

            {visibleBudgets.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                        <FileText size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No hay presupuestos</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Por ahora no tenés presupuestos para revisar.</p>
                </div>
            ) : (
                <div className="pres-list">
                    {visibleBudgets.map(b => (
                        <div key={b.id} className="pres-card" style={{ borderLeft: b.status === 'enviado' ? '4px solid #F59E0B' : b.status === 'aprobado' ? '4px solid #10B981' : '4px solid #EF4444' }}>
                            <div className="pres-card-top">
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span className="pres-number">{formatBudgetId(b.budgetNumber)}</span>
                                        <span className={`status-badge badge-${b.status === 'enviado' ? 'info' : b.status === 'aprobado' ? 'success' : 'danger'}`}>
                                            {b.status === 'enviado' ? 'Pendiente de Aprobación' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                        </span>
                                    </div>
                                    <p style={{ marginTop: '0.3rem', fontWeight: 600 }}>{b.building}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Fecha: {new Date(b.createdAt).toLocaleDateString('es-AR')} · {b.items.length} ítem{b.items.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="pres-total">${b.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total sin IVA</div>
                                </div>
                            </div>

                            <div className="pres-card-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <button className="pres-action-btn" onClick={() => generateBudgetPDF(b)}>
                                    <Download size={15} /> Ver Detalles (PDF)
                                </button>

                                {b.status === 'enviado' && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                        <button className="pres-action-btn green" onClick={() => { if (confirm('¿Confirmar aprobación de presupuesto?')) updateBudgetStatus(b.id, 'aprobado') }}>
                                            <CheckCircle2 size={15} /> Aprobar Presupuesto
                                        </button>
                                        <button className="pres-action-btn red" onClick={() => { if (confirm('¿Desea rechazar este presupuesto?')) updateBudgetStatus(b.id, 'rechazado') }}>
                                            <XCircle size={15} /> Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EdificioDashboard;

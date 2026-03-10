import React, { useState } from 'react';
import { Plus, Receipt, Download, MessageCircle, CreditCard, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { useReceipts, formatReceiptId } from '../context/ReceiptContext';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import jsPDF from 'jspdf';
import { logoBase64 } from '../assets/logoBase64';
import './Presupuestos.css';

// SVG icons as components for specific needs
const Building2 = ({ size, className }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M15 2h2a2 2 0 0 1 2 2v18" /></svg>;
const Banknote = ({ size, className }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>;

const Recibos: React.FC = () => {
    const { receipts, addReceipt, isLoading: isLoadingReceipts } = useReceipts();
    const { budgets } = useBudgets();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [clientName, setClientName] = useState('');
    const [amountWritten, setAmountWritten] = useState('');
    const [concept, setConcept] = useState('');
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [linkedBudgetId, setLinkedBudgetId] = useState<string>('');

    const resetForm = () => {
        setLinkedBudgetId('');
        setClientName('');
        setAmountWritten('');
        setConcept('');
        setTotalAmount(0);
        setShowSuccess(false);
    };

    const handleLinkedBudgetChange = (id: string) => {
        setLinkedBudgetId(id);
        const budget = budgets.find(b => b.id === id);
        if (budget) {
            setClientName(budget.clientName);
            setTotalAmount(budget.total);
            setConcept(`Cancelación de Presupuesto ${formatBudgetId(budget.budgetNumber)}`);
        }
    };

    const handleSubmit = async () => {
        if (!clientName || !amountWritten || !concept || totalAmount <= 0) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }

        setIsLoading(true);
        try {
            await addReceipt({
                budgetId: linkedBudgetId || undefined,
                clientName: clientName,
                amountWritten: amountWritten,
                concept: concept,
                totalAmount: totalAmount,
                signatureUrl: 'AUTO_GENERATED' // Marker for PDF logic
            });

            setShowSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 2000);
        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            alert(`Error al generar recibo: ${error.message || 'Error desconocido'}. ¿Configuraste la tabla en Supabase?`);
        } finally {
            setIsLoading(false);
        }
    };

    const generateReceiptPDF = (receipt: any) => {
        const doc = new jsPDF();

        // --- Header Background ---
        doc.setFillColor(26, 60, 52);
        doc.rect(0, 0, 210, 42, 'F');

        // --- Logo & Company Info ---
        try {
            doc.addImage(logoBase64, 'PNG', 15, 10, 22, 22);
        } catch (e) { }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("NOVAK SERVICIOS", 42, 16);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text([
            "BV RIVADAVIA 3848",
            "TEL: 3517585241",
            "EMAIL: novak.limpieza@gmail.com"
        ], 42, 22);

        // --- Square "C" ---
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.rect(95, 10, 20, 20); // Square in the middle
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("C", 101, 24);
        doc.setFontSize(7);
        doc.text("COD. 011", 100, 28);

        // --- Receipt Info (Right) ---
        doc.setFontSize(16);
        doc.text("RECIBO", 145, 18);
        doc.setFontSize(10);
        doc.text([
            `Nº: ${formatReceiptId(receipt.receiptNumber)}`,
            `Fecha: ${new Date(receipt.createdAt).toLocaleDateString('es-AR')}`
        ], 145, 25);

        // --- Body ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        // Decoration line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 55, 195, 55);

        // Client
        doc.setFont("helvetica", "bold");
        doc.text("RECIBÍ de:", 15, 70);
        doc.setFont("helvetica", "normal");
        doc.text(receipt.clientName.toUpperCase(), 45, 70);
        doc.line(45, 71, 195, 71); // Underline

        // Amount in words
        doc.setFont("helvetica", "bold");
        doc.text("LA SUMA DE PESOS:", 15, 85);
        doc.setFont("helvetica", "normal");
        doc.text(receipt.amountWritten.toUpperCase(), 60, 85);
        doc.line(60, 86, 195, 86); // Underline

        // Concept
        doc.setFont("helvetica", "bold");
        doc.text("EN CONCEPTO DE:", 15, 100);
        doc.setFont("helvetica", "normal");
        doc.text(receipt.concept, 55, 100);
        doc.line(55, 101, 195, 101); // Underline

        // --- Total Box ---
        doc.setFillColor(240, 240, 240);
        doc.rect(140, 120, 55, 15, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(140, 120, 55, 15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`TOTAL: $${receipt.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 145, 130);

        // --- Signature ---
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Firma Autorizada", 155, 175);
        doc.line(140, 170, 195, 170);

        // Stylized "Automatic" signature
        doc.setFont("times", "italic");
        doc.setFontSize(22);
        doc.setTextColor(30, 60, 120);
        doc.text("Novak Servicios", 145, 165);

        doc.save(`${formatReceiptId(receipt.receiptNumber)}.pdf`);
    };

    const handleWhatsAppShare = (receipt: any) => {
        // Trigger download of the PDF so the user has it ready
        generateReceiptPDF(receipt);

        const message = `*NOVAK SERVICIOS - COMPROBANTE DE PAGO*%0A%0A` +
            `Hola! Te envío el recibo generado por los servicios realizados.%0A%0A` +
            `*N° Recibo:* ${formatReceiptId(receipt.receiptNumber)}%0A` +
            `*Fecha:* ${new Date(receipt.createdAt).toLocaleDateString('es-AR')}%0A` +
            `*Cliente:* ${receipt.clientName}%0A%0A` +
            `¡Muchas gracias!`;

        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="presupuestos-container animate-fade-in">
            <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Recibos de Pago</h1>
                    <p className="page-subtitle">Comprobantes oficiales de cobro por servicios realizados.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.4rem' }} /> Nuevo Recibo
                </Button>
            </div>

            {isLoadingReceipts ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                </div>
            ) : receipts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        <Receipt size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No hay recibos</h2>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '320px' }}>Emití tu primer recibo de pago.</p>
                </div>
            ) : (
                <div className="pres-list">
                    {receipts.map(receipt => (
                        <div key={receipt.id} className="pres-card">
                            <div className="pres-card-top">
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span className="pres-number">{formatReceiptId(receipt.receiptNumber)}</span>
                                        <span className="status-badge status-aprobado">Pagado</span>
                                        {receipt.budgetId && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                → Ref. {formatBudgetId(budgets.find(b => b.id === receipt.budgetId)?.budgetNumber ?? 0)}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ marginTop: '0.3rem', fontWeight: 600 }}>{receipt.clientName}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(receipt.createdAt).toLocaleDateString('es-AR')} · {receipt.concept}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="pres-total">${receipt.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Monto Cobrado</div>
                                </div>
                            </div>

                            <div className="pres-card-actions">
                                <button className="pres-action-btn" onClick={() => generateReceiptPDF(receipt)} title="Descargar PDF">
                                    <Download size={15} /> PDF
                                </button>
                                <button className="pres-action-btn" onClick={() => handleWhatsAppShare(receipt)} title="Enviar por WhatsApp" style={{ color: '#25D366' }}>
                                    <MessageCircle size={15} /> WhatsApp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title="Emitir Recibo de Pago"
                maxWidth="650px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button isLoading={isLoading} onClick={handleSubmit} disabled={showSuccess}>
                            {showSuccess ? '¡Creado!' : 'Generar Recibo'}
                        </Button>
                    </>
                }
            >
                <div className="pres-form">
                    {showSuccess && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            color: '#10B981',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            fontWeight: 600,
                            marginBottom: '1rem',
                            border: '1px solid rgba(16,185,129,0.2)'
                        }}>
                            ¡El recibo se ha creado correctamente!
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Vincular a Presupuesto (opcional)</label>
                        <select
                            className="form-select"
                            value={linkedBudgetId}
                            onChange={(e) => handleLinkedBudgetChange(e.target.value)}
                        >
                            <option value="">Sin vinculación</option>
                            {budgets.filter(b => b.status === 'aprobado').map(b => (
                                <option key={b.id} value={b.id}>
                                    {formatBudgetId(b.budgetNumber)} — {b.building} (${b.total})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label={linkedBudgetId ? "Edificio / Cliente *" : "Administrador / Responsable *"}
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder={linkedBudgetId ? "Nombre del edificio" : "Nombre del Administrador (Manual)"}
                        leftIcon={<Building2 size={18} />}
                        required
                    />

                    <div className="form-group">
                        <label className="form-label">Recibí la suma de pesos *</label>
                        <div className="textarea-container">
                            <Banknote className="textarea-icon" size={18} />
                            <textarea
                                className="form-textarea"
                                rows={2}
                                value={amountWritten}
                                onChange={e => setAmountWritten(e.target.value)}
                                placeholder="Ej: Cien mil ochocientos pesos con 00/100"
                                required
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <Input
                        label="En concepto de *"
                        value={concept}
                        onChange={e => setConcept(e.target.value)}
                        placeholder="Ej: Pago de abono mensual Marzo 2024"
                        leftIcon={<FileText size={18} />}
                        required
                    />

                    <div style={{ alignSelf: 'flex-end', width: '240px' }}>
                        <Input
                            label="Total en números ($) *"
                            type="number"
                            value={totalAmount || ''}
                            onChange={e => setTotalAmount(Number(e.target.value))}
                            placeholder="0.00"
                            leftIcon={<CreditCard size={18} />}
                            required
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Recibos;

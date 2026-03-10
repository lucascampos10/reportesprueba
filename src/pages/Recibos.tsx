import React, { useState } from 'react';
import { Plus, Receipt, Download, FileText, Search, CreditCard } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useReceipts, formatReceiptId } from '../context/ReceiptContext';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import jsPDF from 'jspdf';
import { logoBase64 } from '../assets/logoBase64';
import './Presupuestos.css'; // Reuse card and modal styles

const Recibos: React.FC = () => {
    const { receipts, addReceipt, isLoading: isLoadingReceipts } = useReceipts();
    const { budgets } = useBudgets();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [linkedBudgetId, setLinkedBudgetId] = useState('');
    const [clientName, setClientName] = useState('');
    const [amountWritten, setAmountWritten] = useState('');
    const [concept, setConcept] = useState('');
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const resetForm = () => {
        setLinkedBudgetId('');
        setClientName('');
        setAmountWritten('');
        setConcept('');
        setTotalAmount(0);
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
            const newReceipt = await addReceipt({
                budgetId: linkedBudgetId || undefined,
                clientName: clientName,
                amountWritten: amountWritten,
                concept: concept,
                totalAmount: totalAmount,
                signatureUrl: 'AUTO_GENERATED' // Marker for PDF logic
            });

            if (newReceipt) {
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error(error);
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

    const filteredReceipts = receipts.filter(r =>
        r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatReceiptId(r.receiptNumber).includes(searchTerm)
    );

    return (
        <div className="animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Recibos de Pago</h1>
                    <p className="page-subtitle">Comprobantes oficiales de cobro por servicios realizados.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Nuevo Recibo
                </Button>
            </div>

            {/* Search */}
            <div className="search-filter-container mb-6">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar por cliente o nro de recibo..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoadingReceipts ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredReceipts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><Receipt size={48} /></div>
                    <h2>No hay recibos todavía</h2>
                    <p>Hacé clic en "Nuevo Recibo" para generar un comprobante.</p>
                </div>
            ) : (
                <div className="pres-grid">
                    {filteredReceipts.map(receipt => (
                        <div key={receipt.id} className="pres-card">
                            <div className="pres-card-header">
                                <div className="pres-card-id">{formatReceiptId(receipt.receiptNumber)}</div>
                                <div className="pres-card-date">{new Date(receipt.createdAt).toLocaleDateString()}</div>
                            </div>
                            <h3 className="pres-card-client">{receipt.clientName}</h3>
                            <div className="pres-card-total">
                                <span>Total Cobrado:</span>
                                <strong>${receipt.totalAmount.toLocaleString('es-AR')}</strong>
                            </div>
                            <div className="pres-card-actions">
                                <Button variant="outline" size="sm" onClick={() => generateReceiptPDF(receipt)}>
                                    <Download size={14} /> PDF
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => generateReceiptPDF(receipt)}>
                                    <FileText size={14} /> Ver
                                </Button>
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
                maxWidth="600px"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button isLoading={isLoading} onClick={handleSubmit}>Generar Recibo</Button>
                    </>
                }
            >
                <div className="pres-form">
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

                    <div className="form-group">
                        <label className="form-label">Cliente / Edificio *</label>
                        <div className="input-with-icon">
                            <Building2 size={16} />
                            <input
                                className="form-input"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder="Nombre completo o Edificio"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Recibí la suma de pesos *</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            value={amountWritten}
                            onChange={e => setAmountWritten(e.target.value)}
                            placeholder="Ej: Cien mil ochocientos pesos con 00/100"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">En concepto de *</label>
                        <input
                            className="form-input"
                            value={concept}
                            onChange={e => setConcept(e.target.value)}
                            placeholder="Ej: Pago de abono mensual Marzo 2024"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Total en números ($) *</label>
                        <div className="input-with-icon">
                            <CreditCard size={16} />
                            <input
                                className="form-input"
                                type="number"
                                value={totalAmount || ''}
                                onChange={e => setTotalAmount(Number(e.target.value))}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Internal icon for Building2 as it was missing from imports
const Building2 = ({ size, className }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M15 2h2a2 2 0 0 1 2 2v18" /></svg>;

export default Recibos;


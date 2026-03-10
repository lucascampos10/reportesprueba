import React from 'react';
import {
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    DollarSign,
    FileText,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { useBudgets, formatBudgetId } from '../context/BudgetContext';
import { useReceipts } from '../context/ReceiptContext';
import { useWorkOrders, formatOrderId } from '../context/WorkOrderContext';
import { useNavigate } from 'react-router-dom';
import './FinanceOverview.css';

const FinanceOverview: React.FC = () => {
    const navigate = useNavigate();
    const { budgets } = useBudgets();
    const { receipts } = useReceipts();
    const { orders } = useWorkOrders();

    // --- Data Calculation ---

    // 1. Total Earnings (Current Month)
    const now = new Date();
    const currentMonthReceipts = receipts.filter(r => {
        const date = new Date(r.createdAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const totalEarningsMonth = currentMonthReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

    // 2. Pending Collection (Approved Budgets without Receipt)
    const pendingCollection = budgets
        .filter(b => b.status === 'aprobado' && !receipts.some(r => r.budgetId === b.id))
        .reduce((sum, b) => sum + b.total, 0);

    // 3. Budgets awaiting approval
    const awaitingApprovalCount = budgets.filter(b => b.status === 'enviado').length;
    const awaitingApprovalAmount = budgets
        .filter(b => b.status === 'enviado')
        .reduce((sum, b) => sum + b.total, 0);

    // 4. Orders missing budgets (Resolved orders without linked budgets)
    const ordersMissingBudgets = orders.filter(o =>
        o.status === 'resolved' &&
        !budgets.some(b => b.orderId === o.id)
    );

    // 5. Budgets for pending Approval list
    const pendingApprovalList = budgets
        .filter(b => b.status === 'enviado')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    // --- Render ---

    return (
        <div className="finance-overview animate-fade-in">
            <div className="dashboard-header mb-8">
                <div>
                    <h1 className="page-title">Vista General de Finanzas</h1>
                    <p className="page-subtitle">Control global de ingresos, presupuestos y facturación pendiente.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid mb-8">
                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-success-light text-success">
                                <DollarSign size={24} />
                            </div>
                            <div className="kpi-trend trend-up">
                                <TrendingUp size={14} /> +12%
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Ingresos (Mes Actual)</p>
                            <h3 className="kpi-value">${totalEarningsMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-warning-light text-warning">
                                <Clock size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Pendiente de Cobro</p>
                            <h3 className="kpi-value">${pendingCollection.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-info-light text-info">
                                <FileText size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Aprobación Pendiente</p>
                            <h3 className="kpi-value">{awaitingApprovalCount} Presupuestos</h3>
                            <p className="kpi-subtext">Total: ${awaitingApprovalAmount.toLocaleString('es-AR')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card glass-card">
                    <CardContent>
                        <div className="kpi-icon-row">
                            <div className="kpi-icon bg-danger-light text-danger">
                                <AlertCircle size={24} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <p className="kpi-label">Faltan Presupuestar</p>
                            <h3 className="kpi-value">{ordersMissingBudgets.length} Órdenes</h3>
                            <p className="kpi-subtext">Trabajos terminados sin presupuesto</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="stats-layout">
                {/* Pending Actions List */}
                <div className="actions-section">
                    <div className="section-header">
                        <h2>Faltan Presupuestar</h2>
                        <button className="view-all-btn" onClick={() => navigate('/admin/ordenes/historial')}>Ver todas <ArrowRight size={14} /></button>
                    </div>
                    <div className="action-list">
                        {ordersMissingBudgets.length > 0 ? (
                            ordersMissingBudgets.slice(0, 5).map(order => (
                                <div key={order.id} className="action-item" onClick={() => navigate('/admin/finanzas/presupuestos')}>
                                    <div className="action-indicator danger"></div>
                                    <div className="action-details">
                                        <p className="action-title">{order.title}</p>
                                        <p className="action-meta">{order.building} · {formatOrderId(order.orderNumber)}</p>
                                    </div>
                                    <ArrowUpRight className="action-arrow" size={16} />
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <CheckCircle2 size={32} className="text-success" />
                                <p>No hay órdenes pendientes de presupuesto.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Approvals in progress */}
                <div className="actions-section">
                    <div className="section-header">
                        <h2>Pendientes de Aprobación</h2>
                        <button className="view-all-btn" onClick={() => navigate('/admin/finanzas/presupuestos')}>Ver todos <ArrowRight size={14} /></button>
                    </div>
                    <div className="action-list">
                        {pendingApprovalList.length > 0 ? (
                            pendingApprovalList.map(budget => (
                                <div key={budget.id} className="action-item" onClick={() => navigate('/admin/finanzas/presupuestos')}>
                                    <div className="action-indicator warning"></div>
                                    <div className="action-details">
                                        <p className="action-title">{budget.building}</p>
                                        <p className="action-meta">{formatBudgetId(budget.budgetNumber)} · ${budget.total.toLocaleString('es-AR')}</p>
                                    </div>
                                    <Clock className="action-arrow" size={16} />
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FileText size={32} className="text-muted" />
                                <p>No hay presupuestos esperando respuesta.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple CSS-based Chart Mockup */}
            <div className="chart-section mt-8">
                <Card className="chart-card glass-card">
                    <CardContent>
                        <h2 className="section-title mb-6">Actividad Semanal</h2>
                        <div className="bar-chart">
                            {[45, 78, 52, 90, 65, 82, 40].map((val, i) => (
                                <div key={i} className="chart-column">
                                    <div className="bar-wrapper">
                                        <div className="bar" style={{ height: `${val}%` }}>
                                            <span className="tooltip">${(val * 1000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="day-label">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinanceOverview;

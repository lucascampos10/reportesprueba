import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Receipt, TrendingUp } from 'lucide-react';
import './Finanzas.css';

const Finanzas: React.FC = () => {
    return (
        <div className="finanzas-container animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Finanzas</h1>
                    <p className="page-subtitle">Generá, enviá y archivá documentos legales vinculados a tus órdenes.</p>
                </div>
            </div>

            <div className="finanzas-cards">
                <NavLink to="/admin/finanzas/presupuestos" className="finanzas-card">
                    <div className="finanzas-card-icon presupuestos">
                        <FileText size={36} />
                    </div>
                    <div className="finanzas-card-body">
                        <h2>Presupuestos</h2>
                        <p>Generá presupuestos vinculados a órdenes de trabajo y enviálos al administrador del edificio para su aprobación.</p>
                    </div>
                    <div className="finanzas-card-arrow">→</div>
                </NavLink>

                <NavLink to="/admin/finanzas/recibos" className="finanzas-card">
                    <div className="finanzas-card-icon recibos">
                        <Receipt size={36} />
                    </div>
                    <div className="finanzas-card-body">
                        <h2>Recibos</h2>
                        <p>Generá recibos de pago con firma digital del receptor una vez que el trabajo fue completado y cobrado.</p>
                    </div>
                    <div className="finanzas-card-arrow">→</div>
                </NavLink>

                <div className="finanzas-card finanzas-card-soon">
                    <div className="finanzas-card-icon reportes">
                        <TrendingUp size={36} />
                    </div>
                    <div className="finanzas-card-body">
                        <h2>Reportes</h2>
                        <p>Análisis de ingresos, gastos y estadísticas financieras del período.</p>
                    </div>
                    <span className="soon-chip">Próximamente</span>
                </div>
            </div>
        </div>
    );
};

export default Finanzas;

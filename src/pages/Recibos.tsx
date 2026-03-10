import React from 'react';
import { Receipt } from 'lucide-react';

const Recibos: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Recibos</h1>
                    <p className="page-subtitle">Generá recibos de pago una vez que el trabajo fue completado y cobrado.</p>
                </div>
            </div>

            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '40vh', gap: '1rem', textAlign: 'center'
            }}>
                <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                    <Receipt size={48} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No hay recibos todavía</h2>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '360px' }}>
                    Los recibos se generan a partir de presupuestos aprobados una vez que el trabajo fue finalizado y cobrado.
                </p>
            </div>
        </div>
    );
};

export default Recibos;

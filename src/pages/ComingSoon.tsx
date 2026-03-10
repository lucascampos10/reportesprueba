import React from 'react';
import { Calendar } from 'lucide-react';

const ComingSoonPage: React.FC<{ title: string; icon: React.ReactNode; description: string }> = ({ title, icon, description }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem',
        textAlign: 'center',
        padding: '2rem',
    }}>
        <div style={{
            display: 'inline-flex',
            padding: '1.5rem',
            borderRadius: '50%',
            background: 'rgba(232, 139, 45, 0.1)',
            color: 'var(--color-primary)',
            marginBottom: '0.5rem',
        }}>
            {icon}
        </div>
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '400px' }}>{description}</p>
        </div>
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '99px',
            background: 'rgba(232, 139, 45, 0.12)',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
        }}>
            PRÓXIMAMENTE
        </div>
    </div>
);

export const AgendaPage: React.FC = () => (
    <ComingSoonPage
        title="Agenda"
        icon={<Calendar size={48} />}
        description="Gestioná citas, reuniones y programá trabajos de mantenimiento con facilidad."
    />
);

export const ContactosPage: React.FC = () => (
    <ComingSoonPage
        title="Contactos"
        icon={<span style={{ fontSize: '3rem' }}>👥</span>}
        description="Directorio completo de clientes, edificios, proveedores y personal."
    />
);

export default ComingSoonPage;

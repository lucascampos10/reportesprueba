import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Lock } from 'lucide-react';

interface PasswordConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    title: string;
    message: string;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!password) {
            setError('Por favor, ingresá tu contraseña.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await onConfirm(password);
            setPassword('');
            onClose();
        } catch (err: any) {
            setError('Contraseña incorrecta o error de validación.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="400px"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button isLoading={isLoading} onClick={handleSubmit}>Confirmar</Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{message}</p>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                        <Lock size={16} />
                    </span>
                    <input
                        type="password"
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                    />
                </div>
                {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>}
            </div>
        </Modal>
    );
};

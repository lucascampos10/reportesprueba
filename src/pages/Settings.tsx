import React from 'react';
import { Moon, Sun, Monitor, Bell, Shield, Eye, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import './Settings.css';

const SettingsPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="settings-container animate-fade-in">
            <header className="settings-header">
                <div>
                    <h1 className="page-title">Ajustes</h1>
                    <p className="page-subtitle">Personalizá tu experiencia en Novak Servicios.</p>
                </div>
            </header>

            <div className="settings-grid">
                {/* Appearance Section */}
                <section className="settings-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h2 className="section-title">Apariencia</h2>
                            <p className="section-desc">Personalizá cómo se ve tu panel.</p>
                        </div>
                    </div>

                    <div className="settings-cards">
                        <Card className="theme-card">
                            <div className="theme-card-content">
                                <div className="theme-info">
                                    <div className={`theme-toggle-icon ${theme}`}>
                                        {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="setting-label">Modo {theme === 'light' ? 'Día' : 'Noche'}</h3>
                                        <p className="setting-desc">
                                            {theme === 'light' 
                                                ? 'Usando colores claros y brillantes para mejor visibilidad.' 
                                                : 'Usando colores oscuros para descansar la vista.'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    className={`theme-switch ${theme}`} 
                                    onClick={toggleTheme}
                                    aria-label="Toggle Theme"
                                >
                                    <div className="switch-handle">
                                        {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                                    </div>
                                </button>
                            </div>
                        </Card>

                        <div className="appearance-options">
                            <div className="option-item disabled">
                                <div className="option-icon"><Monitor size={18} /></div>
                                <span>Sincronizar con el Sistema</span>
                                <div className="soon-badge">Próx.</div>
                            </div>
                            <div className="option-item disabled">
                                <div className="option-icon"><Eye size={18} /></div>
                                <span>Modo de alto contraste</span>
                                <div className="soon-badge">Próx.</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Other Sections (Placeholders for now) */}
                <div className="settings-secondary-grid">
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-icon"><Bell size={20} /></div>
                            <div>
                                <h2 className="section-title">Notificaciones</h2>
                                <p className="section-desc">Gestioná tus alertas.</p>
                            </div>
                        </div>
                        <div className="placeholder-card">
                            Configuración de notificaciones disponible pronto.
                        </div>
                    </section>

                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-icon"><Shield size={20} /></div>
                            <div>
                                <h2 className="section-title">Seguridad</h2>
                                <p className="section-desc">Contraseñas y accesos.</p>
                            </div>
                        </div>
                        <div className="placeholder-card">
                            Ajustes de seguridad próximamente.
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

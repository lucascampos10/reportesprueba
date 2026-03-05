import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, X, CheckCircle2, MessageSquare, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkOrders } from '../context/WorkOrderContext';
import type { ContactMethod, Priority } from '../context/WorkOrderContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { addOrder } = useWorkOrders();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    // Form fields
    const [reporterName, setReporterName] = useState('');
    const [building, setBuilding] = useState('');
    const [department, setDepartment] = useState('');
    const [contactMethod, setContactMethod] = useState<ContactMethod>('whatsapp');
    const [contactValue, setContactValue] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState<Priority>('media');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const imgUrl = URL.createObjectURL(e.target.files[0]);
            setImages([...images, imgUrl]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Save order to global context mimicking backend save
        await new Promise(resolve => setTimeout(resolve, 800));

        addOrder({
            title: `Reporte en ${location}`,
            description,
            category,
            building,
            department,
            location,
            reporterName,
            contactMethod,
            contactValue,
            priority,
            images,
        });

        setIsLoading(false);
        setStep(2); // Success step
    };

    const resetForm = () => {
        setStep(1);
        setImages([]);
        setReporterName('');
        setBuilding('');
        setDepartment('');
        setContactValue('');
        setCategory('');
        setPriority('media');
        setLocation('');
        setDescription('');
    };

    if (step === 2) {
        return (
            <div className="landing-container">
                <div className="landing-glow"></div>
                <Card className="success-card animate-fade-in">
                    <CardContent className="success-content">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={64} />
                        </div>
                        <h2 className="success-title">¡Orden Reportada Exitosamente!</h2>
                        <p className="success-message">
                            Tu reporte ha sido registrado en nuestro sistema. Te notificaremos las novedades a través de {contactMethod === 'whatsapp' ? 'WhatsApp' : 'Correo Electrónico'}.
                        </p>
                        <Button onClick={resetForm}>
                            Enviar Otro Reporte
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="landing-container">
            <div className="landing-glow"></div>

            {/* Admin Login Button in corner */}
            <button
                className="admin-login-btn"
                onClick={() => navigate('/login')}
            >
                Acceso Empleados
            </button>

            <div className="landing-content">
                <div className="landing-header animate-fade-in">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src="/logo-novak.png" alt="Novak Soluciones" className="landing-logo-img" />
                    </div>
                    <p className="landing-subtitle">Portal de Reportes de Mantenimiento</p>
                </div>

                <Card className="form-card animate-slide-up">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="text-center pb-2">
                            <CardTitle>Reportar un Problema</CardTitle>
                            <p className="text-sm text-muted mt-2">Por favor, danos los detalles para solucionarlo lo antes posible.</p>
                        </CardHeader>

                        <CardContent className="landing-form-content">

                            <div className="form-section">
                                <h3 className="section-label">1. Tus Datos</h3>
                                <div className="grid-2-col">
                                    <Input
                                        label="Tu Nombre"
                                        placeholder="Ej. Juan Pérez"
                                        value={reporterName}
                                        onChange={(e) => setReporterName(e.target.value)}
                                        required
                                    />

                                    <div className="form-group">
                                        <label className="form-label">Edificio</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={building}
                                            onChange={(e) => setBuilding(e.target.value)}
                                        >
                                            <option value="" disabled>Selecciona tu edificio</option>
                                            <option value="Torre Alvear">Torre Alvear</option>
                                            <option value="Edificio Libertador">Edificio Libertador</option>
                                            <option value="Complejo Center">Complejo Center</option>
                                            <option value="Residencial del Parque">Residencial del Parque</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid-2-col">
                                    <div className="form-group">
                                        <label className="form-label">Departamento</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                        >
                                            <option value="" disabled>Selecciona tu departamento</option>
                                            <option value="Depto 1A">Depto 1A</option>
                                            <option value="Depto 1B">Depto 1B</option>
                                            <option value="Depto 2A">Depto 2A</option>
                                            <option value="Depto 2B">Depto 2B</option>
                                            <option value="Depto 3A">Depto 3A</option>
                                            <option value="Depto 404">Depto 404</option>
                                            <option value="Planta Baja">Planta Baja / Áreas Comunes</option>
                                        </select>
                                    </div>

                                    <div className="contact-method-group">
                                        <label className="form-label">Recibir novedades por:</label>
                                        <div className="contact-toggle">
                                            <button
                                                type="button"
                                                className={`contact-btn ${contactMethod === 'whatsapp' ? 'active' : ''}`}
                                                onClick={() => setContactMethod('whatsapp')}
                                            >
                                                <MessageSquare size={16} /> WhatsApp
                                            </button>
                                            <button
                                                type="button"
                                                className={`contact-btn ${contactMethod === 'email' ? 'active' : ''}`}
                                                onClick={() => setContactMethod('email')}
                                            >
                                                <Mail size={16} /> Correo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Input
                                    label={contactMethod === 'whatsapp' ? 'Número de WhatsApp' : 'Correo Electrónico'}
                                    type={contactMethod === 'whatsapp' ? 'tel' : 'email'}
                                    placeholder={contactMethod === 'whatsapp' ? 'Ej. +54 9 11 1234-5678' : 'Ej. juan@correo.com'}
                                    value={contactValue}
                                    onChange={(e) => setContactValue(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-section">
                                <h3 className="section-label">2. Reporte</h3>

                                <div className="grid-2-col">
                                    <div className="form-group">
                                        <label className="form-label">Categoría</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="" disabled>¿Qué tipo de problema es?</option>
                                            <option value="Plomería">Plomería / Agua</option>
                                            <option value="Electricidad">Electricidad / Luces</option>
                                            <option value="Limpieza">Limpieza</option>
                                            <option value="Infraestructura">Paredes / Pisos / Puertas</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label flex items-center gap-1">
                                            Prioridad <AlertTriangle size={14} className="text-warning" />
                                        </label>
                                        <select
                                            className="form-select"
                                            required
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as Priority)}
                                        >
                                            <option value="baja">Baja (Puede esperar unos días)</option>
                                            <option value="media">Media (Necesita atención pronto)</option>
                                            <option value="alta">Urgente (Emergencia / Peligro)</option>
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    label="Lugar específico del problema"
                                    placeholder="Ej. Baño de visitas, pasillo principal"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Descripción detallada</label>
                                    <textarea
                                        className="form-textarea minimal-textarea"
                                        placeholder="Describe el problema en detalle, qué lo originó, desde cuándo está así..."
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="section-label flex items-center justify-between">
                                    3. Fotos (Opcional)
                                    <span className="text-xs text-muted font-normal">{images.length}/3 fotos</span>
                                </h3>

                                <div className="photo-upload-container">
                                    {images.length < 3 && (
                                        <div className="upload-zone compact">
                                            <input
                                                type="file"
                                                id="image-upload"
                                                className="hidden-input"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                            <label htmlFor="image-upload" className="upload-label compact-label">
                                                <Camera size={24} className="upload-icon" />
                                                <span className="upload-text text-sm">Agregar Foto</span>
                                            </label>
                                        </div>
                                    )}

                                    {images.map((img, idx) => (
                                        <div key={idx} className="preview-thumbnail">
                                            <img src={img} alt={`Preview ${idx}`} />
                                            <button
                                                className="remove-thumb-btn"
                                                onClick={() => removeImage(idx)}
                                                type="button"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </CardContent>

                        <CardFooter className="landing-footer">
                            <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
                                Enviar Reporte
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default LandingPage;

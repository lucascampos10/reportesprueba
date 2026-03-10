import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkOrders } from '../context/WorkOrderContext';
import type { Priority } from '../context/WorkOrderContext';
import { uploadImage } from '../lib/storage';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { addOrder } = useWorkOrders();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Form fields
    const [reporterName, setReporterName] = useState('');
    const [building, setBuilding] = useState('');
    const [department, setDepartment] = useState('');
    const [contactValue, setContactValue] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState<Priority>('media');
    const [location, setLocation] = useState('');
    const [availability, setAvailability] = useState('');
    const [description, setDescription] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && images.length < 3) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setImages(prev => [...prev, previewUrl]);
            setImageFiles(prev => [...prev, file]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const uploadedUrls: string[] = [];
            for (const file of imageFiles) {
                const url = await uploadImage(file, 'reportes');
                uploadedUrls.push(url);
            }

            await addOrder({
                title: `Reporte: ${category} en ${building}`,
                description,
                category,
                building,
                department,
                location,
                reporterName,
                contactMethod: 'whatsapp',
                contactValue,
                priority,
                images: uploadedUrls,
                availability,
            });
            setStep(2);
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Hubo un error al enviar el reporte. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setImages([]);
        setImageFiles([]);
        setReporterName('');
        setBuilding('');
        setDepartment('');
        setContactValue('');
        setCategory('');
        setPriority('media');
        setLocation('');
        setAvailability('');
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
                        <h2 className="success-title">¡Reporte Enviado!</h2>
                        <p className="success-message">
                            Hemos recibido tu reporte. Nos pondremos en contacto con vos a la brevedad por **WhatsApp** para coordinar la solución.
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
                            <p className="text-sm text-muted mt-2">Completá los datos para que podamos ayudarte lo antes posible.</p>
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
                                    <Input
                                        label="Número de WhatsApp"
                                        type="tel"
                                        placeholder="Ej. 3517585241"
                                        value={contactValue}
                                        onChange={(e) => setContactValue(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid-2-col">
                                    <Input
                                        label="Edificio"
                                        placeholder="Ej. Torre Alvear"
                                        value={building}
                                        onChange={(e) => setBuilding(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Piso / Departamento"
                                        placeholder="Ej. Piso 4 Depto B"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Disponibilidad Horaria"
                                    placeholder="Ej. Lunes a Viernes de 14 a 18hs"
                                    value={availability}
                                    onChange={(e) => setAvailability(e.target.value)}
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
                                            <option value="" disabled>Seleccionar categoría...</option>
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
                                            <option value="alta">Alta (1 a 3 días)</option>
                                            <option value="media">Media (3 a 7 días)</option>
                                            <option value="baja">Baja (Más de 7 días)</option>
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    label="Lugar específico del problema"
                                    placeholder="Ej. Baño de visitas, pasillo 2do piso"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Descripción del problema</label>
                                    <textarea
                                        className="form-textarea minimal-textarea"
                                        placeholder="Describe brevemente el inconveniente..."
                                        rows={3}
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

                            <div className="form-section">
                                <div style={{
                                    background: 'rgba(234, 179, 8, 0.1)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'center'
                                }}>
                                    <AlertTriangle size={20} className="text-warning" style={{ flexShrink: 0 }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                        <strong>Atención:</strong> Un integrante de nuestro equipo se comunicará pronto para coordinar una cita y revisar el inconveniente.
                                    </p>
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

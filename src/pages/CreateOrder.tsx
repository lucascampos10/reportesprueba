import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Camera, X, MapPin, AlignLeft, Info } from 'lucide-react';
import './CreateOrder.css';

const CreateOrder: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Mocking image upload with object URL
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

        // Mock save delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        navigate('/');
    };

    return (
        <div className="create-order-container animate-fade-in">
            <div className="dashboard-header mb-6">
                <div>
                    <h1 className="page-title">Nueva Orden de Trabajo</h1>
                    <p className="page-subtitle">Registra una nueva incidencia o solicitud de mantenimiento.</p>
                </div>
            </div>

            <div className="form-layout">
                <form onSubmit={handleSubmit} className="main-form">
                    <Card className="form-card">
                        <CardHeader>
                            <CardTitle>Información del Problema</CardTitle>
                        </CardHeader>
                        <CardContent className="form-content">
                            <Input
                                label="Título Breve"
                                placeholder="Ej. Fuga de agua en baño principal"
                                leftIcon={<Info size={18} />}
                                required
                            />

                            <div className="form-group">
                                <label className="form-label">Descripción Detallada</label>
                                <div className="textarea-container">
                                    <AlignLeft className="textarea-icon" size={18} />
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Describe el problema con la mayor cantidad de detalles posible..."
                                        rows={4}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label className="form-label">Categoría</label>
                                    <select className="form-select" required>
                                        <option value="" disabled selected>Selecciona una categoría</option>
                                        <option value="plomeria">Plomería</option>
                                        <option value="electricidad">Electricidad</option>
                                        <option value="mantenimiento">Mantenimiento General</option>
                                        <option value="limpieza">Limpieza</option>
                                        <option value="seguridad">Seguridad</option>
                                    </select>
                                </div>

                                <div className="form-group flex-1">
                                    <label className="form-label">Prioridad</label>
                                    <select className="form-select" required>
                                        <option value="baja">Baja - Puede esperar</option>
                                        <option value="media" selected>Media - Requiere atención</option>
                                        <option value="alta">Alta - Urgente</option>
                                    </select>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="form-card">
                        <CardHeader>
                            <CardTitle>Ubicación y Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="form-content">
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label className="form-label">Edificio</label>
                                    <select className="form-select" required>
                                        <option value="" disabled selected>Selecciona un edificio</option>
                                        <option value="1">Torre Alvear</option>
                                        <option value="2">Edificio Libertador</option>
                                        <option value="3">Complejo Center</option>
                                        <option value="4">Residencial del Parque</option>
                                    </select>
                                </div>

                                <div className="form-group flex-1">
                                    <Input
                                        label="Ubicación Específica"
                                        placeholder="Ej. Piso 3, Depto B / Lobby"
                                        leftIcon={<MapPin size={18} />}
                                        required
                                    />
                                </div>
                            </div>

                            <Input
                                label="Datos del Solicitante (Tu Nombre)"
                                placeholder="Juan Pérez"
                                defaultValue="Admin Novak"
                                disabled
                            />
                        </CardContent>
                    </Card>
                </form>

                <div className="sidebar-form">
                    <Card className="form-card">
                        <CardHeader>
                            <CardTitle>Evidencia Fotográfica</CardTitle>
                        </CardHeader>
                        <CardContent className="form-content">
                            <div className="upload-zone">
                                <input
                                    type="file"
                                    id="image-upload"
                                    className="hidden-input"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <label htmlFor="image-upload" className="upload-label">
                                    <Camera size={40} className="upload-icon" />
                                    <span className="upload-text">Tomar Foto o Subir</span>
                                    <span className="upload-hint">Formatos: JPG, PNG (Max. 5MB)</span>
                                </label>
                            </div>

                            {images.length > 0 && (
                                <div className="images-preview">
                                    <h4 className="preview-title">Fotos Adjuntas ({images.length})</h4>
                                    <div className="preview-grid">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="preview-item">
                                                <img src={img} alt={`Preview ${idx}`} />
                                                <button
                                                    className="remove-img-btn"
                                                    onClick={() => removeImage(idx)}
                                                    type="button"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="form-card action-card">
                        <CardContent className="action-content">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => navigate('/')}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                fullWidth
                                onClick={handleSubmit}
                                isLoading={isLoading}
                            >
                                Crear Orden
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;

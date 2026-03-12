import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from './Button';
import './ImageViewer.css';

interface ImageViewerProps {
    images: string[];
    onClose: () => void;
    initialIndex?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, onClose, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (images.length === 0) return null;

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = images[currentIndex];
        link.download = `imagen_${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="image-viewer-overlay animate-fade-in" onClick={onClose}>
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-viewer-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="image-viewer-main">
                    {images.length > 1 && (
                        <button className="nav-btn prev" onClick={prevImage}>
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    <img 
                        src={images[currentIndex]} 
                        alt={`Imagen ${currentIndex + 1}`} 
                        className="viewer-img animate-zoom-in"
                    />

                    {images.length > 1 && (
                        <button className="nav-btn next" onClick={nextImage}>
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>

                <div className="image-viewer-footer">
                    <p className="image-counter">Imagen {currentIndex + 1} de {images.length}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="outline" size="sm" onClick={handleDownload} className="download-btn">
                            <Download size={14} style={{ marginRight: '0.5rem' }} /> Descargar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;

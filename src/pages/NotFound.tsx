import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../components/Button';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content animate-fade-in">
        <div className="not-found-icon-wrapper">
          <div className="not-found-glow"></div>
          <ShieldAlert size={80} className="not-found-icon" />
          <div className="not-found-404">404</div>
        </div>
        
        <h1 className="not-found-title">Página No Encontrada</h1>
        <p className="not-found-text">
          Lo sentimos, la página que estás buscando no existe o ha sido movida a una nueva ubicación.
        </p>
        
        <div className="not-found-actions">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} /> Volver Atrás
          </Button>
          <Button 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Home size={18} /> Ir al Inicio
          </Button>
        </div>
      </div>
      
      <div className="not-found-background">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
      </div>
    </div>
  );
};

export default NotFound;

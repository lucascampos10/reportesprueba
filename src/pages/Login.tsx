import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError('Credenciales inválidas.');
                return;
            }

            if (authData.user) {
                // Fetch user role from profiles
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError || !profile) {
                    console.error("Error fetching profile:", profileError);
                    // If no profile exists, show error — don't auto-grant admin access
                    setError('Tu usuario no tiene un perfil configurado. Contactá al administrador.');
                    await supabase.auth.signOut(); // Sign them out so they can't access protected routes
                } else {
                    if (profile.role === 'operario') {
                        navigate('/operario');
                    } else {
                        navigate('/admin');
                    }
                }
            }
        } catch (err: any) {
            console.error("Login catch error:", err);
            setError('Ocurrió un error al intentar iniciar sesión.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glow"></div>
            <div className="login-glow login-glow-secondary"></div>

            <div className="login-content">
                <div className="login-brand animate-fade-in">
                    <div className="login-logo">
                        <img src="/logo-novak.png" alt="Novak Soluciones" style={{ width: '100px', height: '100px', borderRadius: '1.25rem' }} />
                    </div>
                </div>

                <Card className="login-card animate-fade-in">
                    <CardHeader>
                        <CardTitle className="login-title">Iniciar Sesión</CardTitle>
                        <p className="login-subtitle">Ingresa a tu cuenta para gestionar edificios y órdenes de trabajo.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="login-form">
                            <Input
                                label="Correo Electrónico"
                                type="email"
                                placeholder="ejemplo@novak.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<Mail />}
                                required
                            />

                            <Input
                                label="Contraseña"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<Lock />}
                                error={error}
                                required
                            />



                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                className="login-submit-btn"
                            >
                                Ingresar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;

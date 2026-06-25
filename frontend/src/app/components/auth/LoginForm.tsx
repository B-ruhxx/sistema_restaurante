import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth';
import { LoginBrand } from './LoginBrand';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { Card, CardContent } from '../ui/card';

export function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ username, password });
            navigate('/', { replace: true });
        } catch {
            setError('Usuario o contraseña incorrectos');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full border-0 bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardContent className="p-0">
                {/* Renderizamos el Brand centrado aquí dentro en la cabecera */}
                <LoginBrand />

                <form onSubmit={handleLogin} className="space-y-5 mt-6">
                    <div>
                        <Label
                            htmlFor="username"
                            className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block mb-1.5"
                        >
                            Usuario
                        </Label>
                        <Input
                            id="username"
                            className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-red-500"
                            placeholder="Nombre de usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label
                            htmlFor="password"
                            className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block mb-1.5"
                        >
                            Contraseña
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                className="h-12 rounded-xl border-zinc-200 bg-white px-4 pr-10 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-red-500"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md shadow-red-600/10 mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Validando acceso...' : 'Iniciar Sesión'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
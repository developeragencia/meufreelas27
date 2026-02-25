import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiResendActivation, hasApi } from '../lib/api';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [notVerifiedEmail, setNotVerifiedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setNotVerifiedEmail(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Preencha email e senha.');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(trimmedEmail, password);
      if (result.success) {
        const stored = localStorage.getItem('meufreelas_user');
        const u = stored ? (JSON.parse(stored) as { type?: string }) : null;
        const dest = u?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard';
        navigate(dest, { replace: true });
      } else {
        setError(result.error || 'Email ou senha incorretos.');
        if (result.code === 'NOT_VERIFIED') setNotVerifiedEmail(trimmedEmail);
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendActivation = async () => {
    const emailToUse = notVerifiedEmail ?? email.trim();
    if (!emailToUse) return;
    setError('');
    setSuccessMessage('');
    setIsResendLoading(true);
    try {
      if (hasApi()) {
        const res = await apiResendActivation(emailToUse);
        if (res.ok) {
          setSuccessMessage(res.message || 'E-mail de ativação reenviado. Verifique sua caixa de entrada e o spam.');
        } else {
          setError(res.error || 'Não foi possível reenviar o e-mail.');
        }
      } else {
        setError('Reenvio de e-mail não disponível neste modo.');
      }
    } catch {
      setError('Erro ao reenviar. Tente novamente.');
    } finally {
      setIsResendLoading(false);
    }
  };

  const handleSocialLogin = () => {
    setError('Login social em breve.');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-99dark py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/" className="text-white text-2xl font-bold">
            meu<span className="font-light">freelas</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">
            Login
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Entre na sua conta para continuar
          </p>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleSocialLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6" role="alert">
              {error}
              {notVerifiedEmail && hasApi() && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResendActivation}
                    disabled={isResendLoading}
                    className="text-sm font-medium text-99blue hover:underline disabled:opacity-50"
                  >
                    {isResendLoading ? 'Enviando...' : 'Reenviar e-mail de ativação'}
                  </button>
                </div>
              )}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6" role="status">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                  placeholder="Sua senha"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-99blue border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-99blue hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-99blue hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

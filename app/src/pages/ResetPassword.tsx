import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { apiResetPassword } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Link inválido. Use o link recebido por e-mail.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) return;
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiResetPassword(token, password);
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.error || 'Não foi possível redefinir a senha. O link pode ter expirado.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-99dark py-4">
          <div className="max-w-7xl mx-auto px-4">
            <Link to="/" className="text-white text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 text-center">
            <p className="text-red-600 mb-6">{error}</p>
            <Link to="/forgot-password" className="text-99blue hover:underline font-medium">
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-99dark py-4">
          <div className="max-w-7xl mx-auto px-4">
            <Link to="/" className="text-white text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Senha alterada</h2>
            <p className="text-gray-500 mb-6">Faça login com sua nova senha.</p>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors text-center"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-99dark py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/" className="text-white text-2xl font-bold">
            meu<span className="font-light">freelas</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">
            Nova senha
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Digite e confirme sua nova senha (mínimo 6 caracteres).
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            <Link to="/login" className="text-99blue hover:underline font-medium">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { apiForgotPassword, hasApi } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Digite seu e-mail.');
      return;
    }

    if (!hasApi()) {
      setError('API não configurada para recuperação de senha.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiForgotPassword(targetEmail);
      if (!res.ok) {
        setError(res.error || 'Não foi possível enviar o e-mail de recuperação.');
      } else {
        setSuccess(res.message || 'Se o e-mail existir em nossa base, você receberá as instruções em alguns minutos. Verifique também a pasta de spam.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifique seu e-mail</h2>
              <p className="text-gray-500 mb-6">{success}</p>
              <Link to="/login" className="inline-flex items-center text-99blue hover:underline font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">Recuperar senha</h1>
              <p className="text-gray-500 text-center mb-8">
                Digite seu e-mail para receber o link de redefinição (válido por 60 minutos).
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="text-99blue hover:underline font-medium">
                    Fazer login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

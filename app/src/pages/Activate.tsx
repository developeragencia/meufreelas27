import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiActivate, hasApi } from '../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link inválido. Use o link que enviamos no e-mail.');
      return;
    }
    if (!hasApi()) {
      setStatus('error');
      setMessage('Configuração da API não encontrada.');
      return;
    }
    apiActivate(token).then((res) => {
      if (res.ok) {
        setStatus('ok');
        setMessage(res.message || 'Conta ativada. Faça login para acessar o painel.');
      } else {
        setStatus('error');
        setMessage(res.error || 'Link inválido ou expirado.');
      }
    }).catch(() => {
      setStatus('error');
      setMessage('Erro ao ativar. Tente novamente.');
    });
  }, [token]);

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
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue mx-auto mb-4" />
              <p className="text-gray-600">Ativando sua conta...</p>
            </>
          )}
          {status === 'ok' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-800 mb-2">Conta ativada!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors"
              >
                Fazer login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-800 mb-2">Não foi possível ativar</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors"
              >
                Ir para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

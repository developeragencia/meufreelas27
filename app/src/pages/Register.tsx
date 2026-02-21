import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<'freelancer' | 'client' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeSelection = (type: 'freelancer' | 'client') => {
    setUserType(type);
  };

  const handleContinue = () => {
    if (!userType) {
      setError('Selecione um tipo de conta');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userType) {
      setError('Selecione um tipo de conta');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(name, email, password, userType);
      if (success) {
        const dest = userType === 'freelancer' ? '/freelancer/dashboard' : '/dashboard';
        navigate(dest, { replace: true });
      } else {
        setError('Este email já está cadastrado');
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                Criar uma conta
              </h1>
              <p className="text-gray-500 text-center mb-8">
                Seja bem-vindo ao MeuFreelas! Diga-nos o que você está procurando.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleTypeSelection('client')}
                  className={`w-full flex items-center p-4 border-2 rounded-lg transition-all ${
                    userType === 'client'
                      ? 'border-99blue bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 ${userType === 'client' ? 'bg-99blue' : 'bg-gray-100'}`}>
                    <Briefcase className={`w-6 h-6 ${userType === 'client' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-medium ${userType === 'client' ? 'text-99blue' : 'text-gray-800'}`}>
                      Eu quero Contratar
                    </p>
                    <p className="text-sm text-gray-500">
                      Publique um projeto e encontre freelancers incríveis.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'client'}
                    onChange={() => handleTypeSelection('client')}
                    className="w-5 h-5 text-99blue"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelection('freelancer')}
                  className={`w-full flex items-center p-4 border-2 rounded-lg transition-all ${
                    userType === 'freelancer'
                      ? 'border-99blue bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 ${userType === 'freelancer' ? 'bg-99blue' : 'bg-gray-100'}`}>
                    <User className={`w-6 h-6 ${userType === 'freelancer' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-medium ${userType === 'freelancer' ? 'text-99blue' : 'text-gray-800'}`}>
                      Eu quero Trabalhar
                    </p>
                    <p className="text-sm text-gray-500">
                      Encontre projetos, seja contratado e ganhe dinheiro.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'freelancer'}
                    onChange={() => handleTypeSelection('freelancer')}
                    className="w-5 h-5 text-99blue"
                  />
                </button>
              </div>

              <button
                onClick={handleContinue}
                className="w-full mt-6 py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors flex items-center justify-center"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-99blue hover:underline font-medium">
                    Faça login
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                ← Voltar
              </button>

              <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                Criar Conta
              </h1>
              <p className="text-gray-500 text-center mb-8">
                Complete seus dados para finalizar o cadastro
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      placeholder="Confirme sua senha"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-99blue border-gray-300 rounded" required />
                  <span className="ml-2 text-sm text-gray-600">
                    Aceito os{' '}
                    <Link to="/termos" className="text-99blue hover:underline">Termos de uso</Link>
                    {' '}e{' '}
                    <Link to="/privacidade" className="text-99blue hover:underline">Política de privacidade</Link>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-99blue hover:underline font-medium">
                    Faça login
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

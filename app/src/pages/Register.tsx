import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';

type UserTypeOption = 'freelancer' | 'client';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserTypeOption | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeSelection = (type: UserTypeOption) => {
    setUserType(type);
    setError('');
  };

  const handleContinue = () => {
    if (!userType) {
      setError('Selecione um tipo de conta');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userType) {
      setError('Selecione um tipo de conta');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Informe seu nome');
      return;
    }
    if (!trimmedEmail) {
      setError('Informe seu email');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      setSuccessMessage('');
      const result = await register(trimmedName, trimmedEmail, password, userType);
      if (result.success && result.requiresActivation) {
        setSuccessMessage(result.message || 'Enviamos um e-mail de ativação. Clique no link para ativar sua conta e depois faça login.');
        return;
      }
      if (result.success) {
        const dest = userType === 'freelancer' ? '/freelancer/dashboard' : '/dashboard';
        navigate(dest, { replace: true });
      } else {
        setError(result.message || 'Este email já está cadastrado com este tipo de conta. Tente fazer login ou use outro email.');
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
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleTypeSelection('client')}
                  className={`w-full flex items-center p-4 border-2 rounded-lg transition-all text-left ${
                    userType === 'client'
                      ? 'border-99blue bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 shrink-0 ${userType === 'client' ? 'bg-99blue' : 'bg-gray-100'}`}>
                    <Briefcase className={`w-6 h-6 ${userType === 'client' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
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
                    className="w-5 h-5 text-99blue shrink-0"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelection('freelancer')}
                  className={`w-full flex items-center p-4 border-2 rounded-lg transition-all text-left ${
                    userType === 'freelancer'
                      ? 'border-99blue bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 shrink-0 ${userType === 'freelancer' ? 'bg-99blue' : 'bg-gray-100'}`}>
                    <User className={`w-6 h-6 ${userType === 'freelancer' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
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
                    className="w-5 h-5 text-99blue shrink-0"
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="w-full mt-6 py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors flex items-center justify-center"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
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
                type="button"
                onClick={handleBack}
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

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6" role="alert">
                  <p className="font-medium">Conta criada!</p>
                  <p className="mt-1 text-sm">{successMessage}</p>
                  <Link to="/login" className="inline-block mt-3 text-99blue font-medium hover:underline">
                    Ir para o login →
                  </Link>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6" role="alert">
                  {error}
                </div>
              )}

              {!successMessage && (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                      placeholder="Seu nome completo"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="register-email"
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
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
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

                <div>
                  <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="register-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent outline-none"
                      placeholder="Confirme sua senha"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="register-terms"
                    type="checkbox"
                    className="w-4 h-4 text-99blue border-gray-300 rounded mt-0.5"
                    required
                  />
                  <label htmlFor="register-terms" className="ml-2 text-sm text-gray-600 cursor-pointer">
                    Aceito os{' '}
                    <Link to="/termos" className="text-99blue hover:underline">Termos de uso</Link>
                    {' '}e{' '}
                    <Link to="/privacidade" className="text-99blue hover:underline">Política de privacidade</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
              )}

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

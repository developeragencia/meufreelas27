import { useState } from 'react';
import { Check, X, HelpCircle, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import PaymentModal from '../components/PaymentModal';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'free',
    name: 'Básico',
    price: '0,00',
    period: 'mês',
    connections: 10,
    features: [
      '10 conexões por mês',
      'Taxa de 15% sobre projetos',
      'Perfil básico',
      'Participação em projetos públicos',
    ],
    notIncluded: [
      'Destaque nas buscas',
      'Ver média de propostas',
      'Selos exclusivos',
      'Suporte prioritário',
    ],
    icon: Star,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    btnColor: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: '49,90',
    period: 'mês',
    connections: 80,
    features: [
      '80 conexões por mês',
      'Taxa reduzida de 12%',
      'Perfil Profissional',
      'Destaque nas buscas (Nível 1)',
      'Ver média de propostas',
      'Participação em projetos exclusivos',
    ],
    notIncluded: [
      'Prioridade máxima',
      'Selo Premium',
    ],
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    btnColor: 'bg-blue-600 text-white hover:bg-blue-700',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '79,90',
    period: 'mês',
    connections: 240,
    features: [
      '240 conexões por mês',
      'Taxa mínima de 10%',
      'Perfil Premium com destaque máximo',
      'Selo Premium exclusivo',
      'Ver todas as estatísticas de projetos',
      'Suporte prioritário 24/7',
      'Recebimento em 3 dias úteis',
    ],
    notIncluded: [],
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-b from-yellow-50 to-white',
    btnColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700',
  },
];

export default function Premium() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    
    if (plan?.id === 'free') {
        // Plano grátis é direto
        handleSuccess(plan);
    } else {
        // Planos pagos abrem modal
        setSelectedPlan(plan);
        setPaymentModalOpen(true);
    }
  };

  const handleSuccess = (plan: any) => {
      // Update user context and persist to localStorage
      const updatedData = {
        plan: plan.id as 'free' | 'pro' | 'premium',
        connections: (user?.connections || 0) + plan.connections,
        isPremium: plan.id === 'premium',
        isPro: plan.id === 'pro' || plan.id === 'premium',
      };

      updateUser(updatedData);
      
      try {
        const storedUsers = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
        const updatedUsers = storedUsers.map((u: any) => 
          u.id === user?.id ? { ...u, ...updatedData } : u
        );
        localStorage.setItem('meufreelas_users', JSON.stringify(updatedUsers));
        
        const profileKey = `profile_${user?.id}`;
        const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        localStorage.setItem(profileKey, JSON.stringify({ ...profile, ...updatedData }));
      } catch (e) {
        console.error("Error persisting plan", e);
      }

      alert(`Parabéns! Você assinou o plano ${plan.name} com sucesso.`);
      setPaymentModalOpen(false);
      navigate('/freelancer/dashboard');
  };

  return (
    <div className="bg-white">
      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        plan={selectedPlan || {}}
        onSuccess={() => handleSuccess(selectedPlan)}
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <BrandLogo />
            <nav className="hidden md:flex space-x-8">
              <Link to="/projects" className="text-gray-500 hover:text-gray-900">
                Encontrar Trabalho
              </Link>
              <Link to="/freelancers" className="text-gray-500 hover:text-gray-900">
                Encontrar Talentos
              </Link>
              <Link to="/login" className="text-gray-500 hover:text-gray-900">
                Entrar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Invista na sua carreira
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Aumente suas chances de conseguir projetos, economize nas taxas e tenha acesso a recursos exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = user?.plan === plan.id || (!user?.plan && plan.id === 'free');

              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-2xl shadow-xl flex flex-col overflow-hidden transition-transform hover:-translate-y-1 ${plan.bgColor} ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MAIS POPULAR
                    </div>
                  )}
                  
                  <div className="p-8 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-white shadow-sm ${plan.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                    
                    <div className="flex items-baseline mb-8">
                      <span className="text-4xl font-extrabold text-gray-900">R$ {plan.price}</span>
                      <span className="ml-1 text-xl text-gray-500">/{plan.period}</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, index) => (
                        <li key={index} className="flex items-start opacity-50">
                          <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-500 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 bg-white/50 border-t border-gray-100">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan || loading !== null}
                      className={`w-full py-3 px-6 rounded-lg font-bold text-center transition-colors shadow-sm ${
                        isCurrentPlan 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : plan.btnColor
                      }`}
                    >
                      {loading === plan.id ? 'Processando...' : isCurrentPlan ? 'Plano Atual' : `Assinar ${plan.name}`}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-3">
                      {plan.id === 'free' ? 'Sempre gratuito.' : 'Cancele quando quiser.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 bg-white rounded-xl shadow-sm p-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <HelpCircle className="w-6 h-6 text-99blue flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Como funcionam as conexões?</h3>
                <p className="text-gray-600 mb-4">
                  Cada proposta enviada consome 1 conexão. As conexões são renovadas mensalmente de acordo com seu plano.
                  Você também pode comprar pacotes de conexões avulsas se precisar de mais.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="font-bold text-gray-900 block mb-1">Básico</span>
                    10 conexões/mês
                  </div>
                  <div className="p-3 bg-blue-50 rounded border border-blue-100">
                    <span className="font-bold text-blue-900 block mb-1">Profissional</span>
                    80 conexões/mês
                  </div>
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-100">
                    <span className="font-bold text-yellow-900 block mb-1">Premium</span>
                    240 conexões/mês
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

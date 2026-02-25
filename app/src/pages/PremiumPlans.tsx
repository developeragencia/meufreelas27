import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/PaymentModal';
import { 
  Check, 
  Zap, 
  Crown, 
  Star, 
  TrendingUp, 
  Clock, 
  Briefcase, 
  Users,
  Shield,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: any;
  color: string;
  features: {
    connections: number;
    paymentDays: number;
    fee: string;
    areas: number;
    skills: number;
    portfolio: number;
    promotedProposals: number;
    followClients: number;
  };
  benefits: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Básico',
    price: 0,
    period: 'Grátis',
    description: 'Para quem está começando',
    icon: Star,
    color: 'gray',
    features: {
      connections: 10,
      paymentDays: 10,
      fee: '20%',
      areas: 5,
      skills: 10,
      portfolio: 3,
      promotedProposals: 0,
      followClients: 0
    },
    benefits: [
      'Envio de propostas',
      'Perfil público',
      'Notificações por email',
      'Suporte básico'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49.90,
    period: '/mês',
    description: 'Para freelancers sérios',
    icon: Zap,
    color: 'blue',
    highlighted: true,
    features: {
      connections: 120,
      paymentDays: 7,
      fee: '15%',
      areas: 20,
      skills: 30,
      portfolio: 12,
      promotedProposals: 2,
      followClients: 3
    },
    benefits: [
      'Tudo do Básico +',
      'Propostas promovidas (2/mês)',
      'Destaque nas pesquisas',
      'Ícone Pro no perfil',
      'Valor médio das propostas',
      'Email de novos projetos',
      'Projetos exclusivos',
      'Suporte prioritário'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 89.90,
    period: '/mês',
    description: 'Máximo destaque',
    icon: Crown,
    color: 'purple',
    features: {
      connections: 240,
      paymentDays: 3,
      fee: '10%',
      areas: 30,
      skills: 50,
      portfolio: 15,
      promotedProposals: 5,
      followClients: 10
    },
    benefits: [
      'Tudo do Pro +',
      'Propostas promovidas (5/mês)',
      'Prioridade máxima nas buscas',
      'Ícone Premium no perfil',
      'Recebimento em 3 dias',
      'Menor taxa de intermediação',
      'Análise de concorrência',
      'Suporte VIP'
    ]
  }
];

export default function PremiumPlans() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const getDiscountedPrice = (basePrice: number) => {
    if (billingCycle === 'quarterly') return basePrice * 0.90;
    if (billingCycle === 'yearly') return basePrice * 0.75;
    return basePrice;
  };

  const handleFreePlanActivation = (plan: Plan) => {
    const updatedData: Partial<User> = {
      plan: 'free',
      connections: plan.features.connections,
      isPremium: false,
      isPro: false,
    };

    if (updateUser) updateUser(updatedData);
    
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

    alert(`Plano ${plan.name} ativado com sucesso!`);
    navigate('/freelancer/dashboard');
  };

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      navigate('/register?type=freelancer');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (plan.price === 0) {
      handleFreePlanActivation(plan);
      return;
    }

    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleSuccess = () => {
    if (selectedPlanData) {
      const updatedData: Partial<User> = {
        plan: selectedPlanData.id as 'free' | 'pro' | 'premium',
        connections: (user?.connections || 0) + selectedPlanData.features.connections,
        isPremium: selectedPlanData.id === 'premium',
        isPro: selectedPlanData.id === 'pro' || selectedPlanData.id === 'premium',
      };

      if (updateUser) updateUser(updatedData);

      
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

      alert(`Parabéns! Você assinou o plano ${selectedPlanData.name} com sucesso.`);
    }
    setShowPaymentModal(false);
    navigate('/freelancer/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Payment Modal */}
      {selectedPlanData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={{
            ...selectedPlanData,
            price: getDiscountedPrice(selectedPlanData.price).toFixed(2).replace('.', ',')
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-2xl font-bold text-gray-900">meu</span>
              <span className="text-2xl font-light text-gray-900">freelas</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/projects" className="text-gray-500 hover:text-99blue transition-colors">Projetos</a>
              <a href="/freelancers" className="text-gray-500 hover:text-99blue transition-colors">Freelancers</a>
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate(user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard')}
                  className="text-99blue font-medium hover:text-blue-700"
                >
                  Meu Painel
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-gray-900">
                    Entrar
                  </button>
                  <button 
                    onClick={() => navigate('/register')} 
                    className="bg-99blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cadastre-se
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-99dark overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-99blue/20 to-purple-600/20 mix-blend-multiply" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-99blue/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Acelere sua carreira freelance
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10">
            Escolha o plano ideal para conseguir mais projetos, taxas menores e ferramentas exclusivas.
          </p>
          
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-white/10">
            <Shield className="w-4 h-4 mr-2 text-green-400" />
            Garantia de satisfação ou seu dinheiro de volta em 7 dias
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-10">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-100 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'monthly' 
                  ? 'bg-99blue text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${
                billingCycle === 'quarterly' 
                  ? 'bg-99blue text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Trimestral
              <span className="ml-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                -10%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center ${
                billingCycle === 'yearly' 
                  ? 'bg-99blue text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const discountedPrice = getDiscountedPrice(plan.price);
            const isPopular = plan.highlighted;

            return (
              <div 
                key={plan.id}
                className={`relative flex flex-col bg-white rounded-2xl transition-all duration-300 ${
                  isPopular 
                    ? 'shadow-2xl ring-2 ring-99blue scale-105 md:-mt-4 z-10' 
                    : 'shadow-lg hover:shadow-xl border border-gray-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-99blue text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-xl ${
                      plan.id === 'free' ? 'bg-gray-100 text-gray-600' :
                      plan.id === 'pro' ? 'bg-blue-50 text-99blue' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-gray-500 text-lg mr-1">R$</span>
                      <span className="text-5xl font-extrabold text-gray-900">
                        {plan.price === 0 ? '0' : discountedPrice.toFixed(2)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500 ml-2">
                          {billingCycle === 'monthly' ? '/mês' : 
                           billingCycle === 'quarterly' ? '/trimestre' : '/ano'}
                        </span>
                      )}
                    </div>
                    {plan.price > 0 && billingCycle !== 'monthly' && (
                      <p className="text-sm text-green-600 font-medium mt-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Economia de R$ {((plan.price - discountedPrice) * (billingCycle === 'quarterly' ? 3 : 12)).toFixed(2)}
                      </p>
                    )}
                    <p className="text-gray-500 mt-4 text-sm leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className={`mt-1 mr-3 flex-shrink-0 rounded-full p-0.5 ${
                          plan.id === 'free' ? 'bg-gray-100 text-gray-400' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-gray-600 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-200 shadow-md hover:shadow-lg ${
                      plan.id === 'free'
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : plan.id === 'pro'
                        ? 'bg-99blue text-white hover:bg-blue-700'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    }`}
                  >
                    {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    {plan.price === 0 ? 'Sempre gratuito' : 'Renovação automática. Cancele quando quiser.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-24">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Compare todos os recursos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider w-1/4">Recurso</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-gray-900 w-1/4">Básico</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-99blue w-1/4 bg-blue-50/30">Pro</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-purple-600 w-1/4">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Conexões mensais</td>
                  <td className="px-8 py-5 text-center text-gray-600">10</td>
                  <td className="px-8 py-5 text-center font-bold text-99blue bg-blue-50/30">120</td>
                  <td className="px-8 py-5 text-center font-bold text-purple-600">240</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Prazo de recebimento</td>
                  <td className="px-8 py-5 text-center text-gray-600">10 dias</td>
                  <td className="px-8 py-5 text-center font-bold text-99blue bg-blue-50/30">7 dias</td>
                  <td className="px-8 py-5 text-center font-bold text-purple-600">3 dias</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Taxa de serviço</td>
                  <td className="px-8 py-5 text-center text-gray-600">20%</td>
                  <td className="px-8 py-5 text-center font-bold text-green-600 bg-blue-50/30">15%</td>
                  <td className="px-8 py-5 text-center font-bold text-green-600">10%</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Áreas de atuação</td>
                  <td className="px-8 py-5 text-center text-gray-600">5</td>
                  <td className="px-8 py-5 text-center font-bold text-99blue bg-blue-50/30">20</td>
                  <td className="px-8 py-5 text-center font-bold text-purple-600">30</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Destaque nas buscas</td>
                  <td className="px-8 py-5 text-center text-gray-400">-</td>
                  <td className="px-8 py-5 text-center bg-blue-50/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-8 py-5 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 text-gray-700 font-medium">Projetos exclusivos</td>
                  <td className="px-8 py-5 text-center text-gray-400">-</td>
                  <td className="px-8 py-5 text-center bg-blue-50/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-8 py-5 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Dúvidas Frequentes</h2>
            <p className="text-gray-500">Tudo o que você precisa saber sobre nossos planos</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: 'Posso cancelar quando quiser?', a: 'Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento e continuará com acesso até o fim do período pago.' },
              { q: 'Como funcionam as conexões?', a: 'Conexões são créditos usados para enviar propostas. Cada plano tem um limite mensal que renova automaticamente.' },
              { q: 'Posso mudar de plano depois?', a: 'Com certeza. Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através do seu painel.' },
              { q: 'Quais formas de pagamento aceitas?', a: 'Aceitamos cartão de crédito (via Stripe), Pix e Boleto (via Mercado Pago) para sua comodidade.' }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                  <HelpCircle className="w-5 h-5 text-99blue mr-3" />
                  {item.q}
                </h3>
                <p className="text-gray-600 ml-8">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2026 MeuFreelas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

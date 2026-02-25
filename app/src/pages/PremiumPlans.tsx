import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  X
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

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      navigate('/register?type=freelancer');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const getDiscountedPrice = (basePrice: number) => {
    if (billingCycle === 'quarterly') return basePrice * 0.90;
    if (billingCycle === 'yearly') return basePrice * 0.75;
    return basePrice;
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleSuccess = () => {
    if (selectedPlanData) {
      const updatedData = {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </a>
            <nav className="flex items-center space-x-6">
              <a href="/projects" className="text-gray-300 hover:text-white">Projetos</a>
              <a href="/freelancers" className="text-gray-300 hover:text-white">Freelancers</a>
              {isAuthenticated ? (
                <a href={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} 
                  className="text-gray-300 hover:text-white">
                  Dashboard
                </a>
              ) : (
                <a href="/login" className="text-gray-300 hover:text-white">Login</a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-99blue to-sky-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Invista na sua carreira freelance e aumente suas chances de sucesso
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Shield className="w-5 h-5" />
            <span>7 dias de garantia • Cancele quando quiser</span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Selector */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' ? 'bg-99blue text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'quarterly' ? 'bg-99blue text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Trimestral
              <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">-10%</span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly' ? 'bg-99blue text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Anual
              <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">-25%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const discountedPrice = getDiscountedPrice(plan.price);
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  plan.highlighted ? 'ring-2 ring-99blue ring-offset-2' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-99blue text-white text-center py-2 text-sm font-medium">
                    Mais Popular
                  </div>
                )}
                
                <div className={`p-6 ${plan.highlighted ? 'pt-14' : ''}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      plan.id === 'basic' ? 'bg-gray-100' :
                      plan.id === 'pro' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`w-8 h-8 ${
                        plan.id === 'basic' ? 'text-gray-600' :
                        plan.id === 'pro' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      {plan.price > 0 && <span className="text-gray-500 text-lg">R$</span>}
                      <span className="text-4xl font-bold text-gray-800">
                        {plan.price === 0 ? 'Grátis' : discountedPrice.toFixed(2)}
                      </span>
                    </div>
                    {plan.price > 0 && (
                      <span className="text-gray-500">
                        {billingCycle === 'monthly' ? '/mês' : 
                         billingCycle === 'quarterly' ? '/trimestre' : '/ano'}
                      </span>
                    )}
                    {plan.price > 0 && billingCycle !== 'monthly' && (
                      <p className="text-sm text-green-600 mt-1">
                        Economia de R$ {((plan.price - discountedPrice) * (billingCycle === 'quarterly' ? 3 : 12)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Conexões/mês
                      </span>
                      <span className="font-semibold">{plan.features.connections}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Recebimento
                      </span>
                      <span className="font-semibold">{plan.features.paymentDays} dias</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Taxa de intermediação
                      </span>
                      <span className="font-semibold">{plan.features.fee}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Áreas de interesse
                      </span>
                      <span className="font-semibold">{plan.features.areas}</span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2 mb-6">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          plan.id === 'basic' ? 'text-gray-400' :
                          plan.id === 'pro' ? 'text-blue-500' : 'text-purple-500'
                        }`} />
                        <span className="text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      plan.id === 'basic'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : plan.id === 'pro'
                        ? 'bg-99blue text-white hover:bg-sky-400'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    }`}
                  >
                    {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Compare os Planos
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-600 font-medium">Recurso</th>
                    <th className="px-6 py-4 text-center text-gray-600 font-medium">Básico</th>
                    <th className="px-6 py-4 text-center text-99blue font-medium bg-blue-50">Pro</th>
                    <th className="px-6 py-4 text-center text-purple-600 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Conexões mensais</td>
                    <td className="px-6 py-4 text-center">10</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">120</td>
                    <td className="px-6 py-4 text-center font-medium">240</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Prazo para receber</td>
                    <td className="px-6 py-4 text-center">10 dias úteis</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">7 dias úteis</td>
                    <td className="px-6 py-4 text-center font-medium">3 dias úteis</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Taxa de intermediação</td>
                    <td className="px-6 py-4 text-center">20%</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium text-green-600">15%</td>
                    <td className="px-6 py-4 text-center font-medium text-green-600">10%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Áreas de interesse</td>
                    <td className="px-6 py-4 text-center">5</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">20</td>
                    <td className="px-6 py-4 text-center font-medium">30</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Habilidades</td>
                    <td className="px-6 py-4 text-center">10</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">30</td>
                    <td className="px-6 py-4 text-center font-medium">50</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Trabalhos no portfólio</td>
                    <td className="px-6 py-4 text-center">3</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">12</td>
                    <td className="px-6 py-4 text-center font-medium">15</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Propostas promovidas/mês</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">2</td>
                    <td className="px-6 py-4 text-center font-medium">5</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Clientes para seguir</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50 font-medium">3</td>
                    <td className="px-6 py-4 text-center font-medium">10</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Destaque nas pesquisas</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Projetos exclusivos</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Valor médio das propostas</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Notificação imediata de projetos</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center bg-blue-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim! Você pode cancelar sua assinatura a qualquer momento. O plano permanecerá ativo até o final do período pago.'
              },
              {
                q: 'O que são conexões?',
                a: 'Conexões são o número de propostas que você pode enviar por mês. Cada proposta enviada consome uma conexão.'
              },
              {
                q: 'Como funciona a taxa de intermediação?',
                a: 'A taxa é calculada sobre o valor final do projeto e é paga pelo cliente. Quanto menor a taxa, mais competitivo é o seu preço.'
              },
              {
                q: 'Posso mudar de plano?',
                a: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A mudança entra em vigor imediatamente.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

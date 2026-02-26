import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Check, 
  Zap, 
  Crown, 
  Star, 
  ArrowRight,
  HelpCircle,
  Loader2,
  AlertCircle
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
      areas: 50,
      skills: 100,
      portfolio: 30,
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
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAdjustedPrice = (price: number) => {
    if (billingCycle === 'yearly') {
      return (price * 0.8).toFixed(2); // 20% discount
    }
    return price.toFixed(2);
  };

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free') {
      navigate('/dashboard');
      return;
    }
    
    if (!user) {
      navigate('/login?redirect=/plans');
      return;
    }

    setLoadingPlanId(plan.id);
    setError(null);

    let apiUrl = '';
    try {
      // Determine API URL with robust fallback
      apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl || apiUrl === '/') {
          if (window.location.hostname === 'localhost') {
            apiUrl = 'http://localhost:8000/api';
          } else {
            // Force HTTPS absolute URL in production
            apiUrl = window.location.origin + '/api';
          }
      }
      
      // Debug Alert to see what URL is being called
      console.log('Calling API at:', apiUrl);
      
      const token = localStorage.getItem('token');
      const targetUrl = `${apiUrl}/checkout_v2.php`;
      
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan.id,
          price: parseFloat(getAdjustedPrice(plan.price)),
          title: `Plano ${plan.name}`,
          cycle: billingCycle === 'yearly' ? 'year' : 'month'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }

      if (data.url) {
        // Redirect to Stripe Checkout Page
        window.location.href = data.url;
      } else {
        throw new Error('URL de redirecionamento não recebida.');
      }

    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Erro de conexão.';
      
      // More detailed error for debugging
      if (msg.includes('Endpoint')) {
         msg += `\nTentou acessar: ${apiUrl}/checkout_v2.php`;
      }
      
      setError(msg);
      alert('Erro ao iniciar assinatura:\n' + msg); 
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Aumente suas chances de sucesso
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Planos exclusivos para freelancers que querem se destacar e conquistar mais projetos.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Mensal</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-99blue focus:ring-offset-2 bg-gray-200"
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5 bg-99blue' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Anual <span className="text-green-500 text-xs font-bold">(Economize 20%)</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl p-8 flex flex-col transition-all hover:scale-105 ${
                plan.highlighted ? 'border-2 border-99blue ring-4 ring-blue-50' : 'border border-gray-100'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 bg-99blue text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-${plan.color}-50`}>
                  <plan.icon className={`w-8 h-8 text-${plan.color === 'gray' ? 'gray-400' : plan.color === 'blue' ? '99blue' : 'purple-600'}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">R$ {getAdjustedPrice(plan.price)}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-green-500 text-xs font-bold mt-1">Cobrado anualmente</p>
                )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Recursos</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Conexões</p>
                      <p className="text-lg font-bold text-gray-900">{plan.features.connections}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Taxa</p>
                      <p className="text-lg font-bold text-gray-900">{plan.features.fee}</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlanId === plan.id || (plan.price === 0 && plan.id !== 'free')}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  plan.id === 'free'
                    ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    : 'bg-99blue text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                } ${loadingPlanId === plan.id ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loadingPlanId === plan.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    {plan.id === 'free' ? 'Plano Atual' : 'Assinar Agora'}
                    {plan.id !== 'free' && <ArrowRight className="w-5 h-5" />}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Table (Simplified like 99Freelas) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="px-8 py-6 bg-gray-900">
            <h2 className="text-2xl font-bold text-white">Compare todos os recursos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Recurso</th>
                  <th className="px-8 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Básico</th>
                  <th className="px-8 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Pro</th>
                  <th className="px-8 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Conexões por mês', free: '10', pro: '120', premium: '240' },
                  { name: 'Taxa de intermediação', free: '20%', pro: '15%', premium: '10%' },
                  { name: 'Recebimento do pagamento', free: '10 dias', pro: '7 dias', premium: '3 dias' },
                  { name: 'Portfólio (itens)', free: '3', pro: '12', premium: '30' },
                  { name: 'Propostas promovidas', free: '-', pro: '2/mês', premium: '5/mês' },
                  { name: 'Destaque nas pesquisas', free: '-', pro: 'Sim', premium: 'Máximo' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-8 py-4 text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-8 py-4 text-sm text-gray-600">{row.free}</td>
                    <td className="px-8 py-4 text-sm text-99blue font-bold">{row.pro}</td>
                    <td className="px-8 py-4 text-sm text-purple-600 font-bold">{row.premium}</td>
                  </tr>
                ))}
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
              { q: 'Quais formas de pagamento aceitas?', a: 'Aceitamos cartão de crédito via Stripe para sua comodidade e segurança.' }
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

      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2026 MeuFreelas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

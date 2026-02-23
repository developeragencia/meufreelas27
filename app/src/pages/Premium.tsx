import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasApi, apiCreateSubscriptionCheckout } from '../lib/api';
import BrandLogo from '../components/BrandLogo';
import { 
  Crown, Check, Zap, TrendingUp, Shield, MessageCircle,
  Clock, Award, Users, Sparkles,
  ThumbsUp, Percent, X, CreditCard, Loader2
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  color: string;
}

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

export default function Premium() {
  const navigate = useNavigate();
  const { isAuthenticated, user, switchAccountType } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<'stripe' | 'mercadopago' | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      period: 'para sempre',
      description: 'Ideal para quem está começando',
      color: 'gray',
      features: [
        '15 propostas por mês',
        'Perfil básico',
        'Suporte por email',
        'Taxa de serviço: 10%',
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingPeriod === 'monthly' ? 49 : 39,
      period: billingPeriod === 'monthly' ? '/mês' : '/mês (anual)',
      description: 'Para freelancers que querem mais',
      highlighted: true,
      badge: 'Mais Popular',
      color: '99blue',
      features: [
        'Propostas ilimitadas',
        'Perfil destacado',
        'Badge Pro',
        'Suporte prioritário',
        'Taxa de serviço: 7%',
        'Relatórios avançados',
        'Prioridade nas buscas',
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingPeriod === 'monthly' ? 99 : 79,
      period: billingPeriod === 'monthly' ? '/mês' : '/mês (anual)',
      description: 'Máximo destaque e vantagens',
      badge: 'Melhor Valor',
      color: 'yellow',
      features: [
        'Tudo do Pro',
        'Perfil em destaque máximo',
        'Badge Premium Dourado',
        'Suporte VIP 24/7',
        'Taxa de serviço: 5%',
        'Análise de concorrência',
        'Convites exclusivos',
        'Descontos em parceiros',
      ]
    }
  ];

  const features: Feature[] = [
    {
      icon: TrendingUp,
      title: 'Mais Visibilidade',
      description: 'Apareça nas primeiras posições nas buscas de freelancers e receba mais convites para projetos.'
    },
    {
      icon: Zap,
      title: 'Propostas Ilimitadas',
      description: 'Envie quantas propostas quiser sem limitações mensais. Aumente suas chances de ser contratado.'
    },
    {
      icon: Percent,
      title: 'Menor Taxa de Serviço',
      description: 'Pague menos taxa em cada projeto. Quanto maior seu plano, mais você ganha em cada trabalho.'
    },
    {
      icon: Shield,
      title: 'Badge de Verificação',
      description: 'Ganhe badges exclusivos que mostram sua credibilidade e aumentam a confiança dos clientes.'
    },
    {
      icon: MessageCircle,
      title: 'Suporte Prioritário',
      description: 'Tenha acesso a atendimento prioritário ou VIP para resolver suas dúvidas mais rápido.'
    },
    {
      icon: Award,
      title: 'Recursos Exclusivos',
      description: 'Acesse relatórios avançados, análise de concorrência e outras ferramentas exclusivas.'
    }
  ];

  const testimonials = [
    {
      name: 'Ana Carolina',
      role: 'Designer UI/UX',
      plan: 'Premium',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      quote: 'Depois de assinar o Premium, minha visibilidade aumentou 300%. Recebo muito mais convites para projetos.',
      results: '3x mais projetos'
    },
    {
      name: 'Pedro Santos',
      role: 'Desenvolvedor Full Stack',
      plan: 'Pro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      quote: 'O plano Pro vale cada centavo. As propostas ilimitadas me permitem concorrer a mais projetos.',
      results: '2x mais propostas'
    },
    {
      name: 'Mariana Costa',
      role: 'Redatora',
      plan: 'Pro',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      quote: 'Em apenas 2 meses já tinha recuperado o investimento do plano com a redução da taxa de serviço.',
      results: 'ROI em 2 meses'
    }
  ];

  const faqs = [
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso aos benefícios continua até o final do período pago.'
    },
    {
      question: 'Como funciona a taxa de serviço reduzida?',
      answer: 'A taxa de serviço é descontada automaticamente de cada pagamento recebido. No plano Pro é 7%, no Premium é 5%, contra 10% no gratuito.'
    },
    {
      question: 'Posso mudar de plano?',
      answer: 'Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A mudança entra em vigor imediatamente.'
    },
    {
      question: 'O que acontece se eu exceder 15 propostas no plano gratuito?',
      answer: 'No plano gratuito, você pode enviar até 15 propostas por mês. Após atingir esse limite, precisará esperar o próximo mês ou fazer upgrade.'
    }
  ];

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (planId === 'free') {
      navigate('/freelancer/dashboard');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePaymentProvider = async (provider: 'stripe' | 'mercadopago') => {
    if (!user?.id || selectedPlan !== 'pro' && selectedPlan !== 'premium') return;
    setCheckoutError('');
    setCheckoutLoading(provider);
    const res = await apiCreateSubscriptionCheckout({
      userId: user.id,
      planCode: selectedPlan as 'pro' | 'premium',
      billingCycle: billingPeriod,
      provider,
      successUrl: `${window.location.origin}/premium?subscription=success`,
      cancelUrl: `${window.location.origin}/premium?subscription=cancel`,
    });
    setCheckoutLoading(null);
    if (res.ok && res.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }
    setCheckoutError(res.error || 'Não foi possível abrir o checkout. Tente novamente.');
  };

  if (isAuthenticated && user?.type !== 'freelancer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 text-yellow-700">
            <Crown className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assinatura para freelancers</h1>
          <p className="text-gray-600 mb-6">
            O plano Premium e Pro estao disponiveis somente para perfis freelancer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user?.hasFreelancerAccount ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await switchAccountType();
                  if (ok) navigate('/premium');
                }}
                className="px-5 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium"
              >
                Alternar para Freelancer
              </button>
            ) : (
              <Link
                to="/freelancer/dashboard"
                className="px-5 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium"
              >
                Ir para painel freelancer
              </Link>
            )}
            <Link to="/dashboard" className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Voltar ao painel cliente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <BrandLogo to="/" darkBg />
            <nav className="flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white">Projetos</Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white">Freelancers</Link>
              {isAuthenticated ? (
                <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">Dashboard</Link>
              ) : (
                <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-99blue via-99blue-light to-99blue-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm">Destaque-se entre os freelancers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Seja um Freelancer <span className="text-yellow-300">Premium</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Aumente sua visibilidade, envie propostas ilimitadas e pague menos taxa em cada projeto. 
            Milhares de freelancers já estão crescendo com nossos planos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center px-4 py-2 bg-white/10 rounded-lg">
              <Users className="w-5 h-5 mr-2" />
              <span>+10.000 assinantes</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white/10 rounded-lg">
              <ThumbsUp className="w-5 h-5 mr-2" />
              <span>98% recomendam</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white/10 rounded-lg">
              <Clock className="w-5 h-5 mr-2" />
              <span>Cancelamento fácil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Anual
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                -20%
              </span>
            </button>
          </div>
          {billingPeriod === 'yearly' && (
            <p className="text-green-600 text-sm mt-3">
              Economize 20% ao pagar anualmente!
            </p>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                    plan.highlighted ? 'ring-2 ring-99blue md:scale-105' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute top-0 left-0 right-0 py-2 text-center text-sm font-medium ${
                      plan.id === 'premium' 
                        ? 'bg-yellow-400 text-yellow-900' 
                        : 'bg-99blue text-white'
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className={`p-8 ${plan.badge ? 'pt-14' : ''}`}>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-500 text-sm">{plan.description}</p>
                    </div>
                    
                    <div className="text-center mb-8">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">
                          R$ {plan.price}
                        </span>
                        <span className="text-gray-500 ml-1">{plan.period}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full py-3 rounded-lg font-medium transition-colors mb-8 ${
                        plan.id === 'free'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : plan.id === 'premium'
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-99blue text-white hover:bg-99blue-light'
                      }`}
                    >
                      {plan.id === 'free' ? 'Começar Grátis' : 'Assinar Agora'}
                    </button>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${
                            plan.id === 'premium' ? 'text-yellow-500' : 'text-green-500'
                          }`} />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que ser Premium?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubra como nossos planos pagos podem impulsionar sua carreira freelancer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-99blue/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-99blue" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare os Planos
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-gray-600 font-medium">Recurso</th>
                  <th className="px-6 py-4 text-center text-gray-600 font-medium">Gratuito</th>
                  <th className="px-6 py-4 text-center text-99blue font-medium">Pro</th>
                  <th className="px-6 py-4 text-center text-yellow-600 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Propostas por mês', free: '15', pro: 'Ilimitado', premium: 'Ilimitado' },
                  { feature: 'Taxa de serviço', free: '10%', pro: '7%', premium: '5%' },
                  { feature: 'Perfil destacado', free: '—', pro: <Check className="w-5 h-5 text-green-500 mx-auto" />, premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                  { feature: 'Badge exclusivo', free: '—', pro: <Check className="w-5 h-5 text-green-500 mx-auto" />, premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                  { feature: 'Suporte prioritário', free: '—', pro: <Check className="w-5 h-5 text-green-500 mx-auto" />, premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                  { feature: 'Suporte VIP 24/7', free: '—', pro: '—', premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                  { feature: 'Relatórios avançados', free: '—', pro: <Check className="w-5 h-5 text-green-500 mx-auto" />, premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                  { feature: 'Análise de concorrência', free: '—', pro: '—', premium: <Check className="w-5 h-5 text-green-500 mx-auto" /> },
                ].map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="px-6 py-4 text-gray-700">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{row.free}</td>
                    <td className="px-6 py-4 text-center">{row.pro}</td>
                    <td className="px-6 py-4 text-center">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              O que dizem nossos assinantes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  <Crown className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 font-medium">Plano {testimonial.plan}</span>
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {testimonial.results}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-99blue">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para impulsionar sua carreira?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Junte-se a milhares de freelancers que já estão crescendo com nossos planos Premium
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSubscribe('pro')}
              className="px-8 py-4 bg-white text-99blue rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Começar com Pro
            </button>
            <Link
              to="/freelancers"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ver Freelancers Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-99dark text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <BrandLogo to="/" className="mb-4 md:mb-0" darkBg />
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/termos" className="hover:text-white">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
              <Link to="/ajuda" className="hover:text-white">Ajuda</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal - Stripe e Mercado Pago */}
      {showPaymentModal && selectedPlan && selectedPlan !== 'free' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 my-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Finalizar Assinatura</h3>
              <button
                onClick={() => { setShowPaymentModal(false); setCheckoutError(''); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={!!checkoutLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Plano</span>
                <span className="font-semibold capitalize">{selectedPlan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Período</span>
                <span className="font-semibold capitalize">{billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}</span>
              </div>
              <div className="border-t mt-3 pt-3 flex items-center justify-between">
                <span className="text-gray-900 font-medium">Total</span>
                <span className="text-2xl font-bold text-99blue">
                  R$ {plans.find(p => p.id === selectedPlan)?.price}
                  <span className="text-sm text-gray-500 font-normal">/{billingPeriod === 'monthly' ? 'mês' : 'mês'}</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">Escolha a forma de pagamento. Você será redirecionado ao ambiente seguro do provedor.</p>

            {hasApi() ? (
              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentProvider('stripe')}
                  disabled={!!checkoutLoading}
                  className="w-full py-3 px-4 bg-[#635bff] hover:bg-[#5851ea] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {checkoutLoading === 'stripe' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Pagar com Stripe (cartão)
                </button>
                <button
                  onClick={() => handlePaymentProvider('mercadopago')}
                  disabled={!!checkoutLoading}
                  className="w-full py-3 px-4 bg-[#009ee3] hover:bg-[#0088c7] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {checkoutLoading === 'mercadopago' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Pagar com Mercado Pago (PIX ou cartão)
                </button>
              </div>
            ) : (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                Pagamentos por Stripe e Mercado Pago estão disponíveis quando a API estiver configurada.
              </p>
            )}

            {checkoutError && (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{checkoutError}</p>
                <p className="text-xs text-gray-500">Configure as chaves no servidor (api/.env): STRIPE_SECRET_KEY e MERCADOPAGO_ACCESS_TOKEN.</p>
              </div>
            )}

            <p className="text-center text-xs text-gray-500 mt-4">
              Pagamento seguro. Stripe e Mercado Pago processam com criptografia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

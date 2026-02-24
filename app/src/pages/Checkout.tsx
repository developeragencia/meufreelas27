import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Lock, Check, CreditCard, Shield, Info } from 'lucide-react';
import { apiCreateCheckout, apiListProposals, hasApi } from '../lib/api';

export default function Checkout() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [proposal, setProposal] = useState<{
    id: string;
    value: string;
    deliveryDays: string;
    message: string;
    freelancerName: string;
    freelancerAvatar?: string;
    projectTitle: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get('payment');
    if (paymentStatus === 'success') {
      setStep('success');
    }
    if (paymentStatus === 'cancel') {
      setErrorMessage('Pagamento cancelado. Você pode tentar novamente.');
      setStep('payment');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      if (!proposalId || !hasApi()) {
        setErrorMessage('API não configurada.');
        setLoading(false);
        return;
      }
      const res = await apiListProposals({ clientId: user.id });
      if (!res.ok) {
        setErrorMessage(res.error || 'Falha ao carregar proposta.');
        setLoading(false);
        return;
      }
      const found = (res.proposals || []).find((p) => p.id === proposalId);
      if (!found) {
        setErrorMessage('Proposta não encontrada para este cliente.');
        setLoading(false);
        return;
      }
      setProposal({
        id: found.id,
        value: found.value,
        deliveryDays: found.deliveryDays,
        message: found.message,
        freelancerName: found.freelancerName,
        freelancerAvatar: found.freelancerAvatar,
        projectTitle: found.projectTitle,
      });
      setLoading(false);
    };
    load();
  }, [proposalId, isAuthenticated, navigate, user?.id]);

  const parseCurrency = (raw: string): number => {
    const normalized = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handlePayment = async () => {
    if (!proposal || !proposalId || !user?.id) return;
    setIsProcessing(true);
    setErrorMessage('');
    const provider = paymentMethod === 'pix' ? 'mercadopago' : 'stripe';
    const successUrl = `${window.location.origin}/checkout/${proposalId}?payment=success`;
    const cancelUrl = `${window.location.origin}/checkout/${proposalId}?payment=cancel`;
    const res = await apiCreateCheckout({
      proposalId,
      clientId: user.id,
      provider,
      successUrl,
      cancelUrl,
      amount: total,
      title: `Pagamento do projeto: ${proposal.projectTitle}`,
    });
    setIsProcessing(false);
    if (!res.ok || !res.checkoutUrl) {
      setErrorMessage(res.error || 'Não foi possível iniciar pagamento.');
      return;
    }
    window.location.href = res.checkoutUrl;
  };

  const proposalAmount = proposal ? parseCurrency(proposal.value) : 0;
  const platformFee = proposalAmount * 0.1;
  const total = proposalAmount + platformFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-99blue/30 border-t-99blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">{errorMessage || 'Proposta não encontrada'}</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Garantido!</h2>
          <p className="text-gray-600 mb-6">
            O valor de R$ {proposalAmount.toFixed(2)} esta protegido pela plataforma.
            O freelancer sera notificado para iniciar o trabalho.
          </p>
          <Link
            to="/my-projects"
            className="inline-block px-6 py-3 bg-99blue text-white rounded-lg font-medium hover:bg-99blue-light transition-colors"
          >
            Ver Meus Projetos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step === 'review' ? 'text-99blue' : 'text-green-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === 'review' ? 'bg-99blue text-white' : 'bg-green-500 text-white'}`}>
              <Check className="w-4 h-4" />
            </div>
            <span className="font-medium">Revisar</span>
          </div>
          <div className="w-16 h-1 bg-gray-200 mx-4">
            <div className={`h-full ${step === 'payment' ? 'bg-99blue' : 'bg-gray-200'}`} />
          </div>
          <div className={`flex items-center ${step === 'payment' ? 'text-99blue' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === 'payment' ? 'bg-99blue text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="font-medium">Pagamento</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 'review' ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Revisar e Confirmar</h2>
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="w-12 h-12 rounded-full mr-4 bg-99blue text-white flex items-center justify-center overflow-hidden">
                    {proposal.freelancerAvatar ? (
                      <img src={proposal.freelancerAvatar} alt={proposal.freelancerName} className="w-full h-full object-cover" />
                    ) : (
                      proposal.freelancerName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{proposal.freelancerName}</p>
                    <p className="text-sm text-gray-500">Freelancer selecionado</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">{proposal.projectTitle}</h3>
                  <p className="text-sm text-gray-600">{proposal.message}</p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Valor da proposta</span>
                    <span className="font-medium">R$ {proposalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Taxa da plataforma (10%)</span>
                    <span className="text-gray-500">R$ {platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-4 border-t">
                    <span>Total a pagar</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Garantia de Pagamento</p>
                    <p className="text-sm text-green-700">
                      Seu pagamento fica protegido pela plataforma ate a conclusao do projeto. 
                      Voce so libera o pagamento quando estiver satisfeito com o resultado.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full mt-6 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Prosseguir para Pagamento
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Forma de Pagamento</h2>

                <div className="space-y-4 mb-6">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'border-99blue bg-99blue/5' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={paymentMethod === 'pix'}
                      onChange={() => setPaymentMethod('pix')}
                      className="w-4 h-4 text-99blue"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">Pix</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">PIX</p>
                          <p className="text-sm text-gray-500">Pagamento instantaneo</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-99blue bg-99blue/5' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4 text-99blue"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <CreditCard className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Cartao de Credito</p>
                          <p className="text-sm text-gray-500">Parcelado em ate 12x</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'pix' && (
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-700 font-medium mb-1">Pagamento via Mercado Pago (PIX)</p>
                    <p className="text-sm text-gray-500">Ao clicar em pagar, você será redirecionado para concluir no checkout seguro.</p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-700 font-medium mb-1">Pagamento via Stripe (Cartão)</p>
                    <p className="text-sm text-gray-500">Ao clicar em pagar, você será redirecionado para concluir no checkout seguro.</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setStep('review')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Pagar R$ {total.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumo</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Projeto</span>
                  <span className="text-gray-900 text-right max-w-[150px] truncate">{proposal.projectTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Freelancer</span>
                  <span className="text-gray-900">{proposal.freelancerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prazo</span>
                  <span className="text-gray-900">{proposal.deliveryDays}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Valor</span>
                    <span>R$ {proposalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Taxa</span>
                    <span>R$ {platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start">
                <Info className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  O valor so sera liberado para o freelancer apos a conclusao do projeto e sua aprovacao.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

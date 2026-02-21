import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Lock, Check, CreditCard, Shield, Info,
  QrCode
} from 'lucide-react';

interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  offer: number;
  duration: string;
  details: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
}

export default function Checkout() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const proposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    const foundProposal = proposals.find((p: any) => p.id === proposalId);
    if (foundProposal) {
      setProposal(foundProposal);
      
      const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
      const foundProject = projects.find((p: any) => p.id === foundProposal.projectId);
      if (foundProject) {
        setProject(foundProject);
      }
    }
  }, [proposalId, isAuthenticated, navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const proposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    const proposalIndex = proposals.findIndex((p: any) => p.id === proposalId);
    if (proposalIndex !== -1) {
      proposals[proposalIndex].status = 'accepted';
      proposals[proposalIndex].paymentStatus = 'guaranteed';
      proposals[proposalIndex].paymentDate = new Date().toISOString();
      localStorage.setItem('meufreelas_proposals', JSON.stringify(proposals));
    }
    
    const transactions = JSON.parse(localStorage.getItem('meufreelas_transactions') || '[]');
    transactions.push({
      id: Date.now().toString(),
      proposalId,
      projectId: project?.id,
      clientId: user?.id,
      freelancerId: proposal?.freelancerId,
      amount: proposal?.offer,
      status: 'held',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('meufreelas_transactions', JSON.stringify(transactions));
    
    setIsProcessing(false);
    setStep('success');
  };

  const platformFee = proposal ? proposal.offer * 0.10 : 0;
  const total = proposal ? proposal.offer + platformFee : 0;

  if (!proposal || !project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Proposta não encontrada</p>
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
            O valor de R$ {proposal.offer.toFixed(2)} esta protegido pela plataforma. 
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
      <header className="bg-99blue text-white">
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
                  <img
                    src={proposal.freelancerAvatar}
                    alt={proposal.freelancerName}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{proposal.freelancerName}</p>
                    <p className="text-sm text-gray-500">Freelancer selecionado</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600">{proposal.details}</p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Valor da proposta</span>
                    <span className="font-medium">R$ {proposal.offer.toFixed(2)}</span>
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
                    <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <QrCode className="w-32 h-32 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">Escaneie o QR Code com seu app bancario</p>
                    <p className="text-sm text-gray-500">ou copie o codigo PIX abaixo</p>
                    <button className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                      Copiar codigo PIX
                    </button>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Numero do cartao</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome no cartao</label>
                      <input
                        type="text"
                        placeholder="NOME COMO ESTA NO CARTAO"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      />
                    </div>
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
                  <span className="text-gray-900 text-right max-w-[150px] truncate">{project.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Freelancer</span>
                  <span className="text-gray-900">{proposal.freelancerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prazo</span>
                  <span className="text-gray-900">{proposal.duration}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Valor</span>
                    <span>R$ {proposal.offer.toFixed(2)}</span>
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

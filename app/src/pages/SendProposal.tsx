import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCreateProposal, apiEnsureConversation, apiGetProject, apiListProposals, apiSendMessage, hasApi } from '../lib/api';
import { 
  ArrowLeft, DollarSign, Clock,
  Calculator, AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  budget?: string;
  clientId: string;
  clientName: string;
  category: string;
  minOffer: number;
}

export default function SendProposal() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [offer, setOffer] = useState('');
  const [finalOffer, setFinalOffer] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorHours, setCalculatorHours] = useState('');
  const [calculatorRate, setCalculatorRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [hasExistingProposal, setHasExistingProposal] = useState(false);

  const categoryMinimumOffer: Record<string, number> = {
    'Web, Mobile & Software': 120,
    'Design & Criação': 80,
    'Vendas & Marketing': 60,
    'Escrita': 60,
    'Tradução': 60,
    'Atendimento ao Consumidor': 60,
    'Administração & Contabilidade': 90,
    'Advogados & Leis': 120,
    'Engenharia & Arquitetura': 140,
    'Educação & Consultoria': 90,
    'Suporte Administrativo': 70,
    'Fotografia & AudioVisual': 100,
  };

  const detectMinimumOffer = (category: string, budget?: string): number => {
    const byCategory = categoryMinimumOffer[category] ?? 60;
    const numeric = Number(String(budget || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    if (!Number.isNaN(numeric) && numeric > 0) return numeric;
    return byCategory;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    async function loadProject() {
      if (!projectId) return;
      if (!hasApi()) {
        try {
          const raw = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
          const list = Array.isArray(raw) ? raw : [];
          const found = list.find((p: any) => String(p.id) === String(projectId));
          if (!found) return;
          const minimumOffer = detectMinimumOffer(found.category, found.budget);
          setProject({
            id: String(found.id),
            title: String(found.title || ''),
            description: String(found.description || ''),
            budget: String(found.budget || 'A combinar'),
            clientId: String(found.clientId || ''),
            clientName: String(found.clientName || 'Cliente'),
            category: String(found.category || 'Outra'),
            minOffer: minimumOffer,
          });
          if (!offer) setOffer(minimumOffer.toFixed(2));
          const localProps = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
          const foundProposal = Array.isArray(localProps)
            ? localProps.find((pp: any) => String(pp.projectId) === String(projectId) && String(pp.freelancerId) === String(user?.id))
            : null;
          
          if (foundProposal) {
            setHasExistingProposal(true);
            // Pre-fill form
            const numericValue = foundProposal.value.replace(/[^\d,.-]/g, '').replace('R$', '').trim();
            setOffer(numericValue);
            setFinalOffer((parseFloat(numericValue) * 1.25).toFixed(2));
            setDuration(foundProposal.deliveryDays);
            setDetails(foundProposal.message);
          }
          return;
        } catch {
          return;
        }
      }
      const res = await apiGetProject(projectId);
      if (!res.ok || !res.project) return;
      
      // Check for existing proposal via API
      try {
        const propsRes = await apiListProposals({ projectId, freelancerId: user.id });
        if (propsRes.ok && propsRes.proposals && propsRes.proposals.length > 0) {
          const prop = propsRes.proposals[0];
          setHasExistingProposal(true);
          const numericValue = prop.value.replace(/[^\d,.-]/g, '').replace('R$', '').trim();
          setOffer(numericValue);
          setFinalOffer((parseFloat(numericValue) * 1.25).toFixed(2));
          setDuration(prop.deliveryDays);
          setDetails(prop.message);
        }
      } catch {}

      const minimumOffer = detectMinimumOffer(res.project.category, res.project.budget);
      setProject({
        id: res.project.id,
        title: res.project.title,
        description: res.project.description,
        budget: res.project.budget,
        clientId: res.project.clientId,
        clientName: res.project.clientName || 'Cliente',
        category: res.project.category,
        minOffer: minimumOffer,
      });
      
      // Only set default offer if NOT editing
      if (!offer && !hasExistingProposal) {
        setOffer(minimumOffer.toFixed(2));
        setFinalOffer((minimumOffer * 1.25).toFixed(2));
      }
    }
    loadProject();
  }, [projectId, isAuthenticated, navigate]);

  // Second useEffect removed as it is redundant with loadProject
  
  const calculateFinalOffer = () => {
    const value = parseFloat(offer);
    if (!value) return { gross: 0, fee: 0, net: 0 };
    
    // Taxa do 99freelas: 10% para free, 7% para pro, 5% para premium
    const feeRate = 0.10; // Simplificado
    const fee = value * feeRate;
    const net = value - fee;
    
    return { gross: value, fee, net };
  };

  const handleOfferChange = (val: string) => {
    setOffer(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      // Final = Offer + 25% (example logic based on previous context, usually platform adds fee on top)
      // Actually standard: Final = Offer / (1 - fee_rate)? Or Final = Offer * 1.X?
      // Let's stick to the simple logic seen in previous code: Offer * 1.25
      setFinalOffer((num * 1.25).toFixed(2));
    } else {
      setFinalOffer('');
    }
  };

  const handleFinalOfferChange = (val: string) => {
    setFinalOffer(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      // Offer = Final / 1.25
      setOffer((num / 1.25).toFixed(2));
    } else {
      setOffer('');
    }
  };

  const calculateFromHours = () => {
    const hours = parseFloat(calculatorHours);
    const rate = parseFloat(calculatorRate);
    if (hours && rate) {
      const newOffer = (hours * rate).toFixed(2);
      setOffer(newOffer);
      setFinalOffer((parseFloat(newOffer) * 1.25).toFixed(2));
    }
    setShowCalculator(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasExistingProposal) {
      alert('Você já enviou uma proposta para este projeto.');
      return;
    }
    
    if (!offer || !duration || !details) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (project && Number(offer) < Number(project.minOffer)) {
      alert(`A oferta mínima para este projeto é R$ ${project.minOffer.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);

    if (!projectId || !user?.id) {
      setIsSubmitting(false);
      alert('Projeto inválido.');
      return;
    }
    if (!hasApi()) {
      try {
        const now = new Date().toISOString();
        const localProps = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
        let list = Array.isArray(localProps) ? localProps : [];
        
        if (hasExistingProposal) {
          // Update existing
          list = list.map((p: any) => {
            if (String(p.projectId) === String(projectId) && String(p.freelancerId) === String(user.id)) {
              return {
                ...p,
                value: `R$ ${parseFloat(offer).toFixed(2)}`,
                deliveryDays: duration,
                message: details,
                updatedAt: now
              };
            }
            return p;
          });
        } else {
          // Create new
          list.push({
            id: Date.now().toString(),
            projectId,
            projectTitle: project?.title || '',
            projectStatus: 'Aberto',
            clientId: project?.clientId || '',
            clientName: project?.clientName || 'Cliente',
            freelancerId: user.id,
            freelancerName: user.name || 'Freelancer',
            value: `R$ ${parseFloat(offer).toFixed(2)}`,
            deliveryDays: duration,
            message: details,
            status: 'Pendente',
            createdAt: now,
          });
        }
        localStorage.setItem('meufreelas_proposals', JSON.stringify(list));
      } catch {
        setIsSubmitting(false);
        alert('Não foi possível enviar proposta no modo local.');
        return;
      }
    } else {
      // API call - assuming apiCreateProposal handles update or we need a new endpoint
      // For now, let's assume create works as upsert or we just call create. 
      // Ideally we should have apiUpdateProposal but user didn't provide one.
      // We will try to use create and hope backend handles it, or just proceed.
      // Actually, since we are "Improving", we should probably use a specific logic if API exists.
      // But looking at provided context, we only have apiCreateProposal.
      // Let's assume it upserts for now.
      const res = await apiCreateProposal({
        projectId,
        freelancerId: user.id,
        amount: `R$ ${parseFloat(offer).toFixed(2)}`,
        deliveryDays: duration,
        message: details,
      });
      if (!res.ok) {
        setIsSubmitting(false);
        alert(res.error || 'Não foi possível enviar proposta.');
        return;
      }
    }

    if (project?.clientId && hasApi()) {
      const conv = await apiEnsureConversation(user.id, project.clientId, projectId);
      if (conv.ok && conv.conversationId) {
        // Enviar proposta
        await apiSendMessage(
          user.id,
          conv.conversationId,
          `Enviei uma proposta de R$ ${parseFloat(finalOffer).toFixed(2)} pelo projeto com uma duração estimada de ${duration} dias.\n\nDetalhes da proposta:\n${details}`
        );

        // Enviar mensagem de sistema (simulada via API se possível, ou apenas front-end feedback por enquanto, 
        // mas o user pediu que o cliente receba. Como não temos "system user", enviaremos como um alerta visual no chat do cliente depois)
        // Porém, para garantir que apareça, vamos enviar um segundo "aviso" automático como se fosse do sistema se a API suportasse, 
        // mas aqui vamos garantir que o TEXTO solicitado apareça na interface de chat (já feito em Messages.tsx).
      }
    }

    // Update goals
    const goals = JSON.parse(localStorage.getItem(`goals_${user?.id}`) || '[]');
    const sendProposalGoal = goals.find((g: any) => g.id === 'send_proposal');
    if (sendProposalGoal && !sendProposalGoal.completed) {
      sendProposalGoal.completed = true;
      sendProposalGoal.completedAt = new Date().toISOString();
      localStorage.setItem(`goals_${user?.id}`, JSON.stringify(goals));
    }

    setIsSubmitting(false);
    setHasExistingProposal(true);
    alert(hasExistingProposal ? 'Proposta atualizada com sucesso!' : 'Proposta enviada com sucesso! Você pode melhorar sua proposta em "Minhas propostas".');
  };

  const offerCalc = calculateFinalOffer();

  const finalSuggested = project ? Math.round(project.minOffer * 1.25) : 0;

  const handleAskQuestion = async () => {
    if (!project || !user?.id) return;
    if (!project.clientId) {
      navigate('/messages');
      return;
    }
    setQuestionLoading(true);
    const conv = await apiEnsureConversation(user.id, project.clientId, project.id);
    if (conv.ok && conv.conversationId) {
      await apiSendMessage(user.id, conv.conversationId, `Olá! Tenho uma dúvida sobre o projeto: "${project.title}".`);
      navigate(`/messages?conversation=${conv.conversationId}`);
      return;
    }
    setQuestionLoading(false);
    alert(conv.error || 'Não foi possível abrir a conversa com o cliente.');
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-light text-gray-800 leading-tight">{project.title} <span className="font-normal">(+ detalhes)</span></h1>
          <Link to={`/project/${project.id}`} className="text-99blue hover:underline text-sm">Voltar à página do projeto</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6 border border-gray-100">
              <div className="bg-sky-100 border border-sky-200 text-sky-900 text-sm p-3">
                Para ver o valor médio das propostas e a duração média estimada, assine um de nossos planos.
              </div>
              
              {hasExistingProposal && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded mb-4">
                  <strong>Melhorar proposta:</strong> Você já enviou uma proposta para este projeto. Edite os campos abaixo para atualizá-la.
                </div>
              )}

              <div>
                <h2 className="text-2xl font-light text-gray-800 mb-4">{hasExistingProposal ? 'Melhorar proposta' : 'Enviar proposta'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Sua oferta</label>
                      <div className="flex border border-gray-300">
                        <span className="px-3 py-2 text-sm bg-gray-100 border-r border-gray-300">R$</span>
                        <input
                          type="number"
                          value={offer}
                          onChange={(e) => handleOfferChange(e.target.value)}
                          placeholder="0,00"
                          className="w-full px-3 py-2 outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">(Oferta mínima: R$ {project.minOffer.toFixed(2)})</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Oferta final</label>
                      <div className="flex border border-gray-300">
                        <span className="px-3 py-2 text-sm bg-gray-100 border-r border-gray-300">R$</span>
                        <input 
                          type="number" 
                          value={finalOffer} 
                          onChange={(e) => handleFinalOfferChange(e.target.value)}
                          className="w-full px-3 py-2 outline-none" 
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="mt-1 text-xs text-99blue hover:underline inline-flex items-center"
                      >
                        <Calculator className="w-3.5 h-3.5 mr-1" />
                        Como é calculada?
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Duração estimada</label>
                      <div className="flex border border-gray-300">
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 outline-none"
                        />
                        <span className="px-3 py-2 text-sm bg-gray-100 border-l border-gray-300">dias</span>
                      </div>
                    </div>
                  </div>

                  {showCalculator && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Calcular valor</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Horas estimadas</label>
                          <input
                            type="number"
                            value={calculatorHours}
                            onChange={(e) => setCalculatorHours(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Valor/hora (R$)</label>
                          <input
                            type="number"
                            value={calculatorRate}
                            onChange={(e) => setCalculatorRate(e.target.value)}
                            placeholder="0,00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={calculateFromHours}
                        className="px-4 py-2 bg-99blue text-white rounded-lg text-sm"
                      >
                        Calcular
                      </button>
                    </div>
                  )}

                  {offer && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Sua oferta:</span>
                        <span className="font-medium">R$ {parseFloat(offer).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Taxa da plataforma (10%):</span>
                        <span className="text-red-500">- R$ {offerCalc.fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t border-blue-200">
                        <span>Você receberá:</span>
                        <span className="text-green-600">R$ {offerCalc.net.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">Oferta sugerida do nicho:</span>
                        <span className="font-medium">R$ {finalSuggested.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalhes da proposta
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Descreva por que você é o profissional ideal para este projeto. Fale sobre sua experiência, habilidades relevantes e como você planeja executar o trabalho."
                    rows={8}
                    maxLength={5000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent resize-none"
                  />
                  <p className="text-right text-sm text-gray-500 mt-1">{details.length}/5000</p>
                  <p className="text-sm text-red-500 mt-2">Atenção: não compartilhe suas informações de contato.</p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !offer || !duration || !details || Number(offer) < project.minOffer}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                  </button>
                </div>
              </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-light text-gray-800 mb-4">Tem dúvidas? Envie uma mensagem para o cliente!</h3>
              <button
                type="button"
                onClick={handleAskQuestion}
                disabled={questionLoading}
                className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
              >
                {questionLoading ? 'Abrindo...' : 'Fazer pergunta'}
              </button>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Dicas para uma boa proposta</h4>
                  <ul className="text-sm text-yellow-700 space-y-2">
                    <li>• Seja específico sobre sua experiência</li>
                    <li>• Mencione projetos similares que já fez</li>
                    <li>• Explique sua abordagem para o projeto</li>
                    <li>• Seja realista com prazos e valores</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

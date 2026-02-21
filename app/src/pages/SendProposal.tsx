import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, DollarSign, Clock,
  Calculator, AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  budget?: string;
  clientName: string;
  category: string;
}

export default function SendProposal() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [offer, setOffer] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorHours, setCalculatorHours] = useState('');
  const [calculatorRate, setCalculatorRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load project
    const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const foundProject = projects.find((p: any) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [projectId, isAuthenticated, navigate]);

  const calculateFinalOffer = () => {
    const value = parseFloat(offer);
    if (!value) return { gross: 0, fee: 0, net: 0 };
    
    // Taxa do 99freelas: 10% para free, 7% para pro, 5% para premium
    const feeRate = 0.10; // Simplificado
    const fee = value * feeRate;
    const net = value - fee;
    
    return { gross: value, fee, net };
  };

  const calculateFromHours = () => {
    const hours = parseFloat(calculatorHours);
    const rate = parseFloat(calculatorRate);
    if (hours && rate) {
      setOffer((hours * rate).toFixed(2));
    }
    setShowCalculator(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offer || !duration || !details) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    // Save proposal
    const proposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    const newProposal = {
      id: Date.now().toString(),
      projectId,
      freelancerId: user?.id,
      freelancerName: user?.name,
      freelancerAvatar: user?.avatar,
      offer: parseFloat(offer),
      duration,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    proposals.push(newProposal);
    localStorage.setItem('meufreelas_proposals', JSON.stringify(proposals));

    // Update project proposals count
    const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);
    if (projectIndex !== -1) {
      projects[projectIndex].proposals = (projects[projectIndex].proposals || 0) + 1;
      localStorage.setItem('meufreelas_projects', JSON.stringify(projects));
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
    alert('Proposta enviada com sucesso!');
    navigate('/freelancer/proposals');
  };

  const offerCalc = calculateFinalOffer();

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enviar Proposta</h1>
        <p className="text-gray-500 mb-8">{project.title}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              {/* Offer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua oferta (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="mt-2 text-sm text-99blue hover:underline flex items-center"
                >
                  <Calculator className="w-4 h-4 mr-1" />
                  Usar calculadora
                </button>

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
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração estimada
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 7 dias, 2 semanas"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                  />
                </div>
              </div>

              {/* Details */}
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
              </div>

              {/* Submit */}
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
                  disabled={isSubmitting || !offer || !duration || !details}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sobre o projeto</h3>
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              {project.budget && (
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Orçamento: {project.budget}
                </div>
              )}
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

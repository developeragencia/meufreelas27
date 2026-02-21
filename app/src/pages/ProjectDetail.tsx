import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  Briefcase, 
  Calendar,
  Star,
  Flag,
  Share2,
  Menu,
  X,
  Home,
  User,
  MessageSquare,
  MapPin,
  CheckCircle,
  DollarSign,
  Heart,
  Send,
  FileText,
  Zap,
  Shield,
  Eye,
  ThumbsUp,
  ChevronRight
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  budget: string;
  budgetType?: 'fixed' | 'hourly' | 'range';
  deadline: string;
  requiredSkills: string[];
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  clientJobs: number;
  clientMemberSince: string;
  clientLocation?: string;
  proposals: number;
  interested: number;
  status: string;
  createdAt: string;
  experienceLevel: string;
  projectType?: string;
  views?: number;
  attachments?: string[];
}

interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating: number;
  text: string;
  value: string;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [proposalValue, setProposalValue] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'proposals'>('details');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const menuItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Briefcase, label: 'Projetos', href: '/projects' },
    { icon: User, label: 'Freelancers', href: '/freelancers' },
    { icon: MessageSquare, label: 'Mensagens', href: '/messages' },
  ];

  const reportReasons = [
    'Projeto falso ou enganoso',
    'Conteúdo inapropriado',
    'Violação de direitos autorais',
    'Spam',
    'Outro'
  ];

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const found = projects.find((p: Project) => p.id === id);
    
    if (found) {
      setProject(found);
    } else {
      const mockProject: Project = {
        id: id || '5',
        title: 'Desenvolvimento de DApp e aplicações Web3 (Blockchain)',
        category: 'Web, Mobile & Software',
        subcategory: 'Desenvolvimento Web',
        description: `Procuramos programador(a) Web3/DApp/Blockchain (cripto) para projeto desafiador e inovador.

**Sobre o Projeto:**
Estamos em busca de um(a) desenvolvedor(a) apaixonado(a) por tecnologia descentralizada para participar da construção de uma aplicação Web3 inovadora na área DeFi.

**O que é preciso fazer:**
• Desenvolver uma DApp funcional e responsiva
• Criar e integrar smart contracts em Solidity
• Implementar wallet connect (MetaMask, WalletConnect, Coinbase Wallet)
• Desenvolver sistema de transações e staking
• Garantir segurança, performance e escalabilidade
• Realizar testes e auditoria de segurança

**Requisitos Técnicos:**
• Experiência comprovada com Solidity e Smart Contracts
• Conhecimento avançado em Web3.js ou Ethers.js
• Familiaridade com React.js e Next.js
• Experiência com integração de wallets
• Conhecimento em protocolos DeFi
• Inglês técnico para leitura de documentação

**Diferenciais:**
• Experiência com Chainlink Oracles
• Conhecimento em Layer 2 solutions (Polygon, Arbitrum)
• Certificações em blockchain
• Portfólio de projetos Web3 publicados`,
        budget: 'R$ 5.000 - R$ 10.000',
        budgetType: 'range',
        deadline: '30 dias',
        requiredSkills: ['Solidity', 'Web3.js', 'React', 'Smart Contracts', 'Blockchain', 'Ethereum', 'DeFi', 'MetaMask'],
        clientId: 'client1',
        clientName: 'Wagner Quintana',
        clientAvatar: '',
        clientRating: 4.8,
        clientJobs: 15,
        clientMemberSince: '2022-03-15',
        clientLocation: 'São Paulo, SP',
        proposals: 10,
        interested: 17,
        status: 'Aberto',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        experienceLevel: 'Especialista',
        projectType: 'Proj único',
        views: 234,
        attachments: ['especificacao-tecnica.pdf', 'wireframes.fig']
      };
      setProject(mockProject);
    }

    const allProposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    const projectProposals = allProposals.filter((p: Proposal) => p.projectId === id);
    setProposals(projectProposals);

    const savedProjects = JSON.parse(localStorage.getItem('meufreelas_saved_projects') || '[]');
    setIsSaved(savedProjects.includes(id));
  }, [id]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const newProposal: Proposal = {
      id: Date.now().toString(),
      projectId: id || '',
      freelancerId: user?.id || '',
      freelancerName: user?.name || '',
      freelancerAvatar: user?.avatar,
      freelancerRating: 4.5,
      text: proposalText,
      value: proposalValue,
      deliveryTime: deliveryTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const allProposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    allProposals.push(newProposal);
    localStorage.setItem('meufreelas_proposals', JSON.stringify(allProposals));
    
    setProposals([...proposals, newProposal]);
    showToast('Proposta enviada com sucesso!');
    setShowProposalForm(false);
    setProposalText('');
    setProposalValue('');
    setDeliveryTime('');
  };

  const handleSaveProject = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const savedProjects = JSON.parse(localStorage.getItem('meufreelas_saved_projects') || '[]');
    if (isSaved) {
      const updated = savedProjects.filter((pid: string) => pid !== id);
      localStorage.setItem('meufreelas_saved_projects', JSON.stringify(updated));
      setIsSaved(false);
      showToast('Projeto removido dos favoritos');
    } else {
      savedProjects.push(id);
      localStorage.setItem('meufreelas_saved_projects', JSON.stringify(savedProjects));
      setIsSaved(true);
      showToast('Projeto salvo com sucesso!');
    }
  };

  const handleShare = (method: string) => {
    const url = window.location.href;
    if (method === 'copy') {
      navigator.clipboard.writeText(url);
      showToast('Link copiado para a área de transferência!');
    }
    setShowShareModal(false);
  };

  const handleReport = () => {
    if (!reportReason) return;
    
    const reports = JSON.parse(localStorage.getItem('meufreelas_reports') || '[]');
    reports.push({
      id: Date.now().toString(),
      projectId: id,
      reason: reportReason,
      reportedBy: user?.id,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('meufreelas_reports', JSON.stringify(reports));
    
    showToast('Denúncia enviada. Obrigado por nos ajudar!');
    setShowReportModal(false);
    setReportReason('');
  };

  const handleInterest = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    showToast('Você demonstrou interesse no projeto!');
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">Projeto não encontrado</p>
          <Link to="/projects" className="text-99blue hover:underline mt-2 inline-block">
            Voltar para projetos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
          <CheckCircle className="w-5 h-5 mr-2" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-99dark text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileMenu(true)} 
                className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="text-xl md:text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white transition-colors">Projetos</Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white transition-colors">Freelancers</Link>
              <Link to="/how-it-works" className="text-gray-300 hover:text-white transition-colors">Como Funciona</Link>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} 
                    className="text-gray-300 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-99blue rounded-lg hover:bg-sky-400 transition-colors font-medium">
                    Cadastre-se
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed left-0 top-0 w-72 h-full bg-white shadow-xl z-50 md:hidden">
            <div className="p-4 border-b bg-99dark flex items-center justify-between">
              <span className="text-xl font-bold text-white">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4">
              {menuItems.map((item, i) => (
                <Link 
                  key={i} 
                  to={item.href} 
                  className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors" 
                  onClick={() => setShowMobileMenu(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />{item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-99blue">Início</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/projects" className="hover:text-99blue">Projetos</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 truncate max-w-[200px]">{project.title}</span>
        </nav>

        {/* Back Button */}
        <Link to="/projects" className="inline-flex items-center text-gray-600 hover:text-99blue mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para projetos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                {/* Category & Actions */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-sky-100 text-99blue text-sm rounded-full font-medium">
                      {project.category}
                    </span>
                    {project.subcategory && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {project.subcategory}
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      project.status === 'Aberto' ? 'bg-green-100 text-green-700' :
                      project.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Compartilhar"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSaveProject}
                      className={`p-2 rounded-lg transition-colors ${
                        isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={isSaved ? 'Remover dos favoritos' : 'Salvar projeto'}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Denunciar"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-tight">
                  {project.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Publicado {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {project.views || 0} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {project.proposals} propostas
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {project.interested} interessados
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                    <p className="font-semibold text-gray-800">{project.budget}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Prazo</p>
                    <p className="font-semibold text-gray-800">{project.deadline}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Experiência</p>
                    <p className="font-semibold text-gray-800">{project.experienceLevel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                    <p className="font-semibold text-gray-800">{project.projectType || 'Proj único'}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'details' 
                        ? 'text-99blue border-b-2 border-99blue' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Detalhes do Projeto
                  </button>
                  <button
                    onClick={() => setActiveTab('proposals')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'proposals' 
                        ? 'text-99blue border-b-2 border-99blue' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Propostas ({proposals.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' ? (
              <>
                {/* Description Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-99blue" />
                    Descrição do Projeto
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Skills Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-99blue" />
                    Habilidades Necessárias
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-sky-100 hover:text-99blue transition-colors cursor-pointer"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {project.attachments && project.attachments.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-99blue" />
                      Anexos
                    </h2>
                    <div className="space-y-2">
                      {project.attachments.map((file, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="flex-1 text-gray-700">{file}</span>
                          <button className="text-99blue hover:underline text-sm">Download</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Propostas Enviadas</h2>
                {proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Nenhuma proposta enviada ainda</p>
                    <p className="text-sm text-gray-400 mt-1">Seja o primeiro a enviar uma proposta!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
                              {proposal.freelancerName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800">{proposal.freelancerName}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                {proposal.freelancerRating}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            proposal.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {proposal.status === 'pending' ? 'Pendente' : 
                             proposal.status === 'accepted' ? 'Aceita' : 'Rejeitada'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{proposal.text}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            <strong className="text-gray-800">{proposal.value}</strong> proposta
                          </span>
                          <span className="text-gray-500">
                            Entrega em <strong className="text-gray-800">{proposal.deliveryTime}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proposal Form */}
            {showProposalForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Send className="w-5 h-5 mr-2 text-99blue" />
                    Enviar Proposta
                  </h2>
                  <button 
                    onClick={() => setShowProposalForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmitProposal}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descreva sua proposta <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent transition-all"
                      rows={5}
                      placeholder="Apresente-se, explique por que você é o profissional ideal para este projeto, descreva sua experiência relevante..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 100 caracteres</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da proposta (R$) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={proposalValue}
                          onChange={(e) => setProposalValue(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                          placeholder="Ex: 5.000"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prazo de entrega <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                          placeholder="Ex: 15 dias"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors font-medium flex items-center justify-center"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Proposta
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProposalForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Interessado no projeto?</h3>
              {!showProposalForm && (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setShowProposalForm(true);
                  }}
                  className="w-full py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors font-medium flex items-center justify-center mb-3"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Proposta
                </button>
              )}
              <button
                onClick={handleInterest}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center mb-3"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                Tenho Interesse
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-3 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium flex items-center justify-center"
              >
                <Flag className="w-5 h-5 mr-2" />
                Denunciar Projeto
              </button>
            </div>

            {/* Budget Card */}
            <div className="bg-gradient-to-br from-99blue to-sky-500 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-sm font-medium text-white/80 mb-2">Orçamento do Cliente</h3>
              <p className="text-3xl font-bold mb-4">{project.budget}</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Tipo de pagamento</span>
                  <span className="font-medium">{project.budgetType === 'fixed' ? 'Fixo' : project.budgetType === 'hourly' ? 'Por hora' : 'Faixa'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Prazo estimado</span>
                  <span className="font-medium">{project.deadline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Nível de experiência</span>
                  <span className="font-medium">{project.experienceLevel}</span>
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-99blue" />
                Sobre o Cliente
              </h3>
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-99blue to-sky-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {project.clientName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-800">{project.clientName}</p>
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">{project.clientRating}</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="text-gray-500">{project.clientJobs} projetos</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                {project.clientLocation && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {project.clientLocation}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Membro desde {new Date(project.clientMemberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Perfil verificado
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{project.clientJobs}</p>
                    <p className="text-xs text-gray-500">Projetos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{project.clientRating}</p>
                    <p className="text-xs text-gray-500">Avaliação</p>
                  </div>
                </div>
              </div>

              <Link 
                to={`/user/${project.clientId}`}
                className="w-full mt-4 py-2 border border-99blue text-99blue rounded-lg hover:bg-99blue hover:text-white transition-colors text-sm font-medium flex items-center justify-center"
              >
                Ver Perfil Completo
              </Link>
            </div>

            {/* Safety Tips */}
            <div className="bg-green-50 rounded-xl border border-green-100 p-6">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Dicas de Segurança
              </h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Nunca aceite pagamentos fora da plataforma
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Verifique o perfil e avaliações do cliente
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Use o sistema de garantia de pagamento
                </li>
              </ul>
            </div>

            {/* Similar Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Projetos Similares</h3>
              <div className="space-y-4">
                {[
                  { title: 'Smart Contract para NFT Marketplace', budget: 'R$ 3.000 - R$ 5.000' },
                  { title: 'Integração Web3 com React', budget: 'R$ 2.000 - R$ 4.000' },
                  { title: 'Desenvolvimento DeFi Dashboard', budget: 'R$ 4.000 - R$ 8.000' },
                ].map((proj, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer">
                    <p className="font-medium text-gray-800 text-sm mb-1">{proj.title}</p>
                    <p className="text-99blue text-sm">{proj.budget}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Compartilhar Projeto</h2>
              <button onClick={() => setShowShareModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => handleShare('copy')}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Copiar link</p>
                  <p className="text-sm text-gray-500">Copiar URL para área de transferência</p>
                </div>
              </button>
              <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-gray-500">Compartilhar via WhatsApp</p>
                </div>
              </button>
              <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center transition-colors">
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
                  <Send className="w-5 h-5 text-sky-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Telegram</p>
                  <p className="text-sm text-gray-500">Compartilhar via Telegram</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Flag className="w-5 h-5 mr-2 text-orange-500" />
                Denunciar Projeto
              </h2>
              <button onClick={() => setShowReportModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Por que você está denunciando este projeto?</p>
            <div className="space-y-2 mb-4">
              {reportReasons.map((reason) => (
                <label key={reason} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Denúncia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

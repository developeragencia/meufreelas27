import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  apiApproveDelivery,
  apiCreateDelivery,
  apiCreateProposal,
  apiEnsureConversation,
  apiGetProject,
  apiListDeliveries,
  apiListNotifications,
  apiListProposals,
  apiRequestDeliveryRevision,
  apiSendMessage,
  apiUpdateProposalStatus,
  hasApi,
  type ApiDelivery,
  type ApiProposal,
} from '../lib/api';
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
  ChevronRight,
  Bell
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

interface Delivery {
  id: string;
  projectId: string;
  proposalId?: string;
  freelancerId: string;
  freelancerName: string;
  message: string;
  deliveryUrl?: string;
  status: 'Enviada' | 'Revisão solicitada' | 'Aprovada';
  clientFeedback?: string;
  createdAt: string;
  reviewedAt?: string;
}

function toLocalProposalStatus(status: ApiProposal['status']): 'pending' | 'accepted' | 'rejected' {
  if (status === 'Aceita') return 'accepted';
  if (status === 'Recusada') return 'rejected';
  return 'pending';
}

function mapApiProposal(p: ApiProposal): Proposal {
  return {
    id: p.id,
    projectId: p.projectId,
    freelancerId: p.freelancerId,
    freelancerName: p.freelancerName,
    freelancerAvatar: p.freelancerAvatar,
    freelancerRating: p.freelancerRating || 0,
    text: p.message,
    value: p.value,
    deliveryTime: p.deliveryDays,
    status: toLocalProposalStatus(p.status),
    createdAt: p.createdAt,
  };
}

function mapApiDelivery(d: ApiDelivery): Delivery {
  return {
    id: d.id,
    projectId: d.projectId,
    proposalId: d.proposalId,
    freelancerId: d.freelancerId,
    freelancerName: d.freelancerName,
    message: d.message,
    deliveryUrl: d.deliveryUrl,
    status: d.status,
    clientFeedback: d.clientFeedback,
    createdAt: d.createdAt,
    reviewedAt: d.reviewedAt,
  };
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
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [negotiatingProposalId, setNegotiatingProposalId] = useState<string | null>(null);
  const [maxProposalValue, setMaxProposalValue] = useState('');
  const [maxDeliveryDays, setMaxDeliveryDays] = useState('');
  const [minFreelancerRating, setMinFreelancerRating] = useState('');
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [proposalSort, setProposalSort] = useState<'recent' | 'value_asc' | 'value_desc' | 'days_asc' | 'rating_desc'>('recent');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryActionLoadingId, setDeliveryActionLoadingId] = useState<string | null>(null);
  const [deliveryFeedbackById, setDeliveryFeedbackById] = useState<Record<string, string>>({});
  const [deliveryRatingById, setDeliveryRatingById] = useState<Record<string, number>>({});
  const [loadingProject, setLoadingProject] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);

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

  const loadProject = async () => {
    setLoadingProject(true);
    if (!id) {
      setProject(null);
      setLoadingProject(false);
      return;
    }
    if (!hasApi()) {
      try {
        const TARGET_ID = '8c5870363bc9ca76312b3b530fbb6cdf7363';
        const raw = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
        let list = Array.isArray(raw) ? raw : [];
        if (id === TARGET_ID) {
          list = list.filter((p: any) => p?.id !== TARGET_ID);
          const nowISO = new Date().toISOString();
          const recreated = {
            id: TARGET_ID,
            title: 'Atendimento ao cliente via WhatsApp por 1 hora',
            category: 'Atendimento ao Consumidor',
            subcategory: 'Atendimento ao Consumidor',
            description:
              'Olá! Se você é um profissional com excelente comunicação escrita e busca uma renda extra garantida, segura e que tome pouco tempo do seu dia, preste muita atenção neste projeto.\n\nA atuação é de apenas 1 hora por dia.\n\nSomos uma empresa em crescimento e estamos buscando um(a) especialista em atendimento para ser a \"voz\" da nossa marca no WhatsApp.\n\nO que você vai fazer:\n• Responder mensagens de clientes e interessados de forma humanizada, empática e ágil.\n• Esclarecer dúvidas frequentes utilizando nossos materiais de apoio e roteiros.\n• Fazer a triagem de contatos e direcionar problemas complexos para a nossa equipe interna.\n\nO que nós esperamos de você:\n• Português impecável: gramática, ortografia e pontuação corretas são inegociáveis.\n• Empatia e simpatia.\n• Capacidade de contornar objeções com educação e acolher o cliente.',
            budget: 'Aberto',
            experienceLevel: 'Iniciante',
            proposalDays: '29',
            clientId: 'client_demo',
            clientName: 'Cliente',
            createdAt: nowISO,
            updatedAt: nowISO,
            proposals: 214,
            interested: 239,
            minOffer: 100,
            skills: ['Atendimento', 'WhatsApp', 'Comunicação', 'Empatia'],
            status: 'Aberto',
          };
          list.push(recreated);
          localStorage.setItem('meufreelas_projects', JSON.stringify(list));
        }
        const found = list.find((p: { id: string }) => p.id === id);
        if (!found) {
          setProject(null);
        } else {
          setProject({
            id: found.id,
            title: found.title || '',
            category: found.category || 'Outra',
            subcategory: found.subcategory || '',
            description: found.description || '',
            budget: String(found.budget || 'A combinar'),
            budgetType: 'range',
            deadline: found.proposalDays ? `${found.proposalDays} dias` : '-',
            requiredSkills: Array.isArray(found.skills) ? found.skills : [],
            clientId: String(found.clientId || ''),
            clientName: String(found.clientName || 'Cliente'),
            clientAvatar: '',
            clientRating: 0,
            clientJobs: 0,
            clientMemberSince: found.createdAt ? new Date(found.createdAt).toLocaleDateString('pt-BR') : '-',
            clientLocation: '',
            proposals: Number(found.proposals || 0),
            interested: Number(found.interested || 0),
            status: String(found.status || 'Aberto'),
            createdAt: String(found.createdAt || ''),
            experienceLevel: String(found.experienceLevel || 'Intermediário'),
            projectType: 'Proj único',
            views: 0,
            attachments: [],
          });
        }
      } catch {
        setProject(null);
      }
      setLoadingProject(false);
      return;
    }
    const res = await apiGetProject(id);
    if (!res.ok || !res.project) {
      setProject(null);
      setLoadingProject(false);
      return;
    }
    const p = res.project;
    const requiredSkills = Array.isArray(p.skills) ? p.skills : [];
    setProject({
      id: p.id,
      title: p.title,
      category: p.category,
      subcategory: '',
      description: p.description,
      budget: p.budget || 'A combinar',
      budgetType: 'range',
      deadline: p.proposalDays ? `${p.proposalDays} dias` : '-',
      requiredSkills,
      clientId: p.clientId,
      clientName: p.clientName || 'Cliente',
      clientAvatar: '',
      clientRating: 0,
      clientJobs: 0,
      clientMemberSince: new Date(p.createdAt).toLocaleDateString('pt-BR'),
      clientLocation: '',
      proposals: p.proposals || 0,
      interested: p.proposals || 0,
      status: p.status,
      createdAt: p.createdAt,
      experienceLevel: p.experienceLevel || 'Intermediário',
      projectType: 'Proj único',
      views: 0,
      attachments: [],
    });
    setLoadingProject(false);
  };

  const loadProposals = async () => {
    if (!id || !hasApi()) return;
    const res = await apiListProposals({ projectId: id });
    if (!res.ok) {
      setProposals([]);
      return;
    }
    setProposals((res.proposals || []).map(mapApiProposal));
  };

  const loadDeliveries = async () => {
    if (!id || !user?.id || !hasApi()) {
      setDeliveries([]);
      return;
    }
    const res = await apiListDeliveries({ projectId: id, userId: user.id });
    if (!res.ok) {
      setDeliveries([]);
      return;
    }
    setDeliveries((res.deliveries || []).map(mapApiDelivery));
  };

  useEffect(() => {
    loadProject();
    loadProposals();
    loadDeliveries();
    const savedProjects = JSON.parse(localStorage.getItem('meufreelas_saved_projects') || '[]');
    setIsSaved(savedProjects.includes(id));
  }, [id, user?.id]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id || !hasApi()) {
        setNotificationsCount(0);
        return;
      }
      try {
        const res = await apiListNotifications(user.id);
        if (!res.ok) {
          setNotificationsCount(0);
          return;
        }
        const unread = (res.notifications || []).filter((n: any) => !n.isRead).length;
        setNotificationsCount(unread);
      } catch {
        setNotificationsCount(0);
      }
    };
    loadNotifications();
  }, [user?.id]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id || !user?.id || user.type !== 'freelancer') {
      showToast('Apenas freelancers podem enviar propostas.');
      return;
    }

    const normalizedValue = proposalValue.startsWith('R$') ? proposalValue : `R$ ${proposalValue}`;
    const res = await apiCreateProposal({
      projectId: id,
      freelancerId: user.id,
      amount: normalizedValue,
      deliveryDays: deliveryTime,
      message: proposalText,
    });
    if (!res.ok) {
      showToast(res.error || 'Não foi possível enviar proposta.');
      return;
    }
    await loadProposals();
    await loadProject();
    showToast('Proposta enviada com sucesso!');
    setShowProposalForm(false);
    setProposalText('');
    setProposalValue('');
    setDeliveryTime('');
  };

  const handleProposalDecision = async (proposalId: string, decision: 'accepted' | 'rejected') => {
    if (!user?.id || user.type !== 'client' || !project || project.clientId !== user.id) return;
    const status = decision === 'accepted' ? 'Aceita' : 'Recusada';
    const res = await apiUpdateProposalStatus({ proposalId, clientId: user.id, status });
    if (!res.ok) {
      showToast(res.error || 'Não foi possível atualizar proposta.');
      return;
    }
    await loadProposals();
    await loadProject();
    if (decision === 'accepted') {
      showToast('Proposta aceita. Redirecionando para pagamento...');
      setTimeout(() => navigate(`/checkout/${proposalId}`), 500);
      return;
    }
    showToast('Proposta recusada.');
  };

  const handleNegotiateProposal = async (proposal: Proposal) => {
    if (!user?.id || user.type !== 'client' || !project || project.clientId !== user.id) return;
    setNegotiatingProposalId(proposal.id);
    const conv = await apiEnsureConversation(user.id, proposal.freelancerId, project.id);
    if (!conv.ok || !conv.conversationId) {
      setNegotiatingProposalId(null);
      showToast(conv.error || 'Não foi possível abrir negociação.');
      return;
    }
    const intro = `Olá, ${proposal.freelancerName}! Vamos negociar sua proposta?\nValor enviado: ${proposal.value}\nPrazo enviado: ${proposal.deliveryTime}`;
    await apiSendMessage(user.id, conv.conversationId, intro);
    setNegotiatingProposalId(null);
    navigate(`/messages?conversation=${conv.conversationId}`);
  };

  const handleAskQuestion = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!project || !user?.id) {
      navigate('/messages');
      return;
    }
    if (!project.clientId) {
      navigate('/messages');
      return;
    }
    if (!hasApi()) {
      navigate('/messages');
      return;
    }
    setQuestionLoading(true);
    const conv = await apiEnsureConversation(user.id, project.clientId, project.id);
    if (!conv.ok || !conv.conversationId) {
      setQuestionLoading(false);
      showToast('Não foi possível abrir a conversa com o cliente.');
      return;
    }
    await apiSendMessage(
      user.id,
      conv.conversationId,
      `Olá! Tenho uma dúvida sobre o projeto: "${project.title}".`
    );
    setQuestionLoading(false);
    navigate(`/messages?conversation=${conv.conversationId}`);
  };

  const parseMoney = (raw: string): number => {
    const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const parseDeliveryDays = (raw: string): number => {
    const match = raw.match(/\d+/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    const parsed = Number.parseInt(match[0], 10);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const filteredProposals = proposals.filter((proposal) => {
    const proposalValue = parseMoney(proposal.value);
    const deliveryDays = parseDeliveryDays(proposal.deliveryTime);
    const rating = proposal.freelancerRating || 0;

    if (maxProposalValue.trim() && proposalValue > Number(maxProposalValue)) return false;
    if (maxDeliveryDays.trim() && deliveryDays > Number(maxDeliveryDays)) return false;
    if (minFreelancerRating.trim() && rating < Number(minFreelancerRating)) return false;
    return true;
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (proposalSort === 'value_asc') return parseMoney(a.value) - parseMoney(b.value);
    if (proposalSort === 'value_desc') return parseMoney(b.value) - parseMoney(a.value);
    if (proposalSort === 'days_asc') return parseDeliveryDays(a.deliveryTime) - parseDeliveryDays(b.deliveryTime);
    if (proposalSort === 'rating_desc') return (b.freelancerRating || 0) - (a.freelancerRating || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const acceptedProposal = proposals.find((p) => p.status === 'accepted');
  const isProjectInProgress = project?.status === 'Em andamento';
  const canFreelancerDeliver = !!(
    user?.id &&
    user.type === 'freelancer' &&
    acceptedProposal &&
    acceptedProposal.freelancerId === user.id &&
    isProjectInProgress
  );
  const canClientReview = !!(
    user?.id &&
    user.type === 'client' &&
    project &&
    project.clientId === user.id &&
    isProjectInProgress
  );

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.id || !canFreelancerDeliver) return;
    if (!deliveryMessage.trim()) {
      showToast('Descreva a entrega antes de enviar.');
      return;
    }
    setDeliveryActionLoadingId('create');
    const res = await apiCreateDelivery({
      projectId: id,
      freelancerId: user.id,
      message: deliveryMessage.trim(),
      deliveryUrl: deliveryUrl.trim() || undefined,
    });
    setDeliveryActionLoadingId(null);
    if (!res.ok) {
      showToast(res.error || 'Não foi possível enviar entrega.');
      return;
    }
    setDeliveryMessage('');
    setDeliveryUrl('');
    await loadDeliveries();
    showToast('Entrega enviada para revisão do cliente.');
  };

  const handleRequestRevision = async (deliveryId: string) => {
    if (!user?.id || !canClientReview) return;
    const feedback = (deliveryFeedbackById[deliveryId] || '').trim();
    if (!feedback) {
      showToast('Informe o feedback para solicitar revisão.');
      return;
    }
    setDeliveryActionLoadingId(deliveryId);
    const res = await apiRequestDeliveryRevision({ deliveryId, clientId: user.id, feedback });
    setDeliveryActionLoadingId(null);
    if (!res.ok) {
      showToast(res.error || 'Não foi possível solicitar revisão.');
      return;
    }
    await loadDeliveries();
    showToast('Revisão solicitada ao freelancer.');
  };

  const handleApproveDelivery = async (deliveryId: string) => {
    if (!user?.id || !canClientReview) return;
    const feedback = (deliveryFeedbackById[deliveryId] || '').trim();
    const rating = deliveryRatingById[deliveryId] ?? 5;
    setDeliveryActionLoadingId(deliveryId);
    const res = await apiApproveDelivery({ deliveryId, clientId: user.id, feedback: feedback || undefined, rating });
    setDeliveryActionLoadingId(null);
    if (!res.ok) {
      showToast(res.error || 'Não foi possível aprovar entrega.');
      return;
    }
    await loadDeliveries();
    await loadProject();
    showToast('Entrega aprovada e projeto concluído!');
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

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-99blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">Projeto não encontrado</p>
          <p className="text-gray-400 text-sm mt-1">O link pode estar incorreto ou o projeto foi removido.</p>
          <Link to="/projects" className="mt-4 inline-block px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-600 transition-colors">
            Ver todos os projetos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
              <Link to="/como-funciona" className="text-gray-300 hover:text-white transition-colors">Como Funciona</Link>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/messages"
                    className="relative p-2 text-gray-300 hover:text-white"
                    title="Mensagens"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative p-2 text-gray-300 hover:text-white"
                    title="Notificações"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notificationsCount > 99 ? '99+' : notificationsCount}
                      </span>
                    )}
                  </Link>
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
          <span className="text-gray-700 truncate max-w-[140px] sm:max-w-[280px]">{project.title}</span>
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
              <div className="border-t border-gray-200 overflow-x-auto">
                <div className="flex min-w-max">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'details' 
                        ? 'text-99blue border-b-2 border-99blue' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Detalhes do Projeto
                  </button>
                  <button
                    onClick={() => setActiveTab('proposals')}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {user?.type === 'client' && project.clientId === user.id ? 'Propostas Recebidas' : 'Propostas Enviadas'}
                </h2>

                {user?.type === 'client' && project.clientId === user.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <input
                      type="number"
                      min="0"
                      value={maxProposalValue}
                      onChange={(e) => setMaxProposalValue(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Valor máx. (R$)"
                    />
                    <input
                      type="number"
                      min="0"
                      value={maxDeliveryDays}
                      onChange={(e) => setMaxDeliveryDays(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Prazo máx. (dias)"
                    />
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={minFreelancerRating}
                      onChange={(e) => setMinFreelancerRating(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Avaliação mínima"
                    />
                    <select
                      value={proposalSort}
                      onChange={(e) => setProposalSort(e.target.value as typeof proposalSort)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="recent">Mais recentes</option>
                      <option value="value_asc">Menor valor</option>
                      <option value="value_desc">Maior valor</option>
                      <option value="days_asc">Menor prazo</option>
                      <option value="rating_desc">Melhor avaliação</option>
                    </select>
                  </div>
                )}

                {sortedProposals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      {proposals.length === 0 ? 'Nenhuma proposta enviada ainda' : 'Nenhuma proposta encontrada com os filtros'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {proposals.length === 0 ? 'Seja o primeiro a enviar uma proposta!' : 'Ajuste os filtros para visualizar outras propostas'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedProposals.map((proposal) => (
                      <div key={proposal.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-99blue rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                              {proposal.freelancerAvatar ? (
                                <img src={proposal.freelancerAvatar} alt={proposal.freelancerName} className="w-full h-full object-cover" />
                              ) : (
                                proposal.freelancerName.charAt(0)
                              )}
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
                        {user?.type === 'client' && project.clientId === user.id && proposal.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => handleProposalDecision(proposal.id, 'accepted')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProposalDecision(proposal.id, 'rejected')}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNegotiateProposal(proposal)}
                              disabled={negotiatingProposalId === proposal.id}
                              className="px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-500 transition-colors text-sm disabled:opacity-50"
                            >
                              {negotiatingProposalId === proposal.id ? 'Abrindo chat...' : 'Negociar'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Deliveries Workflow */}
            {(isProjectInProgress || deliveries.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Entregas do Projeto</h2>

                {canFreelancerDeliver && (
                  <form onSubmit={handleSubmitDelivery} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">Enviar nova entrega</p>
                    <textarea
                      value={deliveryMessage}
                      onChange={(e) => setDeliveryMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                      rows={4}
                      placeholder="Descreva o que foi entregue, instruções de uso e observações."
                      required
                    />
                    <input
                      type="url"
                      value={deliveryUrl}
                      onChange={(e) => setDeliveryUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                      placeholder="Link da entrega (Drive, GitHub, Figma, etc.) - opcional"
                    />
                    <button
                      type="submit"
                      disabled={deliveryActionLoadingId === 'create'}
                      className="px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-500 transition-colors text-sm disabled:opacity-50"
                    >
                      {deliveryActionLoadingId === 'create' ? 'Enviando...' : 'Enviar Entrega'}
                    </button>
                  </form>
                )}

                {deliveries.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma entrega enviada ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">{delivery.freelancerName}</p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              delivery.status === 'Aprovada'
                                ? 'bg-green-100 text-green-700'
                                : delivery.status === 'Revisão solicitada'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {delivery.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{delivery.message}</p>
                        {delivery.deliveryUrl && (
                          <a
                            href={delivery.deliveryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-99blue hover:underline"
                          >
                            Abrir link da entrega
                          </a>
                        )}
                        {delivery.clientFeedback && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Feedback do cliente:</strong> {delivery.clientFeedback}
                          </p>
                        )}

                        {canClientReview && delivery.status !== 'Aprovada' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação (1–5 estrelas)</label>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setDeliveryRatingById((prev) => ({ ...prev, [delivery.id]: star }))
                                  }
                                  className={`text-lg ${(deliveryRatingById[delivery.id] ?? 5) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                  aria-label={`${star} estrela(s)`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={deliveryFeedbackById[delivery.id] || ''}
                              onChange={(e) =>
                                setDeliveryFeedbackById((prev) => ({ ...prev, [delivery.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                              rows={3}
                              placeholder="Feedback para o freelancer (obrigatório para revisão)"
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => handleRequestRevision(delivery.id)}
                                disabled={deliveryActionLoadingId === delivery.id}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50"
                              >
                                Solicitar Revisão
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveDelivery(delivery.id)}
                                disabled={deliveryActionLoadingId === delivery.id}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                              >
                                Aprovar e Concluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proposal Form */}
            {showProposalForm && user?.type === 'freelancer' && (
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tem dúvidas? <button type="button" onClick={handleAskQuestion} className="text-99blue hover:underline">Faça uma pergunta</button>.</h3>
              <button
                type="button"
                onClick={handleAskQuestion}
                disabled={questionLoading}
                className="w-full py-3 mb-4 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium flex items-center justify-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {questionLoading ? 'Abrindo conversa...' : 'Enviar proposta'}
              </button>
              {!showProposalForm && user?.type === 'freelancer' && (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    navigate(`/project/bid/${project.id}`);
                  }}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center mb-3"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Tenho interesse
                </button>
              )}
              <button
                onClick={handleInterest}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center mb-3"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                Salvar
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-3 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium flex items-center justify-center"
              >
                <Flag className="w-5 h-5 mr-2" />
                Denunciar
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações adicionais</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Categoria:</span>
                  <span className="text-gray-800 font-medium text-right">{project.category}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Subcategoria:</span>
                  <span className="text-gray-800 font-medium text-right">{project.subcategory || `Outra - ${project.category}`}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Orçamento:</span>
                  <span className="text-gray-800 font-medium text-right">{project.budget}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Nível de experiência:</span>
                  <span className="text-gray-800 font-medium text-right">{project.experienceLevel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Visibilidade:</span>
                  <span className="text-gray-800 font-medium text-right">Público</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Propostas:</span>
                  <span className="text-gray-800 font-medium text-right">{project.proposals}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Interessados:</span>
                  <span className="text-gray-800 font-medium text-right">{project.interested}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Valor mínimo:</span>
                  <span className="text-gray-800 font-medium text-right">R$ 50,00</span>
                </div>
              </div>
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

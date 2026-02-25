import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Menu, Star, X, Clock, Heart, Flag, Send, MessageCircle, User, MapPin, Shield, ShieldCheck, FileText, ChevronDown, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiEnsureConversation, apiGetProject, apiListProposals, apiSendMessage, hasApi, type ApiProject, type ApiProposal } from '../lib/api';
import BrandLogo from '../components/BrandLogo';

type ProjectView = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  budget: string;
  experienceLevel: string;
  visibility: string;
  proposals: number;
  interested: number;
  minOffer: string;
  clientName: string;
  clientId: string;
  createdAt: string;
};

const CURRENT_WHATSAPP_ID = '8c5870363bc9ca76312b3b530fbb6cdf7363';
const LEGACY_WHATSAPP_ID = 'ee15eb2bbd4a6520bad2e569e5450db99a8f';

function relativePublishedAt(iso: string) {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - created);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const d = Math.floor(h / 24);
  if (h < 1) return 'Publicado: agora';
  if (h < 24) return `Publicado: ${h} hora${h > 1 ? 's' : ''} atrás`;
  if (d < 30) return `Publicado: ${d} dia${d > 1 ? 's' : ''} atrás`;
  return `Publicado: ${new Date(iso).toLocaleDateString('pt-BR')}`;
}

function mapProject(p: ApiProject): ProjectView {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category || 'Categoria',
    subcategory: p.category || 'Categoria',
    budget: p.budget || 'Aberto',
    experienceLevel: p.experienceLevel === 'beginner' ? 'Iniciante' : p.experienceLevel === 'expert' ? 'Especialista' : 'Intermediário',
    visibility: p.visibility === 'private' ? 'Privado' : 'Público',
    proposals: Number(p.proposals || 0),
    interested: Math.max(Number(p.proposals || 0), 0),
    minOffer: p.budget || 'A combinar',
    clientName: p.clientName || 'Cliente',
    clientId: p.clientId,
    createdAt: p.createdAt,
  };
}

function mapLocalProject(raw: any, fallbackId: string): ProjectView | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim();
  const clientId = String(raw.clientId || raw.client_id || '').trim();
  if (!id || !clientId) return null;
  const createdAt = String(raw.createdAt || raw.updatedAt || new Date().toISOString());

  return mapProject({
    id,
    clientId,
    clientName: String(raw.clientName || raw.client_name || 'Cliente'),
    title: String(raw.title || 'Projeto sem título'),
    description: String(raw.description || ''),
    budget: String(raw.budget || 'Aberto'),
    category: String(raw.category || 'Categoria'),
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    experienceLevel: String(raw.experienceLevel || raw.experience_level || 'intermediate'),
    proposalDays: String(raw.proposalDays || raw.proposal_days || ''),
    visibility: String(raw.visibility || 'public') as 'public' | 'private',
    status: 'Aberto',
    proposals: Number(raw.proposals || 0),
    createdAt,
    updatedAt: String(raw.updatedAt || createdAt),
  });
}

function proposalStatusLabel(status: ApiProposal['status'] | 'Todas') {
  if (status === 'Aceita') return 'Aceita';
  if (status === 'Recusada') return 'Rejeitada';
  if (status === 'Pendente') return 'Aguardando avaliação';
  return 'Todas';
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<ProjectView | null>(null);
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalFilter, setProposalFilter] = useState<'Todas' | 'Pendente' | 'Aceita' | 'Recusada'>('Todas');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Ação concluída com sucesso.');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) {
        setProject(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const requestedId = id === LEGACY_WHATSAPP_ID ? CURRENT_WHATSAPP_ID : id;
      let resolvedProject: ProjectView | null = null;

      if (hasApi()) {
        const res = await apiGetProject(requestedId);
        if (res.ok && res.project) {
          resolvedProject = mapProject(res.project);
        }
      }

      if (!resolvedProject) {
        try {
          const localProjects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
          if (Array.isArray(localProjects)) {
            const found = localProjects.find((p: any) => {
              const pid = String(p?.id || '').trim();
              if (!pid) return false;
              if (pid === requestedId) return true;
              return requestedId === CURRENT_WHATSAPP_ID && pid === LEGACY_WHATSAPP_ID;
            });
            resolvedProject = mapLocalProject(found, requestedId);
          }
        } catch {
          resolvedProject = null;
        }
      }

      setProject(resolvedProject);

      if (hasApi()) {
        const proposalRes = await apiListProposals({ projectId: requestedId });
        setProposals(proposalRes.ok ? proposalRes.proposals || [] : []);
      } else {
        setProposals([]);
      }
      setLoading(false);
    }
    void load();
  }, [id]);

  const visibleProposals = useMemo(() => {
    if (proposalFilter === 'Todas') return proposals;
    return proposals.filter((p) => p.status === proposalFilter);
  }, [proposalFilter, proposals]);

  const displayProposalCount = useMemo(() => {
    if (!project) return 0;
    return visibleProposals.length;
  }, [project, visibleProposals.length]);

  const openQuestion = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!project || !user?.id || !hasApi()) {
      navigate('/messages');
      return;
    }
    setQuestionLoading(true);
    const conv = await apiEnsureConversation(user.id, project.clientId, project.id);
    if (conv.ok && conv.conversationId) {
      await apiSendMessage(user.id, conv.conversationId, `Olá! Tenho uma dúvida sobre o projeto "${project.title}".`);
      navigate(`/messages?conversation=${conv.conversationId}`);
      return;
    }
    setQuestionLoading(false);
    navigate('/messages');
  };

  const handleSaveProject = () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const saved = JSON.parse(localStorage.getItem('meufreelas_saved_projects') || '[]');
    const list = Array.isArray(saved) ? saved : [];
    const exists = list.includes(id);
    const next = exists ? list.filter((pid: string) => pid !== id) : [...list, id];
    localStorage.setItem('meufreelas_saved_projects', JSON.stringify(next));
    setIsSaved(!exists);
    setToastMessage(exists ? 'Projeto removido dos salvos.' : 'Projeto salvo com sucesso.');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  const handleReportProject = () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!reportReason.trim()) return;
    const reports = JSON.parse(localStorage.getItem('meufreelas_reports') || '[]');
    const list = Array.isArray(reports) ? reports : [];
    list.push({
      id: Date.now().toString(),
      projectId: id,
      reason: reportReason.trim(),
      createdAt: new Date().toISOString(),
      reportedBy: user?.id || null,
    });
    localStorage.setItem('meufreelas_reports', JSON.stringify(list));
    setShowReportModal(false);
    setReportReason('');
    setToastMessage('Denúncia enviada. Obrigado pelo feedback.');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  const proposalHref = !project
    ? '/login'
    : !isAuthenticated
      ? '/login'
      : user?.type === 'freelancer'
        ? `/project/bid/${project.id}`
        : '/plans';

  useEffect(() => {
    if (!id) return;
    const saved = JSON.parse(localStorage.getItem('meufreelas_saved_projects') || '[]');
    const list = Array.isArray(saved) ? saved : [];
    setIsSaved(list.includes(id));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Carregando projeto...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-2">Projeto não encontrado.</p>
          <Link to="/projects" className="text-sky-700 hover:underline">Voltar para projetos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {showSavedToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white text-sm px-4 py-2 rounded shadow z-50">
          {toastMessage}
        </div>
      )}
      <header className="bg-99dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrandLogo to="/" heightClassName="h-10" darkBg />
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-200">
            <Link to="/projects">Projetos</Link>
            <Link to="/freelancers">Freelancers</Link>
            <Link to={isAuthenticated ? (user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard') : '/login'}>{isAuthenticated ? 'Conta' : 'Login'}</Link>
          </nav>
        </div>
        <div className="hidden md:block bg-99accent text-white text-sm">
          <div className="max-w-6xl mx-auto px-4 h-10 flex items-center gap-5">
            <Link to="/">Página inicial</Link>
            <Link to="/projects">Projetos</Link>
            <Link to="/freelancers">Freelancers</Link>
            <Link to="/profile">Perfil</Link>
            <Link to="/account">Conta</Link>
            <Link to="/tools">Ferramentas</Link>
            <Link to="/ajuda">Ajuda</Link>
          </div>
        </div>
      </header>
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-50 md:hidden">
            <div className="px-4 h-14 border-b flex items-center justify-between">
              <BrandLogo to="/" heightClassName="h-8" className="max-w-[160px]" />
              <button type="button" onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2 text-gray-800">
              <Link to="/" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Página inicial</Link>
              <Link to="/projects" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Projetos</Link>
              <Link to="/freelancers" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Freelancers</Link>
              <Link to="/profile" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Perfil</Link>
              <Link to="/account" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Conta</Link>
              <Link to="/tools" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Ferramentas</Link>
              <Link to="/ajuda" onClick={() => setShowMobileMenu(false)} className="block px-2 py-2 rounded hover:bg-gray-100">Ajuda</Link>
            </nav>
          </aside>
        </>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 p-4 text-sm mb-4">
          <Link to="/projects" className="text-[#13a9d8] hover:underline">« Voltar aos resultados da pesquisa</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <h1 className="text-2xl md:text-3xl font-light text-gray-800 leading-tight">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-2">{relativePublishedAt(project.createdAt)}</p>

            <h2 className="text-xl font-light text-gray-800 mt-6 mb-3">Descrição do Projeto:</h2>
            <p className="text-gray-700 whitespace-pre-line leading-7 text-sm md:text-base">{project.description}</p>
          </section>

          <aside className="space-y-4">
            <div className="bg-[#efefef] border border-gray-200 p-5">
              <p className="text-sm text-gray-700">
                Tem dúvidas?{' '}
                <button type="button" onClick={openQuestion} className="text-[#0f7fa0] font-semibold underline">
                  {questionLoading ? 'Abrindo...' : 'Faça uma pergunta.'}
                </button>
              </p>
              <div className="my-4 flex items-center">
                <div className="h-px bg-gray-300 flex-1" />
                <span className="px-3 text-xs text-gray-500">ou</span>
                <div className="h-px bg-gray-300 flex-1" />
              </div>
              <button type="button" onClick={() => navigate(proposalHref)} className="w-full bg-99blue hover:bg-99blue-dark text-white font-semibold py-3">
                Enviar proposta
              </button>
            </div>

            <div className="bg-[#efefef] border border-gray-200 p-5 text-sm">
              <h3 className="text-gray-700 mb-3">Informações adicionais</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between"><span>Categoria:</span><span>{project.category}</span></div>
                <div className="flex justify-between"><span>Subcategoria:</span><span>{project.subcategory}</span></div>
                <div className="flex justify-between"><span>Orçamento:</span><span>{project.budget}</span></div>
                <div className="flex justify-between"><span>Nível de experiência:</span><span>{project.experienceLevel}</span></div>
                <div className="flex justify-between"><span>Visibilidade:</span><span>{project.visibility}</span></div>
                <div className="flex justify-between"><span>Propostas:</span><span>{Math.max(project.proposals, proposals.length)}</span></div>
                <div className="flex justify-between"><span>Interessados:</span><span>{project.interested}</span></div>
                <div className="flex justify-between"><span>Orçamento:</span><span>{project.budget}</span></div>
              </div>
            </div>

            <div className="bg-[#efefef] border border-gray-200 p-5 text-sm">
              <p className="text-gray-600">Cliente</p>
              <div className="mt-2 flex items-center gap-3">
                <Link to={`/user/${project.clientId}`} className="w-14 h-14 bg-gray-300 block hover:ring-2 hover:ring-99blue flex items-center justify-center text-gray-500 text-xs">
                   Foto
                </Link>
                <div>
                  <Link to={`/user/${project.clientId}`} className="text-99blue hover:text-99blue font-medium capitalize">
                    {project.clientName.toLowerCase()}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">
                    (Sem avaliações)
                  </div>
                </div>
              </div>
              <hr className="my-4" />
              <p className="text-gray-600 mb-2">Gerenciamento do projeto</p>
              <button type="button" onClick={handleSaveProject} className="block text-left text-gray-700 mb-1">
                {isSaved ? 'Remover dos salvos' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setShowReportModal(true)} className="block text-left text-gray-700">Denunciar</button>
            </div>
          </aside>
        </div>

        <section className="mt-8 bg-[#efefef] border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-gray-700">Propostas ({displayProposalCount})</h3>
            <select
              value={proposalFilter}
              onChange={(e) => setProposalFilter(e.target.value as typeof proposalFilter)}
              className="border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Todas">Todas</option>
              <option value="Aceita">Aceita</option>
              <option value="Recusada">Rejeitadas</option>
              <option value="Pendente">Aguardando avaliação</option>
            </select>
          </div>

          <div className="divide-y divide-gray-200 bg-white">
            {visibleProposals.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">Nenhuma proposta foi encontrada.</p>
            ) : (
              visibleProposals.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-500">Foto</div>
                    <div className="flex-1">
                      <Link to={`/user/${p.freelancerId}`} className="text-99blue font-medium hover:text-99blue capitalize">
                        {p.freelancerName.toLowerCase()}
                      </Link>
                      <div className="text-xs text-gray-400 mb-1">
                         (Sem avaliações)
                      </div>
                      <p className="text-sm text-gray-600">
                        Submetido: {relativePublishedAt(p.createdAt)} | Oferta: <strong>{user?.type === 'client' || user?.id === p.freelancerId ? p.value : 'Privado'}</strong> | Duração estimada: <strong>{user?.type === 'client' || user?.id === p.freelancerId ? p.deliveryDays : 'Privado'}</strong> | {proposalStatusLabel(p.status)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded shadow p-5">
            <h3 className="text-gray-800 font-semibold mb-3">Denunciar projeto</h3>
            <label className="block text-sm text-gray-600 mb-2">Motivo</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm mb-4"
            >
              <option value="">Selecione um motivo...</option>
              <option value="Conteúdo impróprio">Conteúdo impróprio</option>
              <option value="Conteúdo ofensivo">Conteúdo ofensivo</option>
              <option value="Spam">Spam</option>
              <option value="Outro motivo">Outro motivo</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 border border-gray-300 text-sm">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReportProject}
                disabled={!reportReason}
                className="px-4 py-2 bg-99accent text-white text-sm disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

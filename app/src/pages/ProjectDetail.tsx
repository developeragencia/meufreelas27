import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Menu, Star, X } from 'lucide-react';
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
};

const TARGET_ID = '8c5870363bc9ca76312b3b530fbb6cdf7363';

const targetProjectSeed: ProjectView = {
  id: TARGET_ID,
  title: 'Atendimento ao cliente via WhatsApp por 1 hora',
  description:
    'Olá! Se você é um profissional com excelente comunicação escrita e busca uma renda extra garantida, segura e que tome pouco tempo do seu dia, preste muita atenção neste projeto.\n\nA atuação é de apenas 1 hora por dia.\n\nSomos uma empresa em crescimento no setor de serviços e estamos buscando um(a) especialista em atendimento para ser a "voz" da nossa marca no WhatsApp.\n\nO que você vai fazer:\n• Responder mensagens de clientes e interessados de forma humanizada, empática e ágil.\n• Esclarecer dúvidas frequentes utilizando nossos materiais de apoio e roteiros.\n• Fazer a triagem de contatos e direcionar problemas complexos para a nossa equipe interna.\n\nO que nós esperamos de você:\n• Português impecável: gramática, ortografia e pontuação corretas são inegociáveis.\n• Empatia e simpatia.\n• Capacidade de contornar objeções com educação e acolher o cliente.',
  category: 'Atendimento ao Consumidor',
  subcategory: 'Atendimento ao Consumidor',
  budget: 'Aberto',
  experienceLevel: 'Iniciante',
  visibility: 'Público',
  proposals: 473,
  interested: 512,
  minOffer: 'R$ 100,00',
  clientName: 'Frederico F.',
  clientId: 'client_demo',
};

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
    minOffer: 'R$ 100,00',
    clientName: p.clientName || 'Cliente',
    clientId: p.clientId,
  };
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

  useEffect(() => {
    async function load() {
      if (!id) {
        setProject(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      if (id === TARGET_ID) {
        setProject(targetProjectSeed);
      } else if (hasApi()) {
        const res = await apiGetProject(id);
        if (res.ok && res.project) {
          setProject(mapProject(res.project));
        } else {
          setProject(null);
        }
      } else {
        setProject(null);
      }

      if (hasApi()) {
        const proposalRes = await apiListProposals({ projectId: id });
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
    if (project.id === TARGET_ID) return Math.max(project.proposals, visibleProposals.length);
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

  const proposalHref = !project
    ? '/login'
    : !isAuthenticated
      ? '/login'
      : user?.type === 'freelancer'
        ? `/project/bid/${project.id}`
        : '/freelancer/dashboard';

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
      <header className="bg-99blue text-white">
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
            <h1 className="text-4xl font-light text-gray-800 leading-tight">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-2">ontem às 19:20</p>

            <h2 className="text-3xl font-light text-gray-800 mt-6 mb-3">Descrição do Projeto:</h2>
            <p className="text-gray-700 whitespace-pre-line leading-7">{project.description}</p>

            <div className="mt-8 text-sm text-gray-500 border-t pt-4">
              Atividades do cliente nesse projeto:
              <p className="mt-1"><strong>Última visualização:</strong> ontem às 19:40</p>
            </div>
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
                <div className="flex justify-between"><span>Valor Mínimo:</span><span>{project.minOffer}</span></div>
              </div>
            </div>

            <div className="bg-[#efefef] border border-gray-200 p-5 text-sm">
              <p className="text-gray-600">Cliente</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-300" />
                <div>
                  <p className="text-gray-800">{project.clientName}</p>
                  <div className="flex text-yellow-400 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
              <hr className="my-4" />
              <p className="text-gray-600 mb-2">Gerenciamento do projeto</p>
              <button className="block text-left text-gray-700 mb-1">Salvar</button>
              <button className="block text-left text-gray-700">Denunciar</button>
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
                    <div className="w-12 h-12 bg-gray-300 rounded" />
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{p.freelancerName}</p>
                      <div className="flex text-yellow-400 mt-1 mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Submetido: 10 horas atrás | Oferta: <strong>Privado</strong> | Duração estimada: <strong>Privado</strong> | {proposalStatusLabel(p.status)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

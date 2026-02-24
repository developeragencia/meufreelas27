import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronDown, ChevronUp, Menu, Search, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { apiListProjects, hasApi, type ApiProject } from '../lib/api';

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  level: 'Iniciante' | 'Intermediário' | 'Especialista';
  proposals: number;
  interested: number;
  publishedAt: string;
  createdAt: string;
  timeRemaining: string;
  tags: string[];
  skills: string[];
  clientName: string;
  clientId: string;
  clientRating: number;
  totalSpent: number;
};

const categories = [
  'Todas as categorias',
  'Administração & Contabilidade',
  'Advogados & Leis',
  'Atendimento ao Consumidor',
  'Design & Criação',
  'Educação & Consultoria',
  'Engenharia & Arquitetura',
  'Escrita',
  'Fotografia & AudioVisual',
  'Suporte Administrativo',
  'Tradução',
  'Vendas & Marketing',
  'Web, Mobile & Software',
];

function mapLevel(value?: string): ProjectCard['level'] {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'beginner' || normalized === 'iniciante') return 'Iniciante';
  if (normalized === 'expert' || normalized === 'especialista') return 'Especialista';
  return 'Intermediário';
}

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

function mapApiProject(p: ApiProject): ProjectCard {
  const titleLower = p.title.toLowerCase();
  const categoryLower = (p.category || '').toLowerCase();
  const tags: string[] = [];
  if (titleLower.includes('urgente')) tags.push('Projeto urgente');
  if (titleLower.includes('exclusivo') || categoryLower.includes('escrita')) tags.push('Projeto exclusivo');
  if (Number(p.proposals || 0) > 10) tags.push('Projeto destaque');

  const level = mapLevel(p.experienceLevel);
  const proposals = Number(p.proposals || 0);
  const interested = Math.max(proposals + 2, 0);
  const createdAt = p.createdAt || new Date().toISOString();
  const days = Number(p.proposalDays || 0);
  const timeRemaining = days > 0 ? `${days} dias` : '';

  return {
    id: p.id,
    title: p.title,
    description: p.description || '',
    category: p.category || 'Categoria',
    subcategory: p.category || 'Subcategoria',
    level,
    proposals,
    interested,
    publishedAt: relativePublishedAt(createdAt),
    createdAt,
    timeRemaining,
    tags,
    skills: Array.isArray(p.skills) ? p.skills.slice(0, 6) : [],
    clientName: p.clientName || 'Cliente',
    clientId: p.clientId,
    clientRating: 0,
    totalSpent: 0,
  };
}

export default function Projects() {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Todas as categorias');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<'any' | '24h' | '3d'>('any');
  const [rankingFilter, setRankingFilter] = useState<'any' | '5' | '4.5' | '4' | 'none'>('any');
  const [levelFilter, setLevelFilter] = useState<'all' | 'Iniciante' | 'Intermediário' | 'Especialista'>('all');
  const [sortBy, setSortBy] = useState<
    'relevance' | 'newest' | 'oldest' | 'alpha_asc' | 'alpha_desc' | 'proposals_high' | 'proposals_low' | 'interested_high' | 'interested_low'
  >('relevance');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (hasApi()) {
        const res = await apiListProjects({ status: 'Aberto', sortBy: 'recent' });
        if (!cancelled && res.ok && res.projects) {
          setProjects(res.projects.map(mapApiProject));
        }
      }
      if (!hasApi()) {
        try {
          const raw = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
          const list = Array.isArray(raw) ? raw : [];
          const mapped: ProjectCard[] = list.map((p: any) =>
            mapApiProject({
              id: String(p.id || ''),
              clientId: String(p.clientId || p.client_id || ''),
              clientName: String(p.clientName || 'Cliente'),
              title: String(p.title || ''),
              description: String(p.description || ''),
              budget: String(p.budget || 'Aberto'),
              category: String(p.category || ''),
              skills: Array.isArray(p.skills) ? p.skills : [],
              experienceLevel: String(p.experienceLevel || 'intermediate'),
              proposalDays: String(p.proposalDays || ''),
              visibility: 'public',
              status: 'Aberto',
              proposals: Number(p.proposals || 0),
              createdAt: String(p.createdAt || new Date().toISOString()),
              updatedAt: String(p.updatedAt || p.createdAt || new Date().toISOString()),
            })
          );
          setProjects(mapped);
        } catch {
          setProjects([]);
        }
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    let list = projects.filter((p) => {
      const k = keyword.trim().toLowerCase();
      const matchesKeyword =
        !k ||
        p.title.toLowerCase().includes(k) ||
        p.description.toLowerCase().includes(k) ||
        p.skills.some((s) => s.toLowerCase().includes(k));
      const matchesCategory = category === 'Todas as categorias' || p.category === category;
      const matchesFeatured = !featuredOnly || p.tags.some((t) => t.toLowerCase().includes('destaque'));
      const matchesUrgent = !urgentOnly || p.tags.some((t) => t.toLowerCase().includes('urgente'));
      const matchesLevel = levelFilter === 'all' || p.level === levelFilter;

      const created = new Date(p.createdAt).getTime();
      const now = Date.now();
      const diff = now - created;
      const matchesDate =
        dateFilter === 'any' ||
        (dateFilter === '24h' && diff <= 24 * 60 * 60 * 1000) ||
        (dateFilter === '3d' && diff <= 3 * 24 * 60 * 60 * 1000);

      const rating = p.clientRating;
      const matchesRanking =
        rankingFilter === 'any' ||
        (rankingFilter === 'none' && rating === 0) ||
        (rankingFilter === '5' && rating >= 5) ||
        (rankingFilter === '4.5' && rating >= 4.5) ||
        (rankingFilter === '4' && rating >= 4);

      return matchesKeyword && matchesCategory && matchesFeatured && matchesUrgent && matchesLevel && matchesDate && matchesRanking;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'newest' || sortBy === 'relevance') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'alpha_asc') return a.title.localeCompare(b.title, 'pt-BR');
      if (sortBy === 'alpha_desc') return b.title.localeCompare(a.title, 'pt-BR');
      if (sortBy === 'proposals_high') return b.proposals - a.proposals;
      if (sortBy === 'proposals_low') return a.proposals - b.proposals;
      if (sortBy === 'interested_high') return b.interested - a.interested;
      if (sortBy === 'interested_low') return a.interested - b.interested;
      return 0;
    });
    return list;
  }, [projects, keyword, category, featuredOnly, urgentOnly, dateFilter, rankingFilter, levelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, category, featuredOnly, urgentOnly, dateFilter, rankingFilter, levelFilter, sortBy]);

  const publishHref = !isAuthenticated ? '/login' : user?.type === 'client' ? '/project/new' : '/freelancer/dashboard';

  const Filters = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Palavras-chaves</label>
        <div className="flex">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 border border-gray-300 px-3 py-2 text-sm" placeholder="Ex. Projetos Web" />
          <button className="px-3 bg-99blue text-white text-sm">Ok</button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Categorias</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm">
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Tipo de projeto</label>
        <label className="flex items-center gap-2 text-sm text-gray-700 mb-1"><input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} /> Projetos em destaque</label>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} /> Projetos urgentes</label>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Data da publicação</label>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="w-full border border-gray-300 px-3 py-2 text-sm">
          <option value="any">Qualquer hora</option>
          <option value="24h">Menos de 24 horas atrás</option>
          <option value="3d">Menos de 3 dias atrás</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Ranking do cliente</label>
        <select value={rankingFilter} onChange={(e) => setRankingFilter(e.target.value as any)} className="w-full border border-gray-300 px-3 py-2 text-sm">
          <option value="any">Qualquer ranking</option>
          <option value="5">5 estrelas</option>
          <option value="4.5">Pelo menos 4.5 estrelas</option>
          <option value="4">Pelo menos 4 estrelas</option>
          <option value="none">Sem feedback</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Nível de experiência</label>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as any)} className="w-full border border-gray-300 px-3 py-2 text-sm">
          <option value="all">Todos os níveis de experiência</option>
          <option value="Iniciante">Iniciante</option>
          <option value="Intermediário">Intermediário</option>
          <option value="Especialista">Especialista</option>
        </select>
      </div>
      <button
        type="button"
        className="w-full bg-99blue text-white py-2 text-sm"
        onClick={() => {
          setKeyword('');
          setCategory('Todas as categorias');
          setFeaturedOnly(false);
          setUrgentOnly(false);
          setDateFilter('any');
          setRankingFilter('any');
          setLevelFilter('all');
          setSortBy('relevance');
        }}
      >
        Resetar Filtros
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" className="md:hidden p-2 -ml-2" onClick={() => setShowMobileMenu(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <BrandLogo to="/" heightClassName="h-10" darkBg />
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/">Página inicial</Link>
            <Link to="/projects">Projetos</Link>
            <Link to="/freelancers">Freelancers</Link>
            <Link to="/profile">Perfil</Link>
            <Link to="/account">Conta</Link>
            <Link to="/tools">Ferramentas</Link>
            <Link to="/ajuda">Ajuda</Link>
          </nav>
        </div>
      </header>

      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-white z-50 md:hidden shadow-xl">
            <div className="h-14 px-4 border-b flex items-center justify-between">
              <BrandLogo to="/" heightClassName="h-8" />
              <button type="button" onClick={() => setShowMobileMenu(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <Link to="/" className="block px-2 py-2 rounded hover:bg-gray-100" onClick={() => setShowMobileMenu(false)}>Página inicial</Link>
              <Link to="/projects" className="block px-2 py-2 rounded hover:bg-gray-100" onClick={() => setShowMobileMenu(false)}>Projetos</Link>
              <Link to="/freelancers" className="block px-2 py-2 rounded hover:bg-gray-100" onClick={() => setShowMobileMenu(false)}>Freelancers</Link>
            </nav>
          </aside>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-gray-800">Resultado da pesquisa</h1>
            <p className="text-sm text-gray-600 mt-1">{filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} foram encontrados</p>
          </div>
          <Link to={publishHref} className="w-full md:w-auto text-center bg-99blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded shadow-sm text-sm uppercase tracking-wide transition-colors">
            Publique um projeto. É grátis.
          </Link>
        </div>

        <div className="lg:hidden space-y-3 mb-6">
           <button 
             onClick={() => setShowMobileFilters(!showMobileFilters)} 
             className="w-full bg-white border border-gray-300 py-3 px-4 text-gray-700 font-bold text-left flex items-center justify-between rounded-sm shadow-sm hover:bg-gray-50 transition-colors"
           >
             <span className="flex items-center gap-2 text-sm uppercase"><span className="text-gray-400 font-normal text-lg leading-none">(+)</span> Filtros</span>
             {showMobileFilters ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
           </button>
           
           <div className="bg-white border border-gray-300 rounded-sm px-4 py-3 shadow-sm">
             <select 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value as any)}
               className="w-full border-none text-gray-700 text-sm focus:ring-0 cursor-pointer bg-transparent p-0 font-bold uppercase tracking-wide outline-none"
             >
                <option value="relevance">Relevância</option>
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="alpha_asc">Ordem alfabética (A-Z)</option>
                <option value="alpha_desc">Ordem alfabética (Z-A)</option>
                <option value="proposals_high">Número de propostas (Maior)</option>
                <option value="proposals_low">Número de propostas (Menor)</option>
                <option value="interested_high">Número de interessados (Maior)</option>
                <option value="interested_low">Número de interessados (Menor)</option>
             </select>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <aside className="hidden lg:block border border-gray-300 p-4 h-fit">
            <Filters />
          </aside>

          <section>
            {showMobileFilters && <div className="lg:hidden border border-gray-300 p-4 mb-4"><Filters /></div>}

            <div className="hidden lg:flex items-center justify-between mb-4">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border border-gray-300 px-3 py-2 text-sm">
                <option value="relevance">Relevância</option>
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="alpha_asc">Ordem alfabética (A-Z)</option>
                <option value="alpha_desc">Ordem alfabética (Z-A)</option>
                <option value="proposals_high">Número de propostas (Maior)</option>
                <option value="proposals_low">Número de propostas (Menor)</option>
                <option value="interested_high">Número de interessados (Maior)</option>
                <option value="interested_low">Número de interessados (Menor)</option>
              </select>
            </div>

            {loading ? (
              <div className="border border-gray-300 p-10 text-center text-gray-500">Carregando projetos...</div>
            ) : paginatedProjects.length === 0 ? (
              <div className="border border-gray-300 p-10 text-center text-gray-500">Nenhum projeto encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProjects.map((p) => {
                  const isExpanded = expanded.includes(p.id);
                  const desc = isExpanded ? p.description : p.description.slice(0, 150) + (p.description.length > 150 ? '...' : '');
                  return (
                    <article key={p.id} className="border border-gray-300 bg-white flex flex-col h-full hover:shadow-md transition-shadow">
                      <div className="p-4 border-b border-gray-100 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {p.tags.map((t) => (
                            <span key={t} className="text-[10px] uppercase font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm">{t}</span>
                          ))}
                          <span className="text-xs text-gray-400 ml-auto">{p.publishedAt}</span>
                        </div>
                        <Link to={`/project/${p.id}`} className="block text-lg md:text-xl font-semibold text-99blue hover:underline mb-2 leading-snug">
                          {p.title}
                        </Link>
                        <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{p.category}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                          <span>{p.level}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                          <span>Propostas: <strong>{p.proposals}</strong></span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {p.description}
                        </p>
                        {p.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.skills.slice(0, 4).map((s) => (
                              <span key={s} className="bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded">{s}</span>
                            ))}
                            {p.skills.length > 4 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded">+{p.skills.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <span className="truncate text-99blue font-medium capitalize">{p.clientName.toLowerCase()}</span>
                           {p.clientRating > 0 && <span className="text-yellow-500 text-xs">★ {p.clientRating.toFixed(1)}</span>}
                        </div>
                        <Link to={`/project/${p.id}`} className="text-99blue font-medium hover:underline whitespace-nowrap">
                          Ver detalhes
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((v) => Math.max(1, v - 1))} className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-40">
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                  .map((page) => (
                    <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`border px-3 py-2 text-sm ${page === currentPage ? 'bg-99blue text-white border-99blue' : 'border-gray-300'}`}>
                      {page}
                    </button>
                  ))}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((v) => Math.min(totalPages, v + 1))} className="border border-gray-300 px-3 py-2 text-sm disabled:opacity-40">
                  Próxima
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-99dark text-white py-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-300">
          @2014-2026 MeuFreelas. Todos os direitos reservados.
          <div className="mt-2">
            <Link to="/termos" className="hover:text-white">Termos de uso</Link> | <Link to="/privacidade" className="hover:text-white">Política de privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

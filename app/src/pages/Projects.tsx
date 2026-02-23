import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiListProjects, hasApi } from '../lib/api';
import { Search, ChevronDown, ChevronUp, Clock, FileText, Menu, X, Home, Briefcase, User, MessageSquare, LogOut, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  level: 'Iniciante' | 'Intermediário' | 'Especialista';
  publishedAt: string;
  timeRemaining: string;
  proposals: number;
  interested: number;
  description: string;
  clientName: string;
  clientUsername: string;
  clientRating?: number;
  clientReviews?: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
  budget?: string;
  status: string;
  createdAt?: string;
}

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
  'Web, Mobile & Software'
];

const levels = [
  { value: 'all', label: 'Todos os níveis' },
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Especialista', label: 'Especialista' }
];

const dateOptions = [
  { value: 'any', label: 'Qualquer hora' },
  { value: '24h', label: 'Menos de 24h' },
  { value: '3d', label: 'Menos de 3 dias' }
];

const clientRankingOptions = [
  { value: 'any', label: 'Qualquer ranking' },
  { value: '5', label: '5 estrelas' },
  { value: '4.5', label: '4.5+ estrelas' },
  { value: '4', label: '4+ estrelas' },
  { value: 'none', label: 'Sem feedback' }
];

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'proposals_high', label: 'Mais propostas' },
  { value: 'proposals_low', label: 'Menos propostas' },
  { value: 'interested_high', label: 'Mais interessados' },
  { value: 'interested_low', label: 'Menos interessados' }
];

function mapExperienceLevel(level?: string): Project['level'] {
  if (!level) return 'Intermediário';
  const l = String(level).toLowerCase();
  if (l === 'beginner' || l === 'iniciante') return 'Iniciante';
  if (l === 'expert' || l === 'especialista') return 'Especialista';
  return 'Intermediário';
}

function formatPublishedAt(createdAt?: string): string {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Publicado hoje';
    if (diffDays === 1) return 'Publicado ontem';
    if (diffDays < 7) return `Publicado há ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return 'Publicado';
  }
}

function loadProjectsFromStorage(): Project[] {
  try {
    const raw = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    return raw.map((p: any) => ({
      id: p.id || '',
      title: p.title || '',
      category: p.category || 'Outra Categoria',
      subcategory: p.subcategory,
      level: mapExperienceLevel(p.experienceLevel),
      publishedAt: p.createdAt ? formatPublishedAt(p.createdAt) : '',
      timeRemaining: '',
      proposals: 0,
      interested: 0,
      description: p.description || '',
      clientName: p.clientName || 'Cliente',
      clientUsername: p.clientUsername || '',
      isFeatured: false,
      isUrgent: false,
      budget: p.budget,
      status: 'Aberto',
      createdAt: p.createdAt,
    }));
  } catch {
    return [];
  }
}

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Briefcase, label: 'Projetos', href: '/projects' },
  { icon: User, label: 'Freelancers', href: '/freelancers' },
  { icon: MessageSquare, label: 'Mensagens', href: '/messages' },
];

export default function Projects() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as categorias');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('any');
  const [selectedClientRanking, setSelectedClientRanking] = useState('any');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (hasApi()) {
        const res = await apiListProjects({
          status: 'Aberto',
          search: keywords.trim() || undefined,
          category: selectedCategory !== 'Todas as categorias' ? selectedCategory : undefined,
          sortBy: sortBy === 'newest' ? 'recent' : 'relevance',
        });
        if (cancelled) return;
        if (res.ok && res.projects) {
          const list: Project[] = res.projects
            .filter((p) => p.status === 'Aberto')
            .map((p) => ({
              id: p.id,
              title: p.title,
              category: p.category || 'Outra Categoria',
              subcategory: undefined,
              level: mapExperienceLevel(p.experienceLevel),
              publishedAt: formatPublishedAt(p.createdAt),
              timeRemaining: p.proposalDays ? `Prazo: ${p.proposalDays} dias` : '',
              proposals: p.proposals ?? 0,
              interested: 0,
              description: p.description || '',
              clientName: p.clientName || 'Cliente',
              clientUsername: p.clientId,
              isFeatured: false,
              isUrgent: false,
              budget: p.budget,
              status: p.status,
              createdAt: p.createdAt,
            }));
          setProjects(list);
        } else {
          setProjects(loadProjectsFromStorage());
        }
      } else {
        setProjects(loadProjectsFromStorage());
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [keywords, selectedCategory, sortBy]);

  const publishProjectHref = !isAuthenticated
    ? '/login'
    : user?.type === 'client'
      ? '/project/new'
      : '/freelancer/dashboard';

  const toggleExpand = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const filteredProjects = useMemo(() => {
    let list = projects.filter((project) => {
      const matchesCategory = selectedCategory === 'Todas as categorias' || project.category === selectedCategory;
      const matchesFeatured = !featuredOnly || project.isFeatured;
      const matchesUrgent = !urgentOnly || project.isUrgent;
      const matchesLevel = selectedLevel === 'all' || project.level === selectedLevel;
      const ranking = Number(project.clientRating ?? 0);
      const matchesRanking =
        selectedClientRanking === 'any' ||
        (selectedClientRanking === 'none' && !project.clientRating) ||
        (selectedClientRanking === '5' && ranking >= 5) ||
        (selectedClientRanking === '4.5' && ranking >= 4.5) ||
        (selectedClientRanking === '4' && ranking >= 4);

      let matchesDate = true;
      if (selectedDate !== 'any' && project.createdAt) {
        const createdTime = new Date(project.createdAt).getTime();
        const now = Date.now();
        const diff = now - createdTime;
        if (selectedDate === '24h') matchesDate = diff <= 24 * 60 * 60 * 1000;
        if (selectedDate === '3d') matchesDate = diff <= 3 * 24 * 60 * 60 * 1000;
      }

      return matchesCategory && matchesFeatured && matchesUrgent && matchesLevel && matchesRanking && matchesDate;
    });
    list = [...list].sort((a, b) => {
      const t1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const t2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const p1 = a.proposals ?? 0;
      const p2 = b.proposals ?? 0;
      const i1 = a.interested ?? 0;
      const i2 = b.interested ?? 0;
      if (sortBy === 'newest' || sortBy === 'relevance') return t2 - t1;
      if (sortBy === 'oldest') return t1 - t2;
      if (sortBy === 'proposals_high') return p2 - p1;
      if (sortBy === 'proposals_low') return p1 - p2;
      if (sortBy === 'interested_high') return i2 - i1;
      if (sortBy === 'interested_low') return i1 - i2;
      return 0;
    });
    return list;
  }, [projects, selectedCategory, featuredOnly, urgentOnly, selectedLevel, selectedClientRanking, selectedDate, sortBy]);

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
  }, [keywords, selectedCategory, featuredOnly, urgentOnly, selectedDate, selectedClientRanking, selectedLevel, sortBy]);

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  const FilterContent = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chaves</label>
        <div className="flex">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
            placeholder="Ex: design, logo..."
          />
          <button className="px-3 py-2 bg-99blue text-white rounded-r-lg hover:bg-99blue-light text-sm">Ok</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de projeto</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} className="w-4 h-4 text-99blue rounded" />
            <span className="ml-2 text-gray-600 text-sm">Projetos em destaque</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} className="w-4 h-4 text-99blue rounded" />
            <span className="ml-2 text-gray-600 text-sm">Projetos urgentes</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Data da publicação</label>
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Ranking do cliente</label>
        <select value={selectedClientRanking} onChange={(e) => setSelectedClientRanking(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {clientRankingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Nível de experiência</label>
        <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {levels.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <button onClick={() => { setKeywords(''); setSelectedCategory('Todas as categorias'); setFeaturedOnly(false); setUrgentOnly(false); setSelectedDate('any'); setSelectedClientRanking('any'); setSelectedLevel('all'); setSortBy('relevance'); setCurrentPage(1); }} className="w-full py-2 text-99blue hover:underline text-sm">Resetar Filtros</button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header with Mobile Menu */}
      <header className="bg-99dark text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="text-xl md:text-2xl font-bold">meu<span className="font-light">freelas</span></Link>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                <input type="text" placeholder="Buscar..." className="bg-transparent text-white placeholder-gray-400 outline-none w-48" />
              </div>
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <button type="button" onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 text-white hover:text-white/90">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center"><User className="w-5 h-5" /></div>}
                    <span className="text-sm">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 animate-fade-in">
                        <Link to={user.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>Dashboard</Link>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>Meu perfil</Link>
                        <Link to="/freelancers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>Freelancers</Link>
                        <Link to="/projects" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowUserMenu(false)}>Projetos</Link>
                        <button type="button" onClick={() => { setShowUserMenu(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><LogOut className="w-4 h-4 mr-2" /> Sair</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white hidden sm:block text-sm">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white hidden sm:block text-sm">Cadastre-se</Link>
                </>
              )}
              <Link to={publishProjectHref} className="px-3 md:px-4 py-2 bg-99blue rounded-lg hover:bg-sky-400 text-sm">Publicar</Link>
            </div>
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
              <button onClick={() => setShowMobileMenu(false)} className="p-2 text-white"><X className="w-6 h-6" /></button>
            </div>
            <nav className="p-4">
              {menuItems.map((item, i) => (
                <Link key={i} to={item.href} className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100" onClick={() => setShowMobileMenu(false)}>
                  <item.icon className="w-5 h-5 mr-3" />{item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Results Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-gray-600 text-sm">Resultado da pesquisa</p>
              <p className="text-xl md:text-2xl font-semibold text-gray-900">{filteredProjects.length.toLocaleString()} projeto{filteredProjects.length !== 1 && 's'} encontrados</p>
            </div>
            <Link to={publishProjectHref} className="px-4 md:px-6 py-2 md:py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium text-sm text-center">Publique um projeto</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm text-gray-700 font-medium">
            {showMobileFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {showMobileFilters ? 'Fechar filtros' : 'Mostrar filtros'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20">
              <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
              <FilterContent />
            </div>
          </div>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="lg:hidden bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
              <FilterContent />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort */}
            <div className="flex items-center justify-between mb-4">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-99blue mb-4" />
                  <p className="font-medium">Carregando projetos...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhum projeto encontrado</p>
                  <p className="text-sm mt-1">Ajuste os filtros ou publique um projeto.</p>
                </div>
              ) : paginatedProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <Link to={`/project/${project.id}`} className="text-base md:text-lg font-semibold text-99blue hover:underline block mb-2">{project.title}</Link>
                  
                  {/* Meta Info - Mobile friendly */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:text-sm text-gray-500 mb-3">
                    <span className="text-gray-700 font-medium">{project.category}</span>
                    {project.subcategory && <><span className="hidden sm:inline">|</span><span>{project.subcategory}</span></>}
                    <span className="hidden sm:inline">|</span>
                    <span className="text-gray-700">{project.level}</span>
                    {project.budget && <><span className="hidden sm:inline">|</span><span className="text-green-700 font-medium">{project.budget}</span></>}
                    <span className="hidden sm:inline">|</span>
                    <span>{project.publishedAt}</span>
                    {project.timeRemaining && <><span className="hidden sm:inline">|</span><span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{project.timeRemaining}</span></>}
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />{project.proposals} propostas</span>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <p className={`text-gray-600 text-sm ${expandedProjects.includes(project.id) ? '' : 'line-clamp-2'}`}>{project.description}</p>
                    {project.description.length > 100 && (
                      <button onClick={() => toggleExpand(project.id)} className="text-99blue text-sm hover:underline mt-1 flex items-center">
                        {expandedProjects.includes(project.id) ? <><ChevronUp className="w-4 h-4 mr-1" /> Recolher</> : <><ChevronDown className="w-4 h-4 mr-1" /> Expandir</>}
                      </button>
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <Link to={`/user/${project.clientUsername}`} className="text-99blue hover:underline text-sm font-medium">{project.clientName}</Link>
                    {project.clientRating ? (
                      <span className="text-sm text-yellow-500">{renderStars(project.clientRating)} ({project.clientReviews})</span>
                    ) : (
                      <span className="text-sm text-gray-400">(Sem feedback)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredProjects.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                        currentPage === page ? 'bg-99blue text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-99dark text-white py-6 md:py-8 mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2014-2026 meuFreelas. Todos os direitos reservados.</p>
          <div className="flex justify-center space-x-4 mt-4 text-xs md:text-sm">
            <Link to="/termos" className="text-gray-400 hover:text-white">Termos de uso</Link>
            <span className="text-gray-600">|</span>
            <Link to="/privacidade" className="text-gray-400 hover:text-white">Política de privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

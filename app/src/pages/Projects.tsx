import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Clock, Users, FileText, Menu, X, Home, Briefcase, User, MessageSquare } from 'lucide-react';

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

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Desenvolvimento de DApp e aplicações Web3 (Blockchain)',
    category: 'Web, Mobile & Software',
    subcategory: 'Desenvolvimento Web',
    level: 'Especialista',
    publishedAt: '21 horas atrás',
    timeRemaining: '14 dias e 2 horas',
    proposals: 10,
    interested: 17,
    description: 'Procuramos programador(a) Web3/DApp/Blockchain (cripto). Estamos em busca de um(a) desenvolvedor(a) apaixonado(a) por tecnologia descentralizada para participar da construção de uma aplicação Web3 inovadora.',
    clientName: 'Wagner Q.',
    clientUsername: 'wagner-quintana',
    isFeatured: true
  },
  {
    id: '2',
    title: 'Assistente virtual e auxiliar administrativo remoto',
    category: 'Suporte Administrativo',
    subcategory: 'Assistente Virtual',
    level: 'Iniciante',
    publishedAt: '2 dias atrás',
    timeRemaining: '27 dias e 23 horas',
    proposals: 841,
    interested: 884,
    description: 'Olá! Estamos em busca de um(a) profissional organizado(a), proativo(a) e com excelente comunicação escrita para atuar como assistente administrativo remoto.',
    clientName: 'Frederico F.',
    clientUsername: 'frederico-freitas'
  },
  {
    id: '3',
    title: 'Edição de mini VSL (5–6 min) para nicho nutra feminino 35+',
    category: 'Fotografia & AudioVisual',
    subcategory: 'Vídeo - Edição',
    level: 'Iniciante',
    publishedAt: '26 minutos atrás',
    timeRemaining: '2 dias e 23 horas',
    proposals: 2,
    interested: 3,
    description: 'Olá! Estou procurando um editor experiente em VSL (Video Sales Letter) para editar uma mini VSL de aproximadamente 5 a 6 minutos.',
    clientName: 'Cliente',
    clientUsername: 'cliente-anonimo',
    clientRating: 4,
    clientReviews: 4
  },
  {
    id: '4',
    title: 'Planejamento comercial e execução de vendas',
    category: 'Vendas & Marketing',
    subcategory: 'Comercial',
    level: 'Intermediário',
    publishedAt: '54 minutos atrás',
    timeRemaining: '2 dias e 23 horas',
    proposals: 1,
    interested: 3,
    description: 'Desenvolvimento e implementação de um plano comercial estruturado, com foco no aumento de faturamento.',
    clientName: 'Cliente',
    clientUsername: 'cliente-anonimo'
  },
  {
    id: '5',
    title: 'Cadastro de produtos em sistema de estoque (Bling)',
    category: 'Suporte Administrativo',
    subcategory: 'Entrada de Dados',
    level: 'Intermediário',
    publishedAt: '1 hora atrás',
    timeRemaining: '14 dias e 22 horas',
    proposals: 12,
    interested: 25,
    description: 'Organização e cadastro de estoque de produtos, incluindo itens com variação. Experiência no sistema Bling.',
    clientName: 'Cliente',
    clientUsername: 'cliente-anonimo',
    clientRating: 5,
    clientReviews: 2
  }
];

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Briefcase, label: 'Projetos', href: '/projects' },
  { icon: User, label: 'Freelancers', href: '/freelancers' },
  { icon: MessageSquare, label: 'Mensagens', href: '/messages' },
];

export default function Projects() {
  const [projects] = useState<Project[]>(mockProjects);
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

  const toggleExpand = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const filteredProjects = projects.filter(project => {
    const matchesKeywords = !keywords || 
      project.title.toLowerCase().includes(keywords.toLowerCase()) ||
      project.description.toLowerCase().includes(keywords.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas as categorias' || project.category === selectedCategory;
    const matchesFeatured = !featuredOnly || project.isFeatured;
    const matchesUrgent = !urgentOnly || project.isUrgent;
    const matchesLevel = selectedLevel === 'all' || project.level === selectedLevel;
    
    return matchesKeywords && matchesCategory && matchesFeatured && matchesUrgent && matchesLevel;
  });

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

      <button onClick={() => { setKeywords(''); setSelectedCategory('Todas as categorias'); setFeaturedOnly(false); setUrgentOnly(false); setSelectedDate('any'); setSelectedClientRanking('any'); setSelectedLevel('all'); setSortBy('relevance'); }} className="w-full py-2 text-99blue hover:underline text-sm">Resetar Filtros</button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
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
              <Link to="/login" className="text-gray-300 hover:text-white hidden sm:block text-sm">Login</Link>
              <Link to="/register" className="text-gray-300 hover:text-white hidden sm:block text-sm">Cadastre-se</Link>
              <Link to="/project/new" className="px-3 md:px-4 py-2 bg-99blue rounded-lg hover:bg-sky-400 text-sm">Publicar</Link>
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
            <Link to="/project/new" className="px-4 md:px-6 py-2 md:py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium text-sm text-center">Publique um projeto</Link>
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
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <Link to={`/project/${project.id}`} className="text-base md:text-lg font-semibold text-99blue hover:underline block mb-2">{project.title}</Link>
                  
                  {/* Meta Info - Mobile friendly */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:text-sm text-gray-500 mb-3">
                    <span className="text-gray-700 font-medium">{project.category}</span>
                    {project.subcategory && <><span className="hidden sm:inline">|</span><span>{project.subcategory}</span></>}
                    <span className="hidden sm:inline">|</span>
                    <span className="text-gray-700">{project.level}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>{project.publishedAt}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{project.timeRemaining}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />{project.proposals} propostas</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{project.interested} interessados</span>
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

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
                <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">Nenhum projeto encontrado</h3>
                <p className="text-gray-500 text-sm">Tente ajustar os filtros ou buscar por outros termos.</p>
              </div>
            )}

            {/* Pagination */}
            {filteredProjects.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                <button className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg bg-99blue text-white text-sm">1</button>
                <button className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm">2</button>
                <button className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm">3</button>
                <span className="px-2 text-sm">...</span>
                <button className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm">Última</button>
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronDown, ChevronUp, Briefcase, ThumbsUp, Calendar, Crown, Star, Menu, X, User, LogOut } from 'lucide-react';

interface Freelancer {
  id: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  completedProjects: number;
  recommendations: number;
  memberSince: string;
  ranking?: number;
  isPremium: boolean;
  hasPhoto: boolean;
}

const areasOfInterest = [
  'Todas as áreas',
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

const rankingOptions = [
  { value: 'any', label: 'Qualquer ranking' },
  { value: '5', label: '5 estrelas' },
  { value: '4.5', label: 'Pelo menos 4.5 estrelas' },
  { value: '4', label: 'Pelo menos 4 estrelas' },
  { value: 'none', label: 'Sem feedback' }
];

const recommendationsOptions = [
  { value: 'any', label: 'Qualquer quantidade' },
  { value: '5', label: 'Pelo menos 5' },
  { value: '10', label: 'Pelo menos 10' },
  { value: '15', label: 'Pelo menos 15' }
];

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'rating_high', label: 'Ranking (Maior)' },
  { value: 'rating_low', label: 'Ranking (Menor)' },
  { value: 'alpha_asc', label: 'Ordem alfabética (A-Z)' },
  { value: 'alpha_desc', label: 'Ordem alfabética (Z-A)' },
  { value: 'projects_high', label: 'Projetos concluídos (Maior)' },
  { value: 'projects_low', label: 'Projetos concluídos (Menor)' },
  { value: 'rec_high', label: 'Recomendações (Maior)' },
  { value: 'rec_low', label: 'Recomendações (Menor)' }
];

function loadFreelancersFromStorage(): Freelancer[] {
  try {
    const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
    return users
      .filter((u: any) => u.type === 'freelancer' || u.hasFreelancerAccount)
      .map((u: any, i: number) => ({
        id: u.id,
        name: u.name || '',
        username: (u.name || u.id).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || u.id,
        title: '',
        bio: u.bio || '',
        skills: Array.isArray(u.skills) ? u.skills : (u.skills ? [u.skills] : []),
        rating: Number(u.rating) || 0,
        totalReviews: 0,
        completedProjects: Number(u.completedProjects) || 0,
        recommendations: 0,
        memberSince: '',
        ranking: i + 1,
        isPremium: !!u.isPremium,
        hasPhoto: !!u.avatar,
      }));
  } catch {
    return [];
  }
}

export default function Freelancers() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [freelancers, setFreelancers] = useState<Freelancer[]>(() => loadFreelancersFromStorage());
  const [keywords, setKeywords] = useState('');
  useEffect(() => {
    setFreelancers(loadFreelancersFromStorage());
  }, []);
  const [selectedArea, setSelectedArea] = useState('Todas as áreas');
  const [selectedRanking, setSelectedRanking] = useState('any');
  const [selectedRecommendations, setSelectedRecommendations] = useState('any');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [expandedFreelancers, setExpandedFreelancers] = useState<string[]>([]);
  const [expandedSkills, setExpandedSkills] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleExpandBio = (id: string) => {
    setExpandedFreelancers(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const toggleExpandSkills = (id: string) => {
    setExpandedSkills(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesKeywords = !keywords || 
      freelancer.name.toLowerCase().includes(keywords.toLowerCase()) ||
      freelancer.title.toLowerCase().includes(keywords.toLowerCase()) ||
      freelancer.skills.some(s => s.toLowerCase().includes(keywords.toLowerCase()));
    
    const matchesArea = selectedArea === 'Todas as áreas';
    
    let matchesRanking = true;
    if (selectedRanking === '5') matchesRanking = freelancer.rating >= 5;
    else if (selectedRanking === '4.5') matchesRanking = freelancer.rating >= 4.5;
    else if (selectedRanking === '4') matchesRanking = freelancer.rating >= 4;
    else if (selectedRanking === 'none') matchesRanking = freelancer.rating === 0;
    
    let matchesRec = true;
    if (selectedRecommendations === '5') matchesRec = freelancer.recommendations >= 5;
    else if (selectedRecommendations === '10') matchesRec = freelancer.recommendations >= 10;
    else if (selectedRecommendations === '15') matchesRec = freelancer.recommendations >= 15;
    
    const matchesPhoto = !onlyWithPhoto || freelancer.hasPhoto;
    
    return matchesKeywords && matchesArea && matchesRanking && matchesRec && matchesPhoto;
  });

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />}
      </>
    );
  };

  const FilterContent = () => (
    <>
      {/* Keywords */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Palavras-chaves
        </label>
        <div className="flex">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
            placeholder="Ex: design, logo..."
          />
          <button className="px-4 py-2 bg-99blue text-white rounded-r-lg hover:bg-99blue-light text-sm">
            Ok
          </button>
        </div>
      </div>

      {/* Areas of Interest */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Áreas de interesse
        </label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
        >
          {areasOfInterest.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Ranking */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ranking
        </label>
        <select
          value={selectedRanking}
          onChange={(e) => setSelectedRanking(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
        >
          {rankingOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de recomendações
        </label>
        <select
          value={selectedRecommendations}
          onChange={(e) => setSelectedRecommendations(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
        >
          {recommendationsOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Other Filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Outros filtros
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={onlyWithPhoto}
            onChange={(e) => setOnlyWithPhoto(e.target.checked)}
            className="w-4 h-4 text-99blue rounded focus:ring-99blue"
          />
          <span className="ml-2 text-gray-600 text-sm">Somente freelancers com foto</span>
        </label>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => {
          setKeywords('');
          setSelectedArea('Todas as áreas');
          setSelectedRanking('any');
          setSelectedRecommendations('any');
          setOnlyWithPhoto(false);
          setSortBy('relevance');
        }}
        className="w-full py-2 text-99blue hover:underline text-sm"
      >
        Resetar Filtros
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  className="bg-transparent text-white placeholder-gray-400 outline-none w-48"
                />
              </div>
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-white hover:text-white/90"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}
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
                        <button type="button" onClick={() => { setShowUserMenu(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <LogOut className="w-4 h-4 mr-2" /> Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white hidden sm:block">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white hidden sm:block">Cadastre-se</Link>
                </>
              )}
              <Link to="/project/new" className="px-4 py-2 bg-99blue rounded-lg hover:bg-sky-400 text-sm md:text-base">
                Publicar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Results Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-gray-600 text-sm">Resultado da pesquisa</p>
              <p className="text-xl md:text-2xl font-semibold text-gray-900">
                {filteredFreelancers.length.toLocaleString()} freelancer{filteredFreelancers.length !== 1 && 's'} encontrados
              </p>
            </div>
            <Link 
              to="/project/new" 
              className="px-4 md:px-6 py-2 md:py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium text-sm md:text-base text-center"
            >
              Publique um projeto
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm text-gray-700 font-medium"
          >
            {showMobileFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {showMobileFilters ? 'Fechar filtros' : 'Mostrar filtros'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <FilterContent />
            </div>
          </div>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="lg:hidden bg-white rounded-lg shadow-sm p-4 mb-4">
              <FilterContent />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort */}
            <div className="flex items-center justify-between mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-99blue text-sm"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Freelancers List */}
            <div className="space-y-4">
              {filteredFreelancers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhum freelancer encontrado</p>
                  <p className="text-sm mt-1">Os freelancers cadastrados aparecerão aqui.</p>
                </div>
              ) : filteredFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  {/* Header Row - Name + Badge + Invite */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      {/* PREMIUM BADGE FIRST (onde estava o nome) */}
                      {freelancer.isPremium && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                            <Crown className="w-3 h-3 mr-1" />
                            Top Freelancer Plus
                          </span>
                        </div>
                      )}
                      
                      {/* NAME (onde estava o badge) */}
                      <Link 
                        to={`/user/${freelancer.username}`}
                        className="text-lg md:text-xl font-semibold text-99blue hover:underline"
                      >
                        {freelancer.name}
                      </Link>
                    </div>
                    
                    {/* Invite Button */}
                    <Link
                      to="/register/client"
                      className="px-4 md:px-6 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Convidar
                    </Link>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {renderStars(freelancer.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({freelancer.rating.toFixed(2)} - {freelancer.totalReviews.toLocaleString()} avaliações)
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 mb-3 text-xs md:text-sm text-gray-500">
                    {freelancer.ranking && (
                      <span className="flex items-center">
                        <Star className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 text-99blue" />
                        Ranking: <strong className="ml-1 text-gray-700">{freelancer.ranking}</strong>
                      </span>
                    )}
                    <span className="flex items-center">
                      <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      Projetos: <strong className="ml-1 text-gray-700">{freelancer.completedProjects.toLocaleString()}</strong>
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      Recomendações: <strong className="ml-1 text-gray-700">{freelancer.recommendations.toLocaleString()}</strong>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      Desde: <strong className="ml-1 text-gray-700">{freelancer.memberSince}</strong>
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-gray-800 font-medium text-sm md:text-base mb-2">{freelancer.title}</p>

                  {/* Bio */}
                  <div className="mb-3">
                    <p className={`text-gray-600 text-sm ${expandedFreelancers.includes(freelancer.id) ? '' : 'line-clamp-2'}`}>
                      {freelancer.bio}
                    </p>
                    <button
                      onClick={() => toggleExpandBio(freelancer.id)}
                      className="text-99blue text-sm hover:underline mt-1 flex items-center"
                    >
                      {expandedFreelancers.includes(freelancer.id) ? (
                        <><ChevronUp className="w-4 h-4 mr-1" /> Recolher</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Expandir</>
                      )}
                    </button>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(expandedSkills.includes(freelancer.id) ? freelancer.skills : freelancer.skills.slice(0, 4)).map((skill, idx) => (
                      <Link
                        key={idx}
                        to={`/freelancers?skill=${encodeURIComponent(skill)}`}
                        className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 text-xs md:text-sm rounded hover:bg-gray-200 transition-colors"
                      >
                        {skill}
                      </Link>
                    ))}
                    {freelancer.skills.length > 4 && (
                      <button
                        onClick={() => toggleExpandSkills(freelancer.id)}
                        className="px-2 md:px-3 py-1 text-99blue text-xs md:text-sm hover:underline"
                      >
                        {expandedSkills.includes(freelancer.id) ? '...menos' : '...'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredFreelancers.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
                <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">
                  Nenhum freelancer encontrado
                </h3>
                <p className="text-gray-500 text-sm">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredFreelancers.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                <button className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 bg-99blue text-white text-sm">1</button>
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

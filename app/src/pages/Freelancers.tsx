import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ChevronDown, ChevronUp, Filter, CheckCircle, Shield, Menu, X, User, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { apiListFreelancersPublic, hasApi, type ApiFreelancerPublic } from '../lib/api';

// --- Types ---

interface Freelancer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  bio: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  completedProjects: number;
  recommendations: number;
  memberSince: string;
  ranking: number;
  isPremium: boolean;
  isPro: boolean;
  isVerified: boolean;
  city?: string;
  state?: string;
  country?: string;
  isOnline?: boolean;
}

// --- Helpers ---

function mapApiFreelancer(f: ApiFreelancerPublic): Freelancer {
  return {
    id: f.id,
    name: f.name,
    username: f.username,
    avatar: f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=003366&color=fff`,
    title: f.title || 'Freelancer',
    bio: f.bio || '',
    skills: Array.isArray(f.skills) ? f.skills : [],
    rating: Number(f.rating) || 0,
    totalReviews: Number(f.totalReviews) || 0,
    completedProjects: Number(f.completedProjects) || 0,
    recommendations: Number(f.recommendations) || 0,
    memberSince: f.memberSince || f.registeredAt || new Date().toISOString(),
    ranking: f.ranking || 0,
    isPremium: !!f.isPremium,
    isPro: !!f.isPro,
    isVerified: !!f.isVerified,
    city: f.city,
    state: f.state,
    country: f.country,
    isOnline: f.isOnline,
  };
}

function formatDate(iso: string) {
  if (!iso) return 'Recente';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return 'Recente';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Recente';
  }
}

// --- Components ---

const StarRating = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
    <span className="text-xs text-gray-500 font-medium">({count})</span>
  </div>
);

const FilterSection = ({ title, children, isOpen = true }: { title: string; children: React.ReactNode; isOpen?: boolean }) => {
  const [open, setOpen] = useState(isOpen);
  return (
    <div className="border-b border-gray-100 last:border-0 py-4">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
};

// --- Main Page ---

const getFreelancerBadge = (completedProjects: number, rating: number) => {
  if (completedProjects >= 50 && rating >= 4.8) {
    return { label: 'Top Freelancer', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Shield };
  }
  if (completedProjects >= 20) {
    return { label: 'Avançado', color: 'text-yellow-700 bg-yellow-50 border-yellow-100', icon: Star };
  }
  if (completedProjects >= 5) {
    return { label: 'Intermediário', color: 'text-blue-700 bg-blue-50 border-blue-100', icon: Star };
  }
  return { label: 'Novo', color: 'text-green-700 bg-green-50 border-green-100', icon: User };
};

export default function Freelancers() {
  const { user, isAuthenticated } = useAuth();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Todas as áreas');
  const [ratingFilter, setRatingFilter] = useState('any');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let loadedFreelancers: Freelancer[] = [];

        if (hasApi()) {
          const res = await apiListFreelancersPublic();
          if (res.ok && res.freelancers) {
            loadedFreelancers = res.freelancers.map(mapApiFreelancer);
          } else if (res.error) {
            console.error("API Error:", res.error);
            // Don't show error to user immediately if we can fallback, but here we want to be honest if API fails
            // But let's try fallback first
          }
        } 
        
        // Fallback or Merge with Local (simulating hybrid data for demo/dev)
        if (loadedFreelancers.length === 0) {
           const localUsers = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
           const fls = localUsers.filter((u: any) => u.type === 'freelancer' || u.hasFreelancerAccount);
           if (fls.length > 0) {
             loadedFreelancers = fls.map((u: any) => mapApiFreelancer({ ...u, id: String(u.id) }));
           }
        }

        // Se o usuário estiver logado, atualiza seus dados na lista com os dados locais mais recentes
        if (user && user.id) {
          // Check if user is already in list, if not and is freelancer, add him
          const userInList = loadedFreelancers.find(f => String(f.id) === String(user.id));
          
          if (user.type === 'freelancer' && !userInList) {
             // Add current user to top if freelancer
             const currentUserFreelancer = mapApiFreelancer({
                id: user.id,
                name: user.name,
                username: user.email.split('@')[0], // fallback
                avatar: user.avatar || '',
                title: user.title || 'Freelancer',
                bio: user.bio || '',
                skills: user.skills || [],
                rating: 0,
                totalReviews: 0,
                completedProjects: 0,
                recommendations: 0,
                memberSince: new Date().toISOString(),
                isPremium: user.isPremium,
                isPro: user.isPro,
                isVerified: false,
                planTier: user.plan || 'free',
                hasPhoto: !!user.avatar,
                profileCompletion: 0,
                rankingScore: 0
             });
             loadedFreelancers = [currentUserFreelancer, ...loadedFreelancers];
          }

          loadedFreelancers = loadedFreelancers.map(f => {
            if (String(f.id) === String(user.id)) {
              let localProfile: any = {};
              try {
                localProfile = JSON.parse(localStorage.getItem(`profile_${user.id}`) || '{}');
              } catch {}

              return {
                ...f,
                name: user.name || f.name,
                avatar: user.avatar || f.avatar,
                title: localProfile.title || user.title || f.title,
                bio: localProfile.bio || user.bio || f.bio,
                skills: localProfile.skills || user.skills || f.skills,
                isPremium: user.isPremium,
                isPro: user.isPro
              };
            }
            return f;
          });
        }

        setFreelancers(loadedFreelancers);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar os freelancers. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    
    load();

    const handleProfileUpdate = () => load();
    window.addEventListener('meufreelas:profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('meufreelas:profile-updated', handleProfileUpdate);
    };
  }, [user]);

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(f => {
      const matchKeyword = !keyword || f.name.toLowerCase().includes(keyword.toLowerCase()) || f.title.toLowerCase().includes(keyword.toLowerCase()) || f.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()));
      const matchCategory = category === 'Todas as áreas' || f.skills.some(s => s.includes(category) || category.includes(s)); 
      const matchRating = ratingFilter === 'any' || (ratingFilter === '4.5' && f.rating >= 4.5) || (ratingFilter === '4' && f.rating >= 4);
      
      return matchKeyword && matchCategory && matchRating;
    });
  }, [freelancers, keyword, category, ratingFilter]);

  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFreelancers.slice(start, start + pageSize);
  }, [filteredFreelancers, currentPage]);

  const totalPages = Math.ceil(filteredFreelancers.length / pageSize);

  const publishHref = !isAuthenticated ? '/login' : user?.type === 'client' ? '/project/new' : '/freelancer/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-600">
       {/* Header */}
      <header className="bg-gray-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrandLogo to="/" heightClassName="h-8" darkBg />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link to="/projects" className="hover:text-white transition-colors">Projetos</Link>
            <Link to="/freelancers" className="text-white border-b-2 border-white h-16 flex items-center">Freelancers</Link>
            <Link 
              to={isAuthenticated ? (user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard') : '/login'}
              className="bg-white text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors font-semibold"
            >
              {isAuthenticated ? 'Minha Conta' : 'Entrar'}
            </Link>
          </nav>
        </div>
        
        {/* Secondary Navigation - Dark Gray */}
        <div className="hidden md:block bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-8 text-sm text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">Página inicial</Link>
            <Link to="/projects" className="hover:text-white transition-colors">Projetos</Link>
            <Link to="/freelancers" className="text-white font-medium">Freelancers</Link>
            <Link to="/profile" className="hover:text-white transition-colors">Perfil</Link>
            <Link to="/account" className="hover:text-white transition-colors">Conta</Link>
            <Link to="/tools" className="hover:text-white transition-colors">Ferramentas</Link>
            <Link to="/ajuda" className="hover:text-white transition-colors">Ajuda</Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden flex flex-col">
            <div className="px-6 h-16 border-b flex items-center justify-between bg-gray-50">
              <BrandLogo to="/" heightClassName="h-8" className="max-w-[140px]" />
              <button type="button" onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link to="/" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Página inicial</Link>
              <Link to="/projects" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Projetos</Link>
              <Link to="/freelancers" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-medium">Freelancers</Link>
              <div className="border-t border-gray-100 my-2 pt-2">
                <Link to="/profile" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Perfil</Link>
                <Link to="/account" onClick={() => setShowMobileMenu(false)} className="block px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Conta</Link>
              </div>
            </nav>
          </aside>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <div>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Encontre Freelancers</h1>
             <p className="text-gray-500 mt-1">{filteredFreelancers.length} profissionais encontrados</p>
           </div>
           <Link to={publishHref} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
             <User className="w-4 h-4" />
             Publicar Projeto Grátis
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className={`lg:col-span-1 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filtros</h3>
                <button 
                  onClick={() => { setKeyword(''); setCategory('Todas as áreas'); setRatingFilter('any'); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar
                </button>
              </div>

              <FilterSection title="Buscar">
                <div className="relative">
                  <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Nome, habilidade..." 
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </FilterSection>

              <FilterSection title="Categorias">
                  <div className="space-y-2">
                     {['Todas as áreas', 'Administração & Contabilidade', 'Advogados & Leis', 'Design & Criação', 'Engenharia & Arquitetura', 'Escrita', 'Vendas & Marketing', 'Web, Mobile & Software'].map((cat) => (
                       <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${category === cat ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                           {category === cat && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                         </div>
                         <span className={`text-sm ${category === cat ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat}</span>
                         <input type="radio" name="category" className="hidden" checked={category === cat} onChange={() => setCategory(cat)} />
                       </label>
                     ))}
                  </div>
              </FilterSection>

               <FilterSection title="Avaliação">
                   <div className="space-y-2">
                     {[
                       { value: 'any', label: 'Qualquer avaliação' },
                       { value: '4.5', label: '4.5 ou mais' },
                       { value: '4', label: '4.0 ou mais' }
                     ].map((opt) => (
                       <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${ratingFilter === opt.value ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                           {ratingFilter === opt.value && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                         </div>
                         <span className={`text-sm ${ratingFilter === opt.value ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{opt.label}</span>
                         <input type="radio" name="rating" className="hidden" checked={ratingFilter === opt.value} onChange={() => setRatingFilter(opt.value)} />
                       </label>
                     ))}
                   </div>
              </FilterSection>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
               <button 
                 onClick={() => setShowMobileFilters(!showMobileFilters)} 
                 className="w-full bg-white border border-gray-200 py-3 px-4 text-gray-700 font-semibold rounded-xl shadow-sm flex items-center justify-between"
               >
                 <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</span>
                 <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
               </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p>Carregando freelancers...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 rounded-xl border border-red-100 p-8 text-center text-red-600">
                  <p className="font-medium mb-2">Ops! Ocorreu um erro.</p>
                  <p className="text-sm mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="text-sm underline hover:text-red-800">Tentar novamente</button>
                </div>
              ) : paginatedFreelancers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">Nenhum freelancer encontrado</h3>
                  <p className="text-gray-500 text-sm">Tente ajustar seus filtros de busca.</p>
                </div>
              ) : (
                paginatedFreelancers.map((f) => (
                  <article key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    {f.isPremium && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-bl-full -mr-10 -mt-10"></div>}
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Avatar Column */}
                      <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                         <div className="relative">
                           <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                             <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                           </div>
                           {f.isOnline && <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>}
                           {f.isPremium && (
                             <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Premium">
                               <Star className="w-3 h-3 fill-white" />
                             </div>
                           )}
                         </div>
                         
                         <div className="mt-3 flex flex-col items-center md:items-start gap-1">
                            <StarRating rating={f.rating} count={f.totalReviews} />
                            <span className="text-xs text-gray-400">Desde {formatDate(f.memberSince).split('/')[2]}</span>
                         </div>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                              <Link to={`/user/${f.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors capitalize">
                                {f.name.toLowerCase()}
                              </Link>
                              {f.isVerified && <div title="Verificado"><CheckCircle className="w-4 h-4 text-blue-500" /></div>}
                            </div>
                            <h3 className="text-blue-600 font-medium text-sm">{f.title}</h3>
                          </div>
                          
                          {(() => {
                             const badge = getFreelancerBadge(f.completedProjects, f.rating);
                             const BadgeIcon = badge.icon;
                             return (
                               <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wide self-center md:self-start ${badge.color}`}>
                                 <BadgeIcon className="w-3 h-3" />
                                 {badge.label}
                               </div>
                             );
                          })()}
                        </div>

                        <div className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
                          {f.bio || <span className="italic text-gray-400">Sem descrição disponível.</span>}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                          {f.skills.slice(0, 5).map(skill => (
                            <span key={skill} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                              {skill}
                            </span>
                          ))}
                          {f.skills.length > 5 && (
                            <span className="text-xs text-gray-400 font-medium">+{f.skills.length - 5}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                           <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                             <div className="flex items-center gap-1">
                               <CheckCircle className="w-3.5 h-3.5" />
                               {f.completedProjects} projetos
                             </div>
                             {f.city && (
                               <div className="flex items-center gap-1">
                                 <MapPin className="w-3.5 h-3.5" />
                                 {f.city}
                               </div>
                             )}
                           </div>
                           
                           <Link to={`/user/${f.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                             Ver Perfil
                             <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                           </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            
             {totalPages > 1 && (
                <div className="flex justify-center mt-10 gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
             )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BrandLogo to="/" heightClassName="h-8" className="mx-auto mb-6" darkBg />
          <p className="text-gray-400 text-sm mb-6">Conectando profissionais talentosos a grandes oportunidades.</p>
          <div className="text-sm text-gray-500">
            © 2026 MeuFreelas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

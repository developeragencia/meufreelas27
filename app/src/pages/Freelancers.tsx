import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ChevronDown, ChevronUp, Filter, CheckCircle, Shield, Menu, X, User } from 'lucide-react';
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
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
    <span className="text-sm text-gray-600 font-medium">({rating.toFixed(2)} - {count} avaliações)</span>
  </div>
);

const FilterSection = ({ title, children, isOpen = true }: { title: string; children: React.ReactNode; isOpen?: boolean }) => {
  const [open, setOpen] = useState(isOpen);
  return (
    <div className="border border-gray-300 bg-white rounded-sm mb-4">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left font-bold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-4 border-t border-gray-200">{children}</div>}
    </div>
  );
};

// --- Main Page ---

const getFreelancerBadge = (completedProjects: number, rating: number) => {
  if (completedProjects >= 50 && rating >= 4.8) {
    return { label: 'Top Freelancer', color: 'text-purple-600', icon: Shield };
  }
  if (completedProjects >= 20) {
    return { label: 'Avançado', color: 'text-yellow-600', icon: Star };
  }
  if (completedProjects >= 5) {
    return { label: 'Intermediário', color: 'text-gray-600', icon: Star };
  }
  if (completedProjects >= 1) {
    return { label: 'Iniciante', color: 'text-blue-500', icon: User };
  }
  return { label: 'Novo', color: 'text-green-600', icon: User };
};

export default function Freelancers() {
  const { user, isAuthenticated } = useAuth();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      try {
        let loadedFreelancers: Freelancer[] = [];

        if (hasApi()) {
          const res = await apiListFreelancersPublic();
          if (res.ok && res.freelancers) {
            loadedFreelancers = res.freelancers.map(mapApiFreelancer);
          }
        } else {
          // Fallback to local storage or empty
          const localUsers = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
          const fls = localUsers.filter((u: any) => u.type === 'freelancer' || u.hasFreelancerAccount);
          loadedFreelancers = fls.map((u: any) => mapApiFreelancer({ ...u, id: String(u.id) }));
        }

        // Se o usuário estiver logado, atualiza seus dados na lista com os dados locais mais recentes
        if (user && user.id) {
          loadedFreelancers = loadedFreelancers.map(f => {
            if (String(f.id) === String(user.id)) {
              // Tenta recuperar dados estendidos do perfil local
              let localProfile: any = {};
              try {
                localProfile = JSON.parse(localStorage.getItem(`profile_${user.id}`) || '{}');
              } catch {}

              return {
                ...f,
                name: user.name || f.name,
                avatar: user.avatar || f.avatar,
                // Atualiza também outros campos se disponíveis localmente
                title: localProfile.title || f.title,
                bio: user.bio || localProfile.bio || f.bio,
                skills: user.skills || localProfile.skills || f.skills,
              };
            }
            return f;
          });
        }

        setFreelancers(loadedFreelancers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    load();

    // Listener para atualizações de perfil em tempo real
    const handleProfileUpdate = () => load();
    window.addEventListener('meufreelas:profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('meufreelas:profile-updated', handleProfileUpdate);
    };
  }, [user]);

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(f => {
      const matchKeyword = !keyword || f.name.toLowerCase().includes(keyword.toLowerCase()) || f.title.toLowerCase().includes(keyword.toLowerCase()) || f.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()));
      // const matchCategory = category === 'Todas as áreas' || f.skills.includes(category); // Naive category check
      const matchRating = ratingFilter === 'any' || (ratingFilter === '4.5' && f.rating >= 4.5) || (ratingFilter === '4' && f.rating >= 4);
      
      return matchKeyword && matchRating;
    });
  }, [freelancers, keyword, category, ratingFilter]);

  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFreelancers.slice(start, start + pageSize);
  }, [filteredFreelancers, currentPage]);

  const totalPages = Math.ceil(filteredFreelancers.length / pageSize);

  const publishHref = !isAuthenticated ? '/login' : user?.type === 'client' ? '/project/new' : '/freelancer/dashboard';

  return (
    <div className="min-h-screen bg-[#f2f2f2] font-sans text-gray-600">
       {/* Header */}
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
            <Link to="/freelancers" className="text-white font-semibold">Freelancers</Link>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl md:text-3xl font-light text-gray-800">Resultado da pesquisa</h1>
             <p className="text-sm mt-1">{filteredFreelancers.length} freelancers foram encontrados</p>
           </div>
           <Link to={publishHref} className="bg-99blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow-sm text-sm hidden md:block">
             Publique um projeto. É grátis.
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          
          {/* Sidebar Filters */}
          <aside className={`${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-gray-300 rounded-sm p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-2">Meus Filtros</h3>
              <p className="text-xs text-gray-500 mb-3">Você não tem nenhum filtro cadastrado</p>
              <div className="flex gap-2">
                 <input type="text" placeholder="Ex. Ilustradores..." className="w-full border border-gray-300 px-2 py-1 text-sm rounded-sm" />
                 <button className="bg-99blue text-white px-3 py-1 text-sm rounded-sm font-bold">Salvar</button>
              </div>
            </div>

            <FilterSection title="Palavras-chaves">
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ex. Web Designer, Redator..." 
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-99blue"
                />
                <button className="bg-99blue text-white px-3 rounded-sm hover:bg-blue-600 font-bold text-sm">
                  Ok
                </button>
              </div>
            </FilterSection>

            <FilterSection title="Áreas de interesse">
                <div className="space-y-1">
                   <button onClick={() => setCategory('Todas as áreas')} className={`block text-sm hover:underline ${category === 'Todas as áreas' ? 'font-bold text-99blue' : 'text-99blue'}`}>Todas as áreas</button>
                   <button onClick={() => setCategory('Administração & Contabilidade')} className="block text-sm text-99blue hover:underline">Administração & Contabilidade</button>
                   <button onClick={() => setCategory('Advogados & Leis')} className="block text-sm text-99blue hover:underline">Advogados & Leis</button>
                   <button onClick={() => setCategory('Design & Criação')} className="block text-sm text-99blue hover:underline">Design & Criação</button>
                   <button onClick={() => setCategory('Engenharia & Arquitetura')} className="block text-sm text-99blue hover:underline">Engenharia & Arquitetura</button>
                   <button onClick={() => setCategory('Escrita')} className="block text-sm text-99blue hover:underline">Escrita</button>
                   <button onClick={() => setCategory('Vendas & Marketing')} className="block text-sm text-99blue hover:underline">Vendas & Marketing</button>
                   <button onClick={() => setCategory('Web, Mobile & Software')} className="block text-sm text-99blue hover:underline">Web, Mobile & Software</button>
                </div>
            </FilterSection>

             <FilterSection title="Avaliação">
                 <div className="space-y-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === 'any'} onChange={() => setRatingFilter('any')} className="text-99blue" />
                     <span className="text-sm">Qualquer avaliação</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === '4.5'} onChange={() => setRatingFilter('4.5')} className="text-99blue" />
                     <span className="text-sm">4.5 ou mais</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === '4'} onChange={() => setRatingFilter('4')} className="text-99blue" />
                     <span className="text-sm">4.0 ou mais</span>
                   </label>
                 </div>
            </FilterSection>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters */}
            <div className="lg:hidden space-y-2 mb-4">
               <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full bg-white border border-gray-300 py-3 px-4 text-gray-700 font-bold text-left flex items-center justify-between rounded-sm shadow-sm hover:bg-gray-50">
                 <span className="flex items-center gap-2"><span className="text-gray-400 font-normal">(+)</span> Filtros</span>
               </button>
               
               <div className="bg-white border border-gray-300 rounded-sm px-4 py-3 shadow-sm">
                 <select className="w-full border-none text-gray-700 text-sm focus:ring-0 cursor-pointer bg-transparent p-0 font-medium">
                   <option>Relevância</option>
                   <option>Mais recentes</option>
                   <option>Melhor avaliação</option>
                 </select>
               </div>

               {/* Mobile Pagination (Top) */}
               {totalPages > 1 && (
                  <div className="flex justify-end gap-1 pt-2">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => (
                       <button
                         key={i}
                         onClick={() => setCurrentPage(i + 1)}
                         className={`w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors ${currentPage === i + 1 ? 'bg-white border-99blue text-99blue font-bold shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                       >
                         {i + 1}
                       </button>
                    ))}
                    {totalPages > 3 && <span className="flex items-center justify-center w-8 text-gray-400 text-xs">...</span>}
                     <button className="px-3 h-8 text-sm bg-white border border-gray-300 rounded-sm text-gray-600 hover:bg-gray-50 font-medium">Última</button>
                  </div>
               )}
            </div>

            {/* Desktop Sort Bar (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center justify-between mb-4 bg-white p-2 border border-gray-300 rounded-sm">
               <select className="border-none text-sm text-gray-700 focus:ring-0 cursor-pointer bg-transparent font-medium">
                 <option>Relevância</option>
                 <option>Mais recentes</option>
                 <option>Melhor avaliação</option>
               </select>

               {totalPages > 1 && (
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors ${currentPage === i + 1 ? 'bg-white border-gray-300 font-bold text-gray-800 shadow-sm' : 'bg-white border-transparent text-99blue hover:underline'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {totalPages > 5 && <span className="flex items-center text-gray-400">...</span>}
                    <button className="px-2 text-sm text-99blue hover:underline bg-white border border-gray-300 rounded-sm h-8 flex items-center font-medium">Última</button>
                  </div>
               )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-white border border-gray-300 p-12 text-center text-gray-500 rounded-sm shadow-sm">
                  Carregando freelancers...
                </div>
              ) : paginatedFreelancers.length === 0 ? (
                <div className="bg-white border border-gray-300 p-12 text-center text-gray-500 rounded-sm shadow-sm">
                  Nenhum freelancer encontrado com estes filtros.
                </div>
              ) : (
                paginatedFreelancers.map((f) => (
                  <article key={f.id} className="bg-white border border-gray-300 rounded-sm p-6 hover:shadow-md transition-shadow relative">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Avatar Column */}
                      <div className="flex-shrink-0 relative">
                         <div className="w-32 h-32 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-50 relative group shadow-sm mx-auto">
                           <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                         </div>
                         {f.isOnline && <div className="absolute bottom-2 right-1/2 translate-x-10 md:translate-x-0 md:right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 text-center md:text-left w-full">
                        {/* Name & Badges */}
                        <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 mb-1 justify-center md:justify-start">
                          <div className="flex items-center gap-1.5">
                            <Link to={`/user/${f.id}`} className="text-xl md:text-lg font-bold text-99blue hover:underline truncate capitalize">
                              {f.name.toLowerCase()}
                            </Link>
                            {f.isVerified && <CheckCircle className="w-5 h-5 md:w-4 md:h-4 text-blue-500 fill-white" />}
                            {f.isPremium && <span className="bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">PREMIUM</span>}
                            {f.isPro && !f.isPremium && <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">PROFISSIONAL</span>}
                          </div>
                        </div>

                        {/* Badge de Nível (baseado em metas) */}
                        {(() => {
                           const badge = getFreelancerBadge(f.completedProjects, f.rating);
                           const BadgeIcon = badge.icon;
                           return (
                             <div className="flex items-center justify-center md:justify-start gap-1.5 mb-3 md:mb-2">
                               <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                               <span className={`text-xs font-bold ${badge.color} uppercase tracking-wide`}>{badge.label}</span>
                             </div>
                           );
                        })()}

                        {/* Rating */}
                        <div className="flex justify-center md:justify-start mb-3 md:mb-2">
                           <StarRating rating={f.rating} count={f.totalReviews} />
                        </div>

                        {/* Stats Line */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-gray-500 mb-4 md:mb-3 leading-relaxed">
                           <span>Ranking: <strong className="text-gray-700">{f.ranking}</strong></span>
                           <span className="hidden md:inline text-gray-300">|</span>
                           <span>Projetos concluídos: <strong className="text-gray-700">{f.completedProjects}</strong></span>
                           <span className="hidden md:inline text-gray-300">|</span>
                           <span>Recomendações: <strong className="text-gray-700">{f.recommendations}</strong></span>
                           <span className="hidden md:inline text-gray-300">|</span>
                           <span>Registrado(a) desde: {formatDate(f.memberSince)}</span>
                        </div>

                        {/* Professional Title */}
                        <h3 className="font-bold text-gray-800 text-base md:text-sm mb-3 md:mb-2">{f.title}</h3>

                        {/* Description */}
                        <div className="text-sm text-gray-600 leading-relaxed mb-4 text-justify md:text-left">
                          {f.bio ? (
                            <>
                              {f.bio.length > 250 ? (
                                <>
                                  {f.bio.substring(0, 250)}... 
                                  <Link to={`/user/${f.id}`} className="text-99blue hover:underline ml-1 font-medium">Expandir</Link>
                                </>
                              ) : f.bio}
                            </>
                          ) : (
                            <span className="italic text-gray-400">Este freelancer ainda não adicionou uma descrição detalhada.</span>
                          )}
                        </div>

                        {/* Skills */}
                        {f.skills.length > 0 && (
                          <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {f.skills.map(skill => (
                              <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-sm border border-gray-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            
             {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-gray-300 bg-white rounded-sm hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-sm text-sm font-bold border ${currentPage === i + 1 ? 'bg-99blue text-white border-99blue' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-gray-300 bg-white rounded-sm hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600"
                  >
                    Próxima
                  </button>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

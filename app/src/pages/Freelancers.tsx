import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ChevronDown, ChevronUp, Filter, Check, X } from 'lucide-react';
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
  city?: string;
  state?: string;
  country?: string;
  isOnline?: boolean;
  lastLogin?: string;
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
    // city: f.city, // Not available in API yet
    // state: f.state, // Not available in API yet
    // country: f.country, // Not available in API yet
    // isOnline: f.isOnline, // Not available in API yet
  };
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
    <span className="text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>
    <span className="text-sm text-gray-400">({count})</span>
  </div>
);

const FilterSection = ({ title, children, isOpen = true }: { title: string; children: React.ReactNode; isOpen?: boolean }) => {
  const [open, setOpen] = useState(isOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-800 mb-2"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
};

// --- Main Page ---

export default function Freelancers() {
  const { user, isAuthenticated } = useAuth();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Todas as categorias');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [completedFilter, setCompletedFilter] = useState('any');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (hasApi()) {
          const res = await apiListFreelancersPublic();
          if (res.ok && res.freelancers) {
            setFreelancers(res.freelancers.map(mapApiFreelancer));
          }
        } else {
          // Fallback to local storage or empty
          const localUsers = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
          const fls = localUsers.filter((u: any) => u.type === 'freelancer' || u.hasFreelancerAccount);
          setFreelancers(fls.map((u: any) => mapApiFreelancer({ ...u, id: String(u.id) })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(f => {
      const matchKeyword = !keyword || f.name.toLowerCase().includes(keyword.toLowerCase()) || f.title.toLowerCase().includes(keyword.toLowerCase()) || f.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()));
      const matchRating = ratingFilter === 'any' || (ratingFilter === '4.5' && f.rating >= 4.5) || (ratingFilter === '4' && f.rating >= 4);
      // Add more filters as needed
      return matchKeyword && matchRating;
    });
  }, [freelancers, keyword, ratingFilter]);

  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFreelancers.slice(start, start + pageSize);
  }, [filteredFreelancers, currentPage]);

  const totalPages = Math.ceil(filteredFreelancers.length / pageSize);

  return (
    <div className="min-h-screen bg-[#f2f2f2] font-sans">
      {/* Header (Simplified to match general layout) */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <BrandLogo to="/" darkBg heightClassName="h-8" />
           <nav className="hidden md:flex gap-6 text-sm">
             <Link to="/projects" className="hover:text-99blue">Projetos</Link>
             <Link to="/freelancers" className="text-white font-semibold">Freelancers</Link>
             <Link to="/login" className="hover:text-99blue">{isAuthenticated ? 'Minha Conta' : 'Entrar'}</Link>
           </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Filters */}
          <aside className={`w-full md:w-64 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700">Filtros</h2>
                <button className="text-xs text-99blue hover:underline" onClick={() => {
                  setKeyword('');
                  setRatingFilter('any');
                }}>Limpar</button>
              </div>

              <FilterSection title="Palavras-chaves">
                <div className="flex">
                  <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Ex: PHP, Design..." 
                    className="w-full border border-gray-300 rounded-l px-3 py-2 text-sm focus:outline-none focus:border-99blue"
                  />
                  <button className="bg-99blue text-white px-3 rounded-r hover:bg-blue-600">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </FilterSection>

              <FilterSection title="Categoria">
                 <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 bg-white"
                 >
                   <option>Todas as categorias</option>
                   <option>Web, Mobile & Software</option>
                   <option>Design & Criação</option>
                   <option>Escrita</option>
                   <option>Vendas & Marketing</option>
                 </select>
              </FilterSection>

              <FilterSection title="Avaliação">
                 <div className="space-y-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === 'any'} onChange={() => setRatingFilter('any')} className="text-99blue" />
                     <span className="text-sm text-gray-600">Qualquer avaliação</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === '4.5'} onChange={() => setRatingFilter('4.5')} className="text-99blue" />
                     <span className="text-sm text-gray-600">4.5 ou mais</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="radio" name="rating" checked={ratingFilter === '4'} onChange={() => setRatingFilter('4')} className="text-99blue" />
                     <span className="text-sm text-gray-600">4.0 ou mais</span>
                   </label>
                 </div>
              </FilterSection>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-light text-gray-800">Freelancers</h1>
              <div className="md:hidden">
                <button 
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded text-sm text-gray-700"
                >
                  <Filter className="w-4 h-4" /> Filtros
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-white border border-gray-300 p-8 text-center text-gray-500">
                  Carregando freelancers...
                </div>
              ) : paginatedFreelancers.length === 0 ? (
                <div className="bg-white border border-gray-300 p-8 text-center text-gray-500">
                  Nenhum freelancer encontrado com estes filtros.
                </div>
              ) : (
                paginatedFreelancers.map((f) => (
                  <article key={f.id} className="bg-white border border-gray-300 hover:border-gray-400 transition-colors rounded-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Left/Top: Avatar & Basic Info */}
                    <div className="p-5 flex-1 flex gap-4">
                      <div className="flex-shrink-0">
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                           <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                         </div>
                         {f.isOnline && (
                           <div className="mt-2 text-xs text-center font-medium text-green-600">
                             ● Online
                           </div>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link to={`/user/${f.id}`} className="text-lg font-semibold text-99blue hover:underline truncate block">
                              {f.name}
                            </Link>
                            <p className="text-sm text-gray-600 mb-1">{f.title}</p>
                            <div className="flex items-center gap-4 mb-2">
                              <StarRating rating={f.rating} count={f.totalReviews} />
                              {(f.city || f.state) && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {[f.city, f.state].filter(Boolean).join('/')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Link 
                              to={`/user/${f.id}`} 
                              className="inline-block bg-99blue hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                            >
                              Ver perfil
                            </Link>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                            {f.bio || 'Este freelancer ainda não adicionou uma descrição.'}
                          </p>
                        </div>

                        {f.skills.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {f.skills.slice(0, 8).map(skill => (
                              <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                                {skill}
                              </span>
                            ))}
                            {f.skills.length > 8 && (
                              <span className="text-xs text-gray-500 self-center">+{f.skills.length - 8}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right/Bottom: Stats (Optional sidebar-like in desktop, stacked in mobile) */}
                    <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-4 md:w-48 flex flex-row md:flex-col justify-between md:justify-center gap-4 text-sm text-gray-600">
                      <div className="text-center md:text-left">
                        <span className="block font-bold text-gray-800 text-lg">{f.completedProjects}</span>
                        <span className="text-xs">Projetos concluídos</span>
                      </div>
                      <div className="text-center md:text-left">
                         <span className="block font-bold text-gray-800 text-lg">{f.recommendations}</span>
                         <span className="text-xs">Recomendações</span>
                      </div>
                      <div className="text-center md:text-left">
                         <span className="block font-bold text-gray-800 text-lg text-green-600">100%</span>
                         <span className="text-xs">No prazo</span>
                      </div>
                    </div>
                  </article>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded text-sm ${currentPage === i + 1 ? 'bg-99blue text-white' : 'border border-gray-300 hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
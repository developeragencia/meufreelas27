import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, Heart, Flag, Ban, MessageSquare, Briefcase, ThumbsUp, Calendar,
  ChevronDown, ChevronUp, Award, TrendingUp, CheckCircle, Shield, Zap, Eye, Menu, X, Home, Folder, User as UserIcon, Search
} from 'lucide-react';

interface Review {
  id: string;
  projectTitle: string;
  projectUrl: string;
  rating: number;
  comment: string;
  startDate: string;
  endDate: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  likes: number;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  experience: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  completedProjects: number;
  recommendations: number;
  memberSince: string;
  ranking?: number;
  isPremium: boolean;
  isVerified: boolean;
  skills: string[];
  interests: string[];
}

export default function UserProfile() {
  const { username } = useParams();
  const { isAuthenticated, user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOngoingProjects, setShowOngoingProjects] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio'>('about');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Folder, label: 'Projetos', href: '/projects' },
    { icon: UserIcon, label: 'Freelancers', href: '/freelancers' },
    { icon: MessageSquare, label: 'Mensagens', href: '/messages' },
  ];

  // Mock reviews data
  const reviews: Review[] = [
    {
      id: '1',
      projectTitle: 'Criar logotipo para escola de robótica',
      projectUrl: '/project/criar-logotipo-para-escola-de-robotica',
      rating: 5.0,
      comment: 'Tudo certo. Trabalho entregue como combinado.',
      startDate: 'jan. 2026',
      endDate: 'fev. 2026'
    },
    {
      id: '2',
      projectTitle: 'Criar 2 variações de logotipo',
      projectUrl: '/project/criar-2-variacoes-de-logotipo',
      rating: 5.0,
      comment: 'Cumpriu o seu trabalho novamente como êxito',
      startDate: 'jan. 2026',
      endDate: 'jan. 2026'
    },
    {
      id: '3',
      projectTitle: 'Redesign de logotipo para provedor de internet GNET (foco em vermelho)',
      projectUrl: '/project/redesign-de-logotipo-gnet',
      rating: 5.0,
      comment: 'O designer é muito bom e criativo eu gostei muito do serviço',
      startDate: 'jan. 2026',
      endDate: 'jan. 2026'
    },
    {
      id: '4',
      projectTitle: 'Criação de logotipo para empresa de passeios de lancha',
      projectUrl: '/project/logotipo-passeios-lancha',
      rating: 5.0,
      comment: 'Nenhum comentário',
      startDate: 'jan. 2026',
      endDate: 'jan. 2026'
    },
    {
      id: '5',
      projectTitle: 'Mockup 3D de embalagens para site e redes sociais',
      projectUrl: '/project/mockup-3d-embalagens',
      rating: 4.0,
      comment: 'Sim, eu recomendaria SIM o freelancer, especialmente pela atenção e disponibilidade em atender da melhor forma possível.',
      startDate: 'jan. 2026',
      endDate: 'jan. 2026'
    },
    {
      id: '6',
      projectTitle: 'Criar logotipo corporativo para S.T.A.R. Technology',
      projectUrl: '/project/logotipo-star-technology',
      rating: 4.6,
      comment: 'muito rapido na entrega.',
      startDate: 'jan. 2026',
      endDate: 'jan. 2026'
    },
    {
      id: '7',
      projectTitle: 'Design de capa de VHS: Vingadores da Justiça',
      projectUrl: '/project/design-capa-vhs',
      rating: 5.0,
      comment: 'Excelente, rápido, comprommissado e entregou exatamente nas espeficações solicitadas!',
      startDate: 'dez. 2025',
      endDate: 'dez. 2025'
    },
    {
      id: '8',
      projectTitle: 'Identidade visual para encontro anual',
      projectUrl: '/project/identidade-visual-encontro',
      rating: 5.0,
      comment: 'Nenhum comentário',
      startDate: 'dez. 2025',
      endDate: 'dez. 2025'
    },
    {
      id: '9',
      projectTitle: 'Design de backdrop/banner 2m x 2m para lançamento de livro',
      projectUrl: '/project/design-backdrop-livro',
      rating: 5.0,
      comment: 'Impecável como sempre. Comunicação muito fácil. Indico o profissional a todos.',
      startDate: 'dez. 2025',
      endDate: 'dez. 2025'
    },
    {
      id: '10',
      projectTitle: 'Criação de logotipo para empresa de perfumes',
      projectUrl: '/project/logotipo-perfumes',
      rating: 5.0,
      comment: 'Excelente trabalho do Rafael, entende com facilidade o projeto e finaliza com perfeição.',
      startDate: 'nov. 2025',
      endDate: 'nov. 2025'
    }
  ];

  // Mock portfolio data
  const portfolio: PortfolioItem[] = [
    { id: '1', title: 'Peças Nicho...', description: 'Essa e outras artes você pode conferir...', image: 'portfolio1', likes: 79 },
    { id: '2', title: 'Textos Desen...', description: 'Textos e peças desenvolvidas para a marca...', image: 'portfolio2', likes: 52 },
    { id: '3', title: 'Materiais Im...', description: 'Confira esse e outros trabalhos em:...', image: 'portfolio3', likes: 49 },
    { id: '4', title: 'Logos', description: 'Essa e outras artes você pode conferir...', image: 'portfolio4', likes: 59 },
    { id: '5', title: 'Folder/Panfle...', description: 'Essa e outras artes você pode conferir...', image: 'portfolio5', likes: 40 },
    { id: '6', title: 'Carrossel', description: 'Essa e outras artes você pode conferir...', image: 'portfolio6', likes: 35 },
    { id: '7', title: 'Cards Redes ...', description: 'Essa e outras artes você pode conferir...', image: 'portfolio7', likes: 24 },
    { id: '8', title: '2 - Cards Red...', description: 'Essa e outras artes você pode conferir...', image: 'portfolio8', likes: 32 }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const userData: UserProfile = {
        id: '1',
        name: 'Rafael P.',
        username: username || 'rafael-jenei',
        title: 'Publicitário Criativo',
        bio: `Cansado da mesmice de sempre? Da mesma velha publicidade em todo canto? De textos sempre iguais, que qualquer pessoa lê por aí? Seja bem-vindo, me chamo Rafael e busco há 5 anos surpreender todos os clientes em todas áreas em que trabalho: redação, criação, planejamento, edição de áudio e vídeo, além da criação de personagem 2D com a devida atenção aos desejos do cliente, para além de alcançar a expectativa, a superar.

Trabalhei desde agências de publicidade e faculdades à e-commerce. Procuro a todo momento me superar em cada trabalho, sempre respeitando os prazos e tendo uma ótima comunicação com o cliente, pois é vital a comunicação para estabelecer a confiança e entender o que cada cliente deseja com o trabalho.`,
        experience: `Com mais de cinco anos de experiência, trabalhei em agências de publicidade, faculdades, prefeituras e e-commerce com captação de imagens, filmaker, editor de áudio, criador de animações, gerenciador de redes sociais, redator com técnicas de SEO, criação, e após como diretor de arte júnior e sênior.

Em meu imenso currículo já trabalhei com diversas marcas entre elas: Uniasselvi, Mormaii, Mundo Gloob, SO.SI, Unimed, Rádio União FM, Vodol, Discovery Kids e Shopping Iguatemi.

Sempre que possível, realizo cursos para desenvolver ainda mais minhas capacidades e habilidades como publicitário, com objetivo de me tornar cada vez mais qualificado e apto ao atender e superar as expectativas dos meus clientes.`,
        avatar: `https://ui-avatars.com/api/?name=Rafael+P&background=10b981&color=fff&size=200`,
        rating: 4.82,
        totalReviews: 1538,
        completedProjects: 1539,
        recommendations: 1481,
        memberSince: '17/10/2018',
        ranking: 1,
        isPremium: true,
        isVerified: true,
        skills: [
          'Adobe Premiere', 'Animação', 'Criação de Campanhas', 'Criação de Personagens',
          'Adobe After Effects', 'Criação', 'Edição', 'Edição de Fotografia', 'Edição de Imagens',
          'Edição de Textos', 'Adobe Illustrator', 'Ilustração', 'Manipulação de Imagens',
          'Adobe Photoshop', 'Redação', 'Redação Publicitária', 'Redes Sociais', 'Social Media',
          'Tradução', 'Word', 'Edição de Vídeo', 'Design 2D', 'Design Criativo', 'Design de Logotipo'
        ],
        interests: [
          'Animação', 'Design de Produto', 'Design Gráfico', 'UX/UI & Web Design', 'Diagramação',
          'Ilustração', 'Motion Design', 'Desenvolvimento Mobile', 'Redação', 'Edição & Revisão',
          'Roteiro', 'Inglês', 'Marketing Digital', 'Gestão de Mídias Sociais', 'Áudio - Edição e Produção',
          'Vídeo - Edição e Produção', 'Edição de Imagens', 'Fotografia', 'Desenvolvimento Desktop',
          'Apresentação', 'Logotipos', 'Rótulos e Embalagens', 'Outra - Design & Criação', 'Outra - Escrita',
          'Outra - Fotografia & AudioVisual', 'Currículo & Carta de Apresentação', 'Espanhol',
          'Web, Mobile & Software', 'Design & Criação', 'Escrita & Conteúdo'
        ]
      };
      setProfile(userData);
      setLoading(false);
    }, 300);
  }, [username]);

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Usuário não encontrado</p>
      </div>
    );
  }

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 10);
  const remainingReviews = profile.totalReviews - visibleReviews.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Mobile Menu */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="text-xl md:text-2xl font-bold flex items-center">
                <span className="text-sky-400">meu</span>
                <span className="font-light">freelas</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/freelancers" className="text-gray-300 hover:text-white transition-colors">Freelancers</Link>
              <Link to="/projects" className="text-gray-300 hover:text-white transition-colors">Projetos</Link>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar freelancers..."
                  className="bg-white/10 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Link to="/messages" className="text-gray-300 hover:text-white hidden sm:block">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link to={currentUser?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white text-sm md:text-base">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white transition-colors">Cadastre-se</Link>
                </>
              )}
              <Link to="/project/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors font-medium">
                Publicar projeto
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed left-0 top-0 w-72 h-full bg-white shadow-xl z-50 md:hidden">
            <div className="p-4 border-b bg-slate-800 flex items-center justify-between">
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

      {/* Back Link */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/freelancers" className="text-sky-500 hover:text-sky-600 text-sm flex items-center transition-colors">
            <ChevronDown className="w-4 h-4 mr-1 rotate-90" />
            Voltar aos resultados da pesquisa
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-40 h-40 rounded-2xl object-cover shadow-lg border-4 border-white"
                  />
                  {profile.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-sky-500 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    {/* Name & Badges */}
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                      {profile.isVerified && (
                        <Shield className="w-6 h-6 text-sky-500" />
                      )}
                    </div>

                    {/* Premium Badge */}
                    {profile.isPremium && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold rounded-full mb-3 shadow-md">
                        <Award className="w-4 h-4" />
                        TOP FREELANCER PLUS
                      </div>
                    )}

                    {/* Title */}
                    <p className="text-xl text-gray-600 mb-4">{profile.title}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center">{renderStars(profile.rating)}</div>
                      <span className="text-gray-600">
                        ({profile.rating.toFixed(2)} - {profile.totalReviews.toLocaleString()} avaliações)
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <TrendingUp className="w-4 h-4 text-sky-500" />
                        <span>Ranking:</span>
                        <span className="font-bold text-gray-900">{profile.ranking}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Briefcase className="w-4 h-4 text-sky-500" />
                        <span>Projetos:</span>
                        <span className="font-bold text-gray-900">{profile.completedProjects.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <ThumbsUp className="w-4 h-4 text-sky-500" />
                        <span>Recomendações:</span>
                        <span className="font-bold text-gray-900">{profile.recommendations.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <span>Desde:</span>
                        <span className="font-bold text-gray-900">{profile.memberSince}</span>
                      </div>
                    </div>

                    {/* Achievement Badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <Award className="w-3 h-3" /> Top 1%
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Zap className="w-3 h-3" /> Resposta Rápida
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> 100% Entregas
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Eye className="w-3 h-3" /> 50K+ Visualizações
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Link
                      to={isAuthenticated ? '/project/new' : '/register/client'}
                      className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-sky-500/30 text-center"
                    >
                      Convidar
                    </Link>
                    <button
                      onClick={toggleFavorite}
                      className={`px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                        isFavorite 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                      {isFavorite ? 'Favoritado' : 'Favoritar'}
                    </button>
                    <button className="px-8 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                      <Ban className="w-4 h-4" />
                      Bloquear
                    </button>
                    <button className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                      <Flag className="w-4 h-4" />
                      Denunciar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'about' 
                ? 'text-sky-500 border-b-2 border-sky-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sobre
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'portfolio' 
                ? 'text-sky-500 border-b-2 border-sky-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Portfólio
          </button>
        </div>

        {activeTab === 'about' ? (
          <>
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                Sobre mim
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                Resumo da experiência profissional
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {profile.experience}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                  Histórico de projetos & Avaliações
                </h2>
                <button
                  onClick={() => setShowOngoingProjects(!showOngoingProjects)}
                  className="text-sky-500 hover:text-sky-600 text-sm flex items-center gap-1 transition-colors"
                >
                  {showOngoingProjects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showOngoingProjects ? '(-) Ocultar' : '(+) Exibir'} projetos em andamento
                </button>
              </div>

              <div className="space-y-4">
                {visibleReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <Link 
                      to={review.projectUrl}
                      className="text-sky-500 hover:text-sky-600 font-medium transition-colors"
                    >
                      {review.projectTitle}
                    </Link>
                    <p className="text-gray-600 italic mt-2">"{review.comment}"</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.floor(review.rating))].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-yellow-600 font-bold ml-1">{review.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{review.startDate} - {review.endDate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {remainingReviews > 0 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="mt-6 text-sky-500 hover:text-sky-600 font-medium transition-colors"
                >
                  {showAllReviews ? 'Mostrar menos' : `+ ${remainingReviews.toLocaleString()} avaliações`}
                </button>
              )}
            </div>
          </>
        ) : (
          /* Portfolio Section */
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
              Trabalhos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-100 to-blue-200 rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-sky-400/50" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-sky-500 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-400">
                    <ThumbsUp className="w-4 h-4" />
                    {item.likes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
            Habilidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, idx) => (
              <span 
                key={idx} 
                className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg text-sm font-medium hover:bg-sky-200 transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
            Áreas de interesse
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, idx) => (
              <span 
                key={idx} 
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2014-2026 meuFreelas. Todos os direitos reservados.</p>
          <div className="flex justify-center space-x-4 mt-4 text-sm">
            <Link to="/termos" className="text-gray-400 hover:text-white transition-colors">Termos de uso</Link>
            <span className="text-gray-600">|</span>
            <Link to="/privacidade" className="text-gray-400 hover:text-white transition-colors">Política de privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

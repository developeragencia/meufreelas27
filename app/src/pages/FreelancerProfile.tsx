import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiEnsureConversation, apiListReviews, apiSendMessage, hasApi } from '../lib/api';
import BrandLogo from '../components/BrandLogo';
import { calculateFreelancerProfileCompletion } from '../lib/profileCompletion';
import { 
  ArrowLeft, 
  Star, 
  Briefcase, 
  MapPin, 
  Calendar,
  CheckCircle,
  MessageSquare,
  Award,
  Globe,
  Clock,
  TrendingUp,
  Shield,
  Crown,
  Heart,
  Share2,
  Flag,
  Medal,
  UserCheck,
  Megaphone,
  FileText,
  ThumbsUp
} from 'lucide-react';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  description: string;
  skills: string[];
  rating: number;
  jobs: number;
  hourlyRate: string;
  location: string;
  avatar: string;
  memberSince: string;
  completedProjects: number;
  languages: string[];
  portfolio: { title: string; image: string; description?: string; link?: string }[];
  certifications: string[];
  isPremium: boolean;
  isVerified: boolean;
  isPro: boolean;
  type?: 'freelancer' | 'client'; // Added type property
  availability: string;
  lastActive: string;
  education: { degree: string; institution: string; year: string }[];
  experiences: { company: string; role: string; period: string; description: string }[];
  reviews: { id: string; reviewerName: string; rating: number; comment: string; date: string; projectTitle: string }[];
  ranking?: number;
  recommendations?: number;
}

export default function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews' | 'experience'>('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    loadFreelancer();
  }, [id]);

  useEffect(() => {
    if (!id || !freelancer || !hasApi()) return;
    apiListReviews(id).then((res) => {
      if (res.ok && res.reviews?.length) {
        setFreelancer((prev) => {
          if (!prev) return null;
          const mappedReviews = res.reviews!.map(r => ({
            id: r.id,
            reviewerName: r.reviewerName,
            rating: r.rating,
            comment: r.comment,
            date: r.date,
            projectTitle: r.projectTitle
          }));
          return { ...prev, reviews: mappedReviews };
        });
      }
    });
  }, [id, freelancer?.id]);

  const loadFreelancer = () => {
    setLoading(true);
    
    // Try to find freelancer from multiple sources
    let foundFreelancer: Freelancer | null = null;
    
    // 1. Check if it's the current user
    if (user && user.id === id) {
      const profileData = localStorage.getItem(`profile_${user.id}`);
      const profile = profileData ? JSON.parse(profileData) : {};
      foundFreelancer = createFreelancerFromUser(user, profile);
    }
    
    // 2. Check registered users
    if (!foundFreelancer) {
      // Allow finding clients too, not just freelancers
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      const foundUser = users.find((u: any) => u.id === id);
      if (foundUser) {
        const profileData = localStorage.getItem(`profile_${foundUser.id}`);
        const profile = profileData ? JSON.parse(profileData) : {};
        foundFreelancer = createFreelancerFromUser(foundUser, profile);
      }
    }
    
    // 3. Sem fallback mock: só exibe perfil real
    
    setFreelancer(foundFreelancer);
    
    // Check if favorite
    const favorites = JSON.parse(localStorage.getItem(`favorites_${user?.id}`) || '[]');
    setIsFavorite(favorites.includes(id));
    
    setLoading(false);
  };

  const createFreelancerFromUser = (userData: any, profile: any): Freelancer => ({
    id: userData.id,
    name: userData.name,
    title: profile.title || userData.title || '',
    description: profile.bio || 'Profissional dedicado e experiente, pronto para ajudar no seu projeto.',
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((s: any) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
      : Array.isArray(userData.skills)
        ? userData.skills
        : [],
    rating: Number(userData.rating) || 0,
    jobs: Number(userData.totalReviews) || 0,
    hourlyRate: profile.hourlyRate ? `R$ ${profile.hourlyRate}` : (userData.hourlyRate ? `R$ ${userData.hourlyRate}` : 'R$ 0'),
    location: profile.location || userData.location || 'Brasil',
    avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=003366&color=fff`,
    memberSince: new Date(userData.createdAt || Date.now()).getFullYear().toString(),
    completedProjects: Number(userData.completedProjects) || 0,
    languages: ['Português'],
    portfolio: profile.portfolioItems || [],
    certifications: [],
    isPremium: !!userData.isPremium,
    isVerified: !!userData.isVerified,
    type: userData.type || 'freelancer', // Map type from user data
    isPro: !!userData.isPro,
    availability: profile.availability || 'full-time',
    lastActive: 'Há poucos minutos',
    education: [],
    experiences: [],
    reviews: []
  });

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const favorites = JSON.parse(localStorage.getItem(`favorites_${user?.id}`) || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter((f: string) => f !== id);
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(newFavorites));
    } else {
      favorites.push(id);
      localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(favorites));
    }
    setIsFavorite(!isFavorite);
  };

  const sendContactMessage = async () => {
    if (!user?.id || !freelancer?.id) return;
    if (!contactMessage.trim()) {
      setContactError('Digite uma mensagem para continuar.');
      return;
    }
    setContactError('');
    setIsSendingContact(true);
    const ensure = await apiEnsureConversation(user.id, freelancer.id);
    if (!ensure.ok || !ensure.conversationId) {
      setIsSendingContact(false);
      setContactError(ensure.error || 'Não foi possível iniciar a conversa.');
      return;
    }
    const sent = await apiSendMessage(user.id, ensure.conversationId, contactMessage.trim());
    setIsSendingContact(false);
    if (!sent.ok) {
      setContactError(sent.error || 'Não foi possível enviar a mensagem.');
      return;
    }
    setShowContactModal(false);
    setContactMessage('');
    navigate('/messages');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${freelancer?.name} - ${freelancer?.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue"></div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Freelancer não encontrado</p>
          <Link to="/freelancers" className="text-99blue hover:underline">
            Ver todos os freelancers
          </Link>
        </div>
      </div>
    );
  }

  const completionResult = calculateFreelancerProfileCompletion({
    ...freelancer,
    // Add missing properties that might be needed by the calculator
    bio: freelancer.description,
    phone: '', // Phone is not usually public, might need handling if required for 100%
  } as any);
  const completionScore = completionResult.score;

  const allBadges = [
    {
      id: 'top_1',
      icon: Medal,
      name: 'Top 1',
      description: 'Ranking: 1',
      color: 'bg-orange-500',
      unlocked: (freelancer.ranking || 0) === 1
    },
    {
      id: 'profile_complete',
      icon: UserCheck,
      name: 'Perfil Completo',
      description: 'Completou o seu perfil e está pronto para usar o 99Freelas',
      color: 'bg-green-500',
      unlocked: completionScore >= 100
    },
    {
      id: 'feedback',
      icon: Megaphone,
      name: 'Colaborador',
      description: 'Ajudou o 99Freelas com um feedback relevante',
      color: 'bg-pink-500',
      unlocked: false // Placeholder
    },
    {
      id: 'proposals',
      icon: FileText,
      name: 'Experiente',
      description: 'Tem experiência no envio de propostas',
      color: 'bg-amber-600',
      unlocked: (freelancer.jobs || 0) > 5
    },
    {
      id: 'recommended',
      icon: ThumbsUp,
      name: 'Recomendado',
      description: 'Concluiu um projeto e foi recomendado',
      color: 'bg-blue-800',
      unlocked: (freelancer.recommendations || 0) > 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <BrandLogo to="/" darkBg />
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white">Projetos</Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white">Freelancers</Link>
              {isAuthenticated ? (
                <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-99blue rounded-lg hover:bg-99blue-light transition-colors">
                    Cadastre-se
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link to="/freelancers" className="flex items-center text-gray-500 hover:text-99blue mb-4 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para freelancers
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                src={freelancer.avatar}
                alt={freelancer.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {freelancer.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-99blue capitalize">{freelancer.name}</h1>
                {freelancer.isPremium && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-sm font-medium rounded-full flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Premium
                  </span>
                )}
                {freelancer.isPro && !freelancer.isPremium && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Profissional
                  </span>
                )}
                {freelancer.isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Verificado
                  </span>
                )}
              </div>
              
              <p className="text-lg text-gray-600 mt-1">{freelancer.title}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium text-gray-900">{freelancer.rating.toFixed(1)}</span>
                  <span className="ml-1">({freelancer.jobs} avaliações)</span>
                </span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {freelancer.location}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Membro desde {freelancer.memberSince}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {freelancer.lastActive}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorite 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <nav className="flex min-w-max space-x-6">
            {[
              { id: 'about', label: 'Sobre', icon: Briefcase },
              { id: 'portfolio', label: 'Portfólio', icon: Globe },
              { id: 'reviews', label: 'Avaliações', icon: Star },
              { id: 'experience', label: 'Experiência', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-99blue text-99blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* About */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sobre mim</h2>
                  <p className="text-gray-600 leading-relaxed">{freelancer.description}</p>
                </div>

                {/* Skills */}
                {freelancer.type === 'freelancer' && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Habilidades</h2>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill) => (
                        <span key={skill} className="px-4 py-2 bg-99blue/10 text-99blue rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {freelancer.type === 'freelancer' && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Idiomas</h2>
                    <div className="flex flex-wrap gap-3">
                      {freelancer.languages.map((lang) => (
                        <span key={lang} className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {freelancer.type === 'freelancer' && freelancer.certifications.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificações</h2>
                    <div className="space-y-3">
                      {freelancer.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Award className="w-5 h-5 text-99blue mr-3" />
                          <span className="text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfólio</h2>
                {freelancer.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {freelancer.portfolio.map((item, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
                        <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Nenhum projeto no portfólio ainda</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Avaliações</h2>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-lg">{freelancer.rating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({freelancer.jobs} avaliações)</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {freelancer.reviews.map((review, index) => (
                    <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-99blue/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-99blue font-medium">{review.reviewerName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.reviewerName}</p>
                            <p className="text-sm text-gray-500">{review.projectTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 ml-13">{review.comment}</p>
                      <p className="text-sm text-gray-400 mt-2 ml-13">{review.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6">
                {/* Education */}
                {freelancer.education.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Educação</h2>
                    <div className="space-y-4">
                      {freelancer.education.map((edu, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-10 h-10 bg-99blue/10 rounded-lg flex items-center justify-center mr-4">
                            <Award className="w-5 h-5 text-99blue" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{edu.degree}</p>
                            <p className="text-gray-500">{edu.institution}</p>
                            <p className="text-sm text-gray-400">{edu.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {freelancer.experiences.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiência Profissional</h2>
                    <div className="space-y-4">
                      {freelancer.experiences.map((exp, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-10 h-10 bg-99blue/10 rounded-lg flex items-center justify-center mr-4">
                            <Briefcase className="w-5 h-5 text-99blue" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{exp.role}</p>
                            <p className="text-gray-500">{exp.company}</p>
                            <p className="text-sm text-gray-400">{exp.period}</p>
                            <p className="text-gray-600 mt-1">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {freelancer.education.length === 0 && freelancer.experiences.length === 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma experiência registrada</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Taxa Horária</h3>
              <p className="text-3xl font-bold text-gray-900">{freelancer.hourlyRate}</p>
              <p className="text-sm text-gray-500">por hora</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Disponibilidade</p>
                <p className="font-medium text-gray-900 capitalize">{freelancer.availability.replace('-', ' ')}</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Projetos concluídos
                  </span>
                  <span className="font-semibold">{freelancer.completedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center text-sm">
                    <Briefcase className="w-4 h-4 mr-2 text-99blue" />
                    Trabalhos em andamento
                  </span>
                  <span className="font-semibold">{freelancer.jobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center text-sm">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Avaliação média
                  </span>
                  <span className="font-semibold">{freelancer.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Completude, selo e reputação</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Completude do perfil</span>
                  <span className="text-99blue font-semibold">{completionScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-full bg-99blue rounded-full transition-all" style={{ width: `${completionScore}%` }} />
                </div>
              </div>
              {allBadges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {allBadges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        badge.unlocked ? badge.color : 'bg-gray-200 grayscale opacity-50'
                      }`}
                      title={badge.description}
                    >
                      <badge.icon className="w-5 h-5 text-white" />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        <p className="font-bold mb-0.5">{badge.name}</p>
                        <p className="font-normal opacity-90">{badge.description}</p>
                        {!badge.unlocked && <p className="font-bold text-red-300 mt-1">(Bloqueado)</p>}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sem selos de reputação ainda.</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  setContactError('');
                  setContactMessage('');
                  setShowContactModal(true);
                }}
                className="w-full py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors font-medium flex items-center justify-center mb-3"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </button>
              <Link
                to={isAuthenticated ? '/project/new' : '/login'}
                className="w-full py-3 border border-99blue text-99blue rounded-lg hover:bg-99blue/5 transition-colors font-medium flex items-center justify-center mb-3"
              >
                Convidar para Projeto
              </Link>
              <button className="w-full py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center">
                <Flag className="w-4 h-4 mr-2" />
                Reportar
              </button>
            </div>

            {/* Premium Badge */}
            {!freelancer.isPremium && (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
                <div className="flex items-center mb-2">
                  <Crown className="w-6 h-6 mr-2" />
                  <h3 className="font-semibold">Torne-se Premium</h3>
                </div>
                <p className="text-sm text-white/90 mb-4">
                  Destaque seu perfil e apareça nas primeiras posições nas buscas.
                </p>
                <Link 
                  to="/premium" 
                  className="block w-full py-2 bg-white text-yellow-600 rounded-lg text-center font-medium hover:bg-gray-100 transition-colors"
                >
                  Conhecer Planos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enviar mensagem para {freelancer.name}</h3>
            <textarea
              placeholder="Escreva sua mensagem..."
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent mb-4"
            />
            {contactError && (
              <div className="mb-4 text-sm text-red-600">{contactError}</div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactError('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={sendContactMessage}
                disabled={isSendingContact}
                className="flex-1 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-60"
              >
                {isSendingContact ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

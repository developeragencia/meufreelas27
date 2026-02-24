import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, Mail, Phone, Globe, Linkedin, Github, 
  Edit, Star, CheckCircle, Award, Briefcase, Clock,
  DollarSign, FileText, ArrowLeft, Shield, Crown
} from 'lucide-react';
import { apiListProjects, apiListProposals, apiListReviews, hasApi } from '../lib/api';
interface ProfileData {
  phone: string;
  location: string;
  bio: string;
  title: string;
  experience: string;
  hourlyRate: string;
  availability: string;
  website: string;
  linkedin: string;
  github: string;
  skills: Array<{id: string; name: string}>;
  portfolioItems: Array<{id: string; title: string; description: string; image: string}>;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFreelancer = user?.type === 'freelancer' || Boolean((user as { hasFreelancerAccount?: boolean })?.hasFreelancerAccount);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({
    projectsCompleted: 0,
    proposalsSent: 0,
    rating: 0,
    memberSince: ''
  });

  useEffect(() => {
    if (!user?.id) return;

    const savedProfile = localStorage.getItem(`profile_${user.id}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    const loadStats = async () => {
      try {
        if (hasApi()) {
          if (isFreelancer) {
            const [proposalsRes, reviewsRes] = await Promise.all([
              apiListProposals({ freelancerId: user.id }),
              apiListReviews(user.id),
            ]);
            const proposals = proposalsRes.ok && proposalsRes.proposals ? proposalsRes.proposals : [];
            const projectsCompleted = proposals.filter((p) => p.status === 'Aceita').length;
            const proposalsSent = proposals.length;
            let rating = user.rating || 0;
            if (reviewsRes.ok && reviewsRes.reviews && reviewsRes.reviews.length > 0) {
              const total = reviewsRes.reviews.reduce((sum, r) => sum + r.rating, 0);
              rating = total / reviewsRes.reviews.length;
            }
            const memberSince = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const nextStats = { projectsCompleted, proposalsSent, rating, memberSince };
            setStats(nextStats);
            localStorage.setItem(`stats_${user.id}`, JSON.stringify(nextStats));
            return;
          }
          const [projectsRes, proposalsRes] = await Promise.all([
            apiListProjects({ clientId: user.id }),
            apiListProposals({ clientId: user.id }),
          ]);
          const projects = projectsRes.ok && projectsRes.projects ? projectsRes.projects : [];
          const proposals = proposalsRes.ok && proposalsRes.proposals ? proposalsRes.proposals : [];
          const nextStats = {
            projectsCompleted: projects.length,
            proposalsSent: proposals.length,
            rating: 0,
            memberSince: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          };
          setStats(nextStats);
          localStorage.setItem(`stats_${user.id}`, JSON.stringify(nextStats));
          return;
        }
        const savedStats = localStorage.getItem(`stats_${user.id}`);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        } else {
          const fallbackStats = {
            projectsCompleted: Math.floor(Math.random() * 50) + 5,
            proposalsSent: Math.floor(Math.random() * 100) + 20,
            rating: 4.5 + Math.random() * 0.5,
            memberSince: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          };
          setStats(fallbackStats);
          localStorage.setItem(`stats_${user.id}`, JSON.stringify(fallbackStats));
        }
      } catch {
        const savedStats = localStorage.getItem(`stats_${user.id}`);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      }
    };

    void loadStats();
  }, [user, isFreelancer]);

  const getExperienceLabel = (exp: string) => {
    const labels: Record<string, string> = {
      '0-1': 'Menos de 1 ano',
      '1-3': '1 a 3 anos',
      '3-5': '3 a 5 anos',
      '5-10': '5 a 10 anos',
      '10+': 'Mais de 10 anos'
    };
    return labels[exp] || exp;
  };

  const getAvailabilityLabel = (avail: string) => {
    const labels: Record<string, string> = {
      'full-time': 'Tempo integral',
      'part-time': 'Meio período',
      'freelance': 'Freelance',
      'weekends': 'Fins de semana'
    };
    return labels[avail] || avail;
  };

  const completionScore = (() => {
    let score = 0;
    if (user?.name?.trim()) score += 15;
    if (user?.email?.trim()) score += 15;
    if (user?.avatar?.trim()) score += 10;
    if (profile?.bio?.trim()) score += 20;
    if (profile?.location?.trim()) score += 10;
    if (profile?.phone?.trim()) score += 10;
    if (isFreelancer) {
      if (profile?.hourlyRate?.trim()) score += 10;
      if ((profile?.skills?.length || 0) >= 3) score += 10;
    } else {
      score += 10;
    }
    return Math.min(100, score);
  })();

  const reputationBadges = [
    user?.isVerified ? 'Perfil Verificado' : null,
    user?.isPremium ? 'Premium' : null,
    (stats.rating || 0) >= 4.5 ? 'Alta Avaliação' : null,
    stats.projectsCompleted > 0 ? 'Projetos Concluídos' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-lg text-gray-600 mt-1">
                {isFreelancer ? (profile?.title || 'Profissional Freelancer') : 'Cliente'}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {profile?.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {profile.phone}
                  </span>
                )}
              </div>

              {isFreelancer && (
                <div className="flex items-center mt-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(stats.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {stats.rating.toFixed(1)} ({stats.projectsCompleted} projetos)
                  </span>
                </div>
              )}
            </div>

            {isFreelancer && (
              <div className="flex flex-col gap-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Valor hora</p>
                  <p className="text-2xl font-bold text-99blue">
                    R$ {profile?.hourlyRate || '0'}
                  </p>
                </div>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium text-center">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Disponível
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-4">
                {isFreelancer ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Projetos concluídos</span>
                      <span className="font-medium">{stats.projectsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Propostas enviadas</span>
                      <span className="font-medium">{stats.proposalsSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Taxa de aceitação</span>
                      <span className="font-medium">
                        {stats.proposalsSent > 0 ? ((stats.projectsCompleted / stats.proposalsSent) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Projetos publicados</span>
                      <span className="font-medium">{stats.projectsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Propostas recebidas</span>
                      <span className="font-medium">{stats.proposalsSent}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Membro desde</span>
                  <span className="font-medium">{stats.memberSince}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Completude do Perfil</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Nível atual</span>
                <span className="text-sm font-semibold text-99blue">{completionScore}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full rounded-full bg-99blue transition-all" style={{ width: `${completionScore}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {completionScore >= 80 ? 'Perfil quase completo.' : 'Complete os dados para melhorar sua visibilidade.'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Selos e Reputação</h3>
              {reputationBadges.length === 0 ? (
                <p className="text-sm text-gray-500">Sem selos ainda. Complete perfil e ganhe avaliações.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {reputationBadges.map((badge) => (
                    <span key={badge} className="px-3 py-1 text-xs font-medium rounded-full bg-99blue/10 text-99blue">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                {user?.isVerified ? <Shield className="w-4 h-4 text-green-600" /> : <Shield className="w-4 h-4 text-gray-400" />}
                {user?.isPremium ? <Crown className="w-4 h-4 text-yellow-500" /> : <Crown className="w-4 h-4 text-gray-400" />}
                <span>Verificação e plano premium impactam sua reputação.</span>
              </div>
            </div>

            {/* Links - só freelancer */}
            {isFreelancer && (profile?.website || profile?.linkedin || profile?.github) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Links</h3>
                <div className="space-y-3">
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-99blue hover:underline"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  )}
                  {profile.linkedin && (
                    <a 
                      href={profile.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-99blue hover:underline"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {profile.github && (
                    <a 
                      href={profile.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-99blue hover:underline"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Professional Info - só freelancer */}
            {isFreelancer && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informações Profissionais</h3>
              <div className="space-y-4">
                {profile?.experience && (
                  <div className="flex items-start">
                    <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Experiência</p>
                      <p className="font-medium">{getExperienceLabel(profile.experience)}</p>
                    </div>
                  </div>
                )}
                {profile?.availability && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Disponibilidade</p>
                      <p className="font-medium">{getAvailabilityLabel(profile.availability)}</p>
                    </div>
                  </div>
                )}
                {profile?.hourlyRate && (
                  <div className="flex items-start">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Valor hora</p>
                      <p className="font-medium">R$ {profile.hourlyRate}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile?.bio && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Sobre mim</h3>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills - só freelancer */}
            {isFreelancer && profile?.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Habilidades</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-4 py-2 bg-99blue/10 text-99blue rounded-full"
                    >
                      <Award className="w-4 h-4 mr-1" />
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio - só freelancer; cliente não tem portfólio */}
            {isFreelancer && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Portfólio</h3>
                <button 
                  onClick={() => navigate('/profile/edit?tab=portfolio')}
                  className="text-99blue hover:underline text-sm"
                >
                  Gerenciar
                </button>
              </div>
              
              {profile?.portfolioItems && profile.portfolioItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.portfolioItems.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-200">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum projeto no portfólio ainda</p>
                  <button 
                    onClick={() => navigate('/profile/edit?tab=portfolio')}
                    className="mt-4 text-99blue hover:underline"
                  >
                    Adicionar projeto
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

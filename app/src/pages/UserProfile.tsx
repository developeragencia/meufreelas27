import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, Heart, MessageSquare, Briefcase, Calendar, CheckCircle, Shield, Crown, ArrowLeft, Ban, Flag } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

interface ProfileModel {
  id: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  avatar: string;
  rating: number;
  completedProjects: number;
  memberSince: string;
  isPremium: boolean;
  isVerified: boolean;
  skills: string[];
}

function toUsername(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function loadUsers(): any[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function UserProfile() {
  const { username } = useParams();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [profile, setProfile] = useState<ProfileModel | null>(null);

  useEffect(() => {
    const blocked = JSON.parse(localStorage.getItem('meufreelas_blocked_profiles') || '[]');
    setIsBlocked(Array.isArray(blocked) && blocked.includes(username));

    const users = loadUsers().filter((u) => u?.type === 'freelancer' || u?.hasFreelancerAccount);
    const found = users.find((u) => toUsername(String(u?.name || u?.id || '')) === username);
    if (!found) {
      setProfile(null);
      return;
    }

    const savedProfileRaw = localStorage.getItem(`profile_${found.id}`);
    let savedProfile: any = {};
    try {
      savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : {};
    } catch {
      savedProfile = {};
    }

    const createdAt = found?.createdAt || found?.created_at || new Date().toISOString();
    const safeName = String(found?.name || 'Freelancer');
    const safeAvatar = found?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=003366&color=fff`;

    setProfile({
      id: String(found.id),
      name: safeName,
      username: toUsername(safeName),
      title: String(savedProfile?.title || found?.title || 'Freelancer'),
      bio: String(savedProfile?.bio || found?.bio || 'Sem biografia cadastrada.'),
      avatar: safeAvatar,
      rating: Number(found?.rating || 0),
      completedProjects: Number(found?.completedProjects || 0),
      memberSince: new Date(createdAt).toLocaleDateString('pt-BR'),
      isPremium: !!found?.isPremium,
      isVerified: !!found?.isVerified,
      skills: Array.isArray(savedProfile?.skills)
        ? savedProfile.skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
        : Array.isArray(found?.skills)
          ? found.skills
          : [],
    });
  }, [username]);

  const handleBlock = () => {
    const blocked = JSON.parse(localStorage.getItem('meufreelas_blocked_profiles') || '[]');
    const safe = Array.isArray(blocked) ? blocked : [];
    let next: string[] = [];
    if (isBlocked) {
      next = safe.filter((u: string) => u !== username);
    } else {
      next = [...safe, String(username)];
    }
    localStorage.setItem('meufreelas_blocked_profiles', JSON.stringify(next));
    setIsBlocked(!isBlocked);
  };

  const handleReport = () => {
    const reports = JSON.parse(localStorage.getItem('meufreelas_profile_reports') || '[]');
    const safe = Array.isArray(reports) ? reports : [];
    safe.push({ username, createdAt: new Date().toISOString() });
    localStorage.setItem('meufreelas_profile_reports', JSON.stringify(safe));
    alert('Perfil denunciado. Obrigado pelo reporte.');
  };

  const stars = useMemo(() => {
    const full = Math.max(0, Math.min(5, Math.floor(profile?.rating || 0)));
    return Array.from({ length: full });
  }, [profile?.rating]);

  const completionScore = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name.trim()) score += 10;
    if (profile.title.trim()) score += 20;
    if (profile.bio.trim() && profile.bio !== 'Sem biografia cadastrada.') score += 20;
    if (profile.avatar.trim()) score += 10;
    if ((profile.skills?.length || 0) >= 3) score += 15;
    if ((profile.completedProjects || 0) > 0) score += 15;
    if (profile.isVerified) score += 10;
    return Math.min(100, score);
  }, [profile]);

  const reputationBadges = useMemo(() => {
    if (!profile) return [];
    return [
      profile.isVerified ? 'Perfil Verificado' : null,
      profile.isPremium ? 'Premium' : null,
      profile.rating >= 4.5 ? 'Alta Avaliação' : null,
      profile.completedProjects >= 3 ? 'Projetos Entregues' : null,
    ].filter(Boolean) as string[];
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-700 mb-3">Perfil não encontrado.</p>
          <Link to="/freelancers" className="text-99blue hover:underline">Voltar para freelancers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-99dark text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo to="/" darkBg />
          <div className="flex items-center gap-4">
            <Link to="/freelancers" className="text-gray-300 hover:text-white">Freelancers</Link>
            <Link to="/projects" className="text-gray-300 hover:text-white">Projetos</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border mb-4 px-4 py-3">
          <Link to="/freelancers" className="inline-flex items-center text-sm text-99blue hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar aos resultados da pesquisa
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-xl object-cover" />
              {profile.isVerified && (
                <span className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.isVerified && <Shield className="w-5 h-5 text-sky-500" />}
                {profile.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Crown className="w-3.5 h-3.5" />
                    Premium
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{profile.title}</p>
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <div className="flex items-center">
                  {stars.map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span>{profile.rating.toFixed(1)} de 5</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{profile.completedProjects} projetos</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Desde {profile.memberSince}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Link
                to={isAuthenticated ? '/project/new' : '/register'}
                className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center text-sm"
              >
                Convidar
              </Link>
              <button
                onClick={() => setIsFavorite((v) => !v)}
                className={`px-5 py-2 rounded text-sm ${isFavorite ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
              >
                <span className="inline-flex items-center gap-2"><Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />Favoritar</span>
              </button>
              <button
                onClick={handleBlock}
                className={`px-5 py-2 rounded text-sm ${isBlocked ? 'bg-gray-700 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
              >
                <span className="inline-flex items-center gap-2"><Ban className="w-4 h-4" />{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
              </button>
              <button
                onClick={handleReport}
                className="px-5 py-2 rounded text-sm bg-red-500 text-white hover:bg-red-600"
              >
                <span className="inline-flex items-center gap-2"><Flag className="w-4 h-4" />Denunciar</span>
              </button>
              <Link to="/messages" className="px-5 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-center">
                <span className="inline-flex items-center gap-2"><MessageSquare className="w-4 h-4" />Mensagem</span>
              </Link>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre mim</h2>
          <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Resumo da experiência profissional</h2>
          <p className="text-gray-700">
            {profile.bio && profile.bio !== 'Sem biografia cadastrada.'
              ? profile.bio
              : 'Sem resumo de experiência profissional informado.'}
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Completude, Selo e Reputação</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Completude do perfil</span>
              <span className="font-semibold text-99blue">{completionScore}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-full rounded-full bg-99blue transition-all" style={{ width: `${completionScore}%` }} />
            </div>
          </div>
          {reputationBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {reputationBadges.map((badge) => (
                <span key={badge} className="px-3 py-1.5 rounded-full text-xs font-medium bg-99blue/10 text-99blue">
                  {badge}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sem selos no momento.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Habilidades</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.skills.length ? profile.skills : ['Sem habilidades cadastradas']).map((skill, idx) => (
              <span key={`${skill}-${idx}`} className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-sm">
                {skill}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

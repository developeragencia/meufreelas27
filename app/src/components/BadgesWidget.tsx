import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Award, Star, Zap, Shield, Crown, TrendingUp, Users, 
  CheckCircle, Clock, Target, Gift, Lock, Info
} from 'lucide-react';

interface Badge {
  id: string;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function BadgesWidget() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load stats
    const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const userProjects = projects.filter((p: any) => p.clientId === user.id || p.freelancerId === user.id);
    const completedProjects = userProjects.filter((p: any) => String(p.status || '').toLowerCase() === 'completed');
    const proposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
    const userProposals = proposals.filter((p: any) => p.freelancerId === user.id);
    const profileData = localStorage.getItem(`profile_${user.id}`);
    const profile = profileData ? JSON.parse(profileData) : null;

    const allBadges: Badge[] = [
      {
        id: 'newbie',
        icon: Star,
        name: 'Novato',
        description: 'Complete seu perfil na plataforma',
        color: 'bg-blue-500',
        unlocked: false
      },
      {
        id: 'first_project',
        icon: Award,
        name: 'Primeiro projeto',
        description: 'Conclua seu primeiro projeto',
        color: 'bg-purple-500',
        unlocked: completedProjects.length >= 1,
        progress: completedProjects.length,
        maxProgress: 1
      },
      {
        id: 'proponent',
        icon: Zap,
        name: 'Proponente',
        description: 'Envie 10 propostas',
        color: 'bg-yellow-500',
        unlocked: userProposals.length >= 10,
        progress: userProposals.length,
        maxProgress: 10
      },
      {
        id: 'professional',
        icon: Target,
        name: 'Profissional',
        description: 'Conclua 5 projetos',
        color: 'bg-orange-500',
        unlocked: completedProjects.length >= 5,
        progress: completedProjects.length,
        maxProgress: 5
      },
      {
        id: 'expert',
        icon: TrendingUp,
        name: 'Especialista',
        description: 'Conclua 20 projetos',
        color: 'bg-red-500',
        unlocked: completedProjects.length >= 20,
        progress: completedProjects.length,
        maxProgress: 20
      },
      {
        id: 'skills_master',
        icon: CheckCircle,
        name: 'Mestre das skills',
        description: 'Adicione 10 habilidades ao perfil',
        color: 'bg-indigo-500',
        unlocked: (profile?.skills?.length || 0) >= 10,
        progress: profile?.skills?.length || 0,
        maxProgress: 10
      },
      {
        id: 'verified',
        icon: Shield,
        name: 'Verificado',
        description: 'Conta de identidade verificada',
        color: 'bg-green-500',
        unlocked: Boolean(user?.isVerified)
      },
      {
        id: 'premium',
        icon: Crown,
        name: 'Premium',
        description: 'Plano premium ativo',
        color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        unlocked: Boolean(user?.isPremium)
      },
      {
        id: 'top_rated',
        icon: Crown,
        name: 'Top rated',
        description: 'Avaliação média a partir de 4,5 estrelas',
        color: 'bg-yellow-600',
        unlocked: (user?.rating || 0) >= 4.5
      },
      {
        id: 'popular',
        icon: Users,
        name: 'Popular',
        description: 'Destaque entre os mais contratados',
        color: 'bg-pink-500',
        unlocked: false
      }
    ];

    setBadges(allBadges);
  }, [user]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Meus Selos</h3>
        <span className="text-sm text-gray-500">
          {unlockedCount}/{totalCount} desbloqueados
        </span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progresso</span>
          <span className="text-99blue font-medium">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-99blue to-99blue-light rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div 
            key={badge.id}
            className={`relative group cursor-pointer ${
              badge.unlocked ? '' : 'opacity-50'
            }`}
            title={badge.description}
          >
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
              badge.unlocked 
                ? badge.color 
                : 'bg-gray-200'
            }`}>
              {badge.unlocked ? (
                <badge.icon className="w-7 h-7 text-white" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className={`text-xs text-center font-medium ${
              badge.unlocked ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {badge.name}
            </p>
            
            {/* Progress indicator */}
            {badge.progress !== undefined && badge.maxProgress && !badge.unlocked && (
              <div className="mt-1">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-99blue rounded-full"
                    style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400 mt-1">
                  {badge.progress}/{badge.maxProgress}
                </p>
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {badge.description}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start">
        <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Complete as metas para desbloquear selos exclusivos e ganhar pontos na plataforma!
        </p>
      </div>
    </div>
  );
}

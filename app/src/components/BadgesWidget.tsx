import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Award, Star, Zap, Shield, Crown, TrendingUp, Users, 
  CheckCircle, Clock, Target, Gift, Lock, Info, Medal, UserCheck, Megaphone, FileText, ThumbsUp
} from 'lucide-react';

interface Badge {
  id: string;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  unlocked: boolean;
}

import { calculateFreelancerProfileCompletion } from '../lib/profileCompletion';

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
    const profile = profileData ? JSON.parse(profileData) : {};

    // Merge user data with profile data for calculation
    const mergedUser = {
      ...user,
      bio: user.bio || profile.bio,
      skills: user.skills || profile.skills || [],
      hourlyRate: user.hourlyRate || profile.hourlyRate,
      phone: user.phone || profile.phone,
      location: user.location || profile.location,
      title: user.title || profile.title,
      // Ensure we pass portfolio/experiences if they exist in profile but not user
      portfolio: user.portfolio || profile.portfolioItems || [],
      experiences: user.experiences || profile.experiences || []
    };

    const completionResult = calculateFreelancerProfileCompletion(mergedUser as any);
    const completionScore = completionResult.score;

    // Determine unlocks based on real data (or mocks where data is missing)
    const isTop1 = (user.ranking || 0) === 1; // Assuming ranking field exists
    const isProfileComplete = completionScore >= 100;
    const hasFeedback = false; // Placeholder for now as we don't have feedback tracking yet
    const hasProposals = userProposals.length > 0;
    const isRecommended = (user.recommendations || 0) > 0;

    const allBadges: Badge[] = [
      {
        id: 'top_1',
        icon: Medal,
        name: 'Top 1',
        description: 'Ranking: 1',
        color: 'bg-orange-500',
        unlocked: isTop1
      },
      {
        id: 'profile_complete',
        icon: UserCheck,
        name: 'Perfil Completo',
        description: 'Completou o seu perfil e está pronto para usar o 99Freelas',
        color: 'bg-green-500',
        unlocked: isProfileComplete
      },
      {
        id: 'feedback',
        icon: Megaphone,
        name: 'Colaborador',
        description: 'Ajudou o 99Freelas com um feedback relevante',
        color: 'bg-pink-500',
        unlocked: hasFeedback
      },
      {
        id: 'proposals',
        icon: FileText,
        name: 'Experiente',
        description: 'Tem experiência no envio de propostas',
        color: 'bg-amber-600', // Brownish
        unlocked: hasProposals
      },
      {
        id: 'recommended',
        icon: ThumbsUp,
        name: 'Recomendado',
        description: 'Concluiu um projeto e foi recomendado',
        color: 'bg-blue-800', // Dark blue
        unlocked: isRecommended
      }
    ];

    setBadges(allBadges);
  }, [user]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Selos e Conquistas</h3>
        <span className="text-sm text-gray-500">
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Badges Grid */}
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => (
          <div 
            key={badge.id}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              badge.unlocked ? badge.color : 'bg-gray-200 grayscale'
            }`}
            title={badge.description}
          >
            <badge.icon className="w-6 h-6 text-white" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
              <p className="font-bold mb-0.5">{badge.name}</p>
              <p className="font-normal opacity-90">{badge.description}</p>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

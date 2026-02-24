import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, User, Briefcase, MessageSquare, Star, Users, Award, Gift, DollarSign, CheckCircle } from 'lucide-react';

interface Goal {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  link: string;
}

const GOAL_TEMPLATES_FREELANCER: Goal[] = [
  { id: 'complete_profile', icon: User, title: 'Perfil 100% completo', description: 'Finalize todas as informações do seu perfil', points: 50, completed: false, link: '/profile/edit' },
  { id: 'verify_identity', icon: CheckCircle, title: 'Conta verificada', description: 'Conclua a verificação de identidade', points: 80, completed: false, link: '/account?tab=verification' },
  { id: 'send_first_proposal', icon: MessageSquare, title: 'Primeira proposta', description: 'Envie sua primeira proposta', points: 60, completed: false, link: '/projects' },
  { id: 'send_10_proposals', icon: MessageSquare, title: 'Proponente', description: 'Envie 10 propostas na plataforma', points: 120, completed: false, link: '/projects' },
  { id: 'complete_first_project', icon: Award, title: 'Primeiro projeto', description: 'Conclua seu primeiro projeto', points: 120, completed: false, link: '/my-projects' },
  { id: 'complete_5_projects', icon: Briefcase, title: 'Profissional', description: 'Conclua 5 projetos no total', points: 180, completed: false, link: '/my-projects' },
  { id: 'complete_20_projects', icon: Star, title: 'Especialista', description: 'Conclua 20 projetos no total', points: 300, completed: false, link: '/my-projects' },
  { id: 'add_10_skills', icon: Users, title: 'Mestre das skills', description: 'Adicione 10 habilidades ao perfil', points: 150, completed: false, link: '/profile/edit' },
  { id: 'premium_member', icon: Gift, title: 'Assinante Premium', description: 'Ative o plano Premium', points: 200, completed: false, link: '/premium' },
];

const GOAL_TEMPLATES_CLIENT: Goal[] = [
  { id: 'complete_profile', icon: User, title: 'Perfil 100% completo', description: 'Preencha seus dados pessoais e de contato', points: 50, completed: false, link: '/profile/edit' },
  { id: 'publish_project', icon: Briefcase, title: 'Primeiro projeto publicado', description: 'Publique seu primeiro projeto na plataforma', points: 100, completed: false, link: '/project/new' },
  { id: 'hire_freelancer', icon: Users, title: 'Primeira contratação', description: 'Contrate um freelancer pela plataforma', points: 150, completed: false, link: '/my-projects' },
  { id: 'complete_payment', icon: DollarSign, title: 'Projeto concluído', description: 'Conclua pagamento de um projeto', points: 120, completed: false, link: '/payments' },
  { id: 'premium_member', icon: Gift, title: 'Conta Premium', description: 'Ative um plano Premium para ter mais benefícios', points: 200, completed: false, link: '/premium' },
];

function cloneGoalsTemplate(isClient: boolean): Goal[] {
  const templates = isClient ? GOAL_TEMPLATES_CLIENT : GOAL_TEMPLATES_FREELANCER;
  return templates.map((g) => ({ ...g }));
}

function safeParseArray<T = unknown>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function safeParseObject<T = Record<string, unknown>>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function isProfileComplete(profile: Record<string, unknown> | null, hasAvatar: boolean, isClient: boolean): boolean {
  if (!profile) return false;
  const phone = String(profile.phone || '').trim();
  const bio = String(profile.bio || '').trim();
  const stateUf = String(profile.stateUf || '').trim();
  const city = String(profile.city || '').trim();
  if (isClient) return Boolean(hasAvatar && phone && bio && stateUf && city);
  const title = String(profile.title || '').trim();
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  return Boolean(hasAvatar && phone && bio && stateUf && city && (title || skills.length > 0));
}

export default function GoalsWidget() {
  const { user } = useAuth();
  const isClient = user?.type === 'client';
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    const recomputeGoals = () => {
      const savedGoals = safeParseArray<Partial<Goal>>(localStorage.getItem(`goals_${user.id}`));
      const completedById = new Map<string, boolean>();
      savedGoals.forEach((g) => {
        if (typeof g?.id === 'string') completedById.set(g.id, Boolean(g.completed));
      });

      const profile = safeParseObject<Record<string, unknown>>(localStorage.getItem(`profile_${user.id}`));
      const projects = safeParseArray<{ clientId?: string; freelancerId?: string; status?: string }>(
        localStorage.getItem('meufreelas_projects')
      );
      const proposals = safeParseArray<{ freelancerId?: string }>(localStorage.getItem('meufreelas_proposals'));

      const hasProject = projects.some((p) => String(p.clientId) === String(user.id));
      const hasProposal = proposals.some((p) => String(p.freelancerId) === String(user.id));
      const completedProjects = projects.filter(
        (p) =>
          (String(p.clientId) === String(user.id) || String(p.freelancerId) === String(user.id)) &&
          String(p.status || '').toLowerCase() === 'completed'
      );
      const completedCount = completedProjects.length || Number(user.completedProjects || 0);
      const hasCompletedProject = completedCount > 0;

      const autoCompletedById: Record<string, boolean> = isClient
        ? {
            complete_profile: isProfileComplete(profile, Boolean(user.avatar), true),
            publish_project: hasProject,
            hire_freelancer: hasProposal || hasCompletedProject,
            complete_payment: hasCompletedProject,
            premium_member: Boolean(user.isPremium),
          }
        : {
            complete_profile: isProfileComplete(profile, Boolean(user.avatar), false),
            verify_identity: Boolean(user.isVerified),
            send_first_proposal: hasProposal,
            send_10_proposals: proposals.filter((p) => String(p.freelancerId) === String(user.id)).length >= 10,
            complete_first_project: completedCount >= 1,
            complete_5_projects: completedCount >= 5,
            complete_20_projects: completedCount >= 20,
            add_10_skills: (profile?.skills && Array.isArray(profile.skills) ? profile.skills.length : 0) >= 10,
            premium_member: Boolean(user.isPremium),
          };

      const nextGoals = cloneGoalsTemplate(isClient).map((goal) => {
        if (goal.id in autoCompletedById) {
          return { ...goal, completed: autoCompletedById[goal.id] };
        }
        return { ...goal, completed: completedById.get(goal.id) ?? false };
      });

      setGoals(nextGoals);
      localStorage.setItem(
        `goals_${user.id}`,
        JSON.stringify(nextGoals.map(({ icon: _icon, ...rest }) => rest))
      );
    };

    recomputeGoals();
    const onStorage = () => recomputeGoals();
    const onProfileUpdated = () => recomputeGoals();
    window.addEventListener('storage', onStorage);
    window.addEventListener('meufreelas:profile-updated', onProfileUpdated as EventListener);
    return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('meufreelas:profile-updated', onProfileUpdated as EventListener);
    };
  }, [user, isClient]);

  useEffect(() => {
    const completed = goals.filter(g => g.completed).length;
    setProgress(goals.length > 0 ? (completed / goals.length) * 100 : 0);
  }, [goals]);

  const totalPoints = goals.reduce((sum, g) => sum + (g.completed ? g.points : 0), 0);
  const maxPoints = goals.reduce((sum, g) => sum + g.points, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Minhas metas</h3>
        <span className="text-sm text-gray-500">
          {goals.filter(g => g.completed).length}/{goals.length} concluídas
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Metas concluídas ({Math.round(progress)}%)</span>
          <span className="text-99blue font-medium">{totalPoints}/{maxPoints} pts</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-99blue to-99blue-light rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => (
          <Link
            key={goal.id}
            to={goal.link}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              goal.completed 
                ? 'bg-green-50' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
              goal.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {goal.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <goal.icon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${goal.completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {goal.title}
              </p>
              <p className="text-xs text-gray-500">{goal.description}</p>
            </div>
            <span className={`text-sm font-medium ${goal.completed ? 'text-green-600' : 'text-gray-400'}`}>
              +{goal.points}
            </span>
          </Link>
        ))}
      </div>

      {/* Rewards Info */}
      {progress === 100 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Award className="w-6 h-6 text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">Parabéns!</p>
              <p className="text-sm text-yellow-700">Você completou todas as metas e ganhou {maxPoints} pontos!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

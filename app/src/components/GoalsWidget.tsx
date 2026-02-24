import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, User, Briefcase, MessageSquare, Star, Users, Award, Gift, DollarSign } from 'lucide-react';

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
  { id: 'complete_profile', icon: User, title: 'Completar perfil', description: 'Preencha todas as informações do seu perfil', points: 50, completed: false, link: '/profile/edit' },
  { id: 'publish_project', icon: Briefcase, title: 'Publicar projeto', description: 'Publique seu primeiro projeto', points: 100, completed: false, link: '/project/new' },
  { id: 'send_proposal', icon: MessageSquare, title: 'Enviar proposta', description: 'Envie sua primeira proposta', points: 50, completed: false, link: '/projects' },
  { id: 'receive_review', icon: Star, title: 'Receber avaliação', description: 'Receba sua primeira avaliação positiva', points: 100, completed: false, link: '/profile' },
  { id: 'invite_friend', icon: Users, title: 'Convidar amigo', description: 'Convide um amigo para a plataforma', points: 50, completed: false, link: '#' },
  { id: 'complete_project', icon: Award, title: 'Completar projeto', description: 'Complete seu primeiro projeto', points: 150, completed: false, link: '/my-projects' },
  { id: 'premium_member', icon: Gift, title: 'Tornar-se Premium', description: 'Assine o plano Premium', points: 200, completed: false, link: '/premium' },
];

const GOAL_TEMPLATES_CLIENT: Goal[] = [
  { id: 'complete_profile', icon: User, title: 'Completar perfil', description: 'Preencha seus dados pessoais', points: 50, completed: false, link: '/profile/edit' },
  { id: 'publish_project', icon: Briefcase, title: 'Publicar projeto', description: 'Publique seu primeiro projeto', points: 100, completed: false, link: '/project/new' },
  { id: 'hire_freelancer', icon: Users, title: 'Contratar freelancer', description: 'Aceite uma proposta e contrate', points: 150, completed: false, link: '/my-projects' },
  { id: 'complete_payment', icon: DollarSign, title: 'Concluir pagamento', description: 'Pague e conclua um projeto', points: 100, completed: false, link: '/payments' },
  { id: 'invite_friend', icon: Users, title: 'Convidar amigo', description: 'Convide um amigo para a plataforma', points: 50, completed: false, link: '#' },
  { id: 'premium_member', icon: Gift, title: 'Tornar-se Premium', description: 'Assine o plano Premium', points: 200, completed: false, link: '/premium' },
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
      const hasCompletedProject =
        Number(user.completedProjects || 0) > 0 ||
        projects.some(
          (p) =>
            (String(p.clientId) === String(user.id) || String(p.freelancerId) === String(user.id)) &&
            String(p.status || '').toLowerCase() === 'completed'
        );

      const autoCompletedById: Record<string, boolean> = isClient
        ? {
            complete_profile: isProfileComplete(profile, Boolean(user.avatar), true),
            publish_project: hasProject,
            hire_freelancer: hasProposal || hasCompletedProject,
            complete_payment: hasCompletedProject,
            invite_friend: completedById.get('invite_friend') ?? false,
            premium_member: Boolean(user.isPremium),
          }
        : {
            complete_profile: isProfileComplete(profile, Boolean(user.avatar), false),
            publish_project: hasProject,
            send_proposal: hasProposal,
            receive_review: Number(user.rating || 0) > 0,
            complete_project: hasCompletedProject,
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

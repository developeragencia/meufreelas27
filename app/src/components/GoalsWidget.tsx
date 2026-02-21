import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, User, Briefcase, MessageSquare, Star, Users, Award, Gift } from 'lucide-react';

interface Goal {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  link: string;
}

export default function GoalsWidget() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load or initialize goals
    const savedGoals = localStorage.getItem(`goals_${user.id}`);
    
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      const initialGoals: Goal[] = [
        {
          id: 'complete_profile',
          icon: User,
          title: 'Completar Perfil',
          description: 'Preencha todas as informações do seu perfil',
          points: 50,
          completed: false,
          link: '/profile/edit'
        },
        {
          id: 'publish_project',
          icon: Briefcase,
          title: 'Publicar Projeto',
          description: 'Publique seu primeiro projeto',
          points: 100,
          completed: false,
          link: '/project/new'
        },
        {
          id: 'send_proposal',
          icon: MessageSquare,
          title: 'Enviar Proposta',
          description: 'Envie sua primeira proposta',
          points: 50,
          completed: false,
          link: '/projects'
        },
        {
          id: 'receive_review',
          icon: Star,
          title: 'Receber Avaliação',
          description: 'Receba sua primeira avaliação positiva',
          points: 100,
          completed: false,
          link: '/profile'
        },
        {
          id: 'invite_friend',
          icon: Users,
          title: 'Convidar Amigo',
          description: 'Convide um amigo para a plataforma',
          points: 50,
          completed: false,
          link: '#'
        },
        {
          id: 'complete_project',
          icon: Award,
          title: 'Completar Projeto',
          description: 'Complete seu primeiro projeto',
          points: 150,
          completed: false,
          link: '/my-projects'
        },
        {
          id: 'premium_member',
          icon: Gift,
          title: 'Tornar-se Premium',
          description: 'Assine o plano Premium',
          points: 200,
          completed: false,
          link: '/premium'
        }
      ];
      
      // Check if profile is already complete
      const profileData = localStorage.getItem(`profile_${user.id}`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile.title && profile.bio && profile.skills?.length > 0) {
          initialGoals[0].completed = true;
        }
      }
      
      // Check if user has projects
      const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
      const userProjects = projects.filter((p: any) => p.clientId === user.id);
      if (userProjects.length > 0) {
        initialGoals[1].completed = true;
      }
      
      // Check if user has proposals
      const proposals = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
      const userProposals = proposals.filter((p: any) => p.freelancerId === user.id);
      if (userProposals.length > 0) {
        initialGoals[2].completed = true;
      }
      
      setGoals(initialGoals);
      localStorage.setItem(`goals_${user.id}`, JSON.stringify(initialGoals));
    }
  }, [user]);

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

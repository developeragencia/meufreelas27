import type { User } from '../contexts/AuthContext';

export type ProfileCompletionResult = {
  score: number;
  level: 'baixa' | 'média' | 'alta';
  nextSteps: string[];
};

export function calculateFreelancerProfileCompletion(user: User): ProfileCompletionResult {
  let score = 0;
  const nextSteps: string[] = [];

  if (user.avatar && user.avatar.trim()) score += 10;
  else nextSteps.push('Adicionar foto de perfil');

  if (user.bio && user.bio.trim().length >= 80) score += 15;
  else nextSteps.push('Completar bio profissional');

  if (Array.isArray(user.skills) && user.skills.length >= 5) score += 10;
  else nextSteps.push('Adicionar pelo menos 5 habilidades');

  if (user.hourlyRate && user.hourlyRate.trim()) score += 10;
  else nextSteps.push('Definir valor por hora');

  if (user.phone && user.phone.trim()) score += 10;
  else nextSteps.push('Confirmar telefone');

  if (user.location && user.location.trim()) score += 5;
  else nextSteps.push('Informar localização');

  if (user.isVerified) score += 20;
  else nextSteps.push('Verificar conta/documento');

  if ((user.completedProjects || 0) > 0 || (user.rating || 0) > 0) score += 20;
  else nextSteps.push('Concluir primeiros projetos para ganhar avaliação');

  const clamped = Math.max(0, Math.min(100, score));
  const level: 'baixa' | 'média' | 'alta' = clamped < 60 ? 'baixa' : clamped < 90 ? 'média' : 'alta';

  return { score: clamped, level, nextSteps: nextSteps.slice(0, 3) };
}

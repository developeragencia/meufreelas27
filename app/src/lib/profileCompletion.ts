import type { User } from '../contexts/AuthContext';

export type ProfileCompletionResult = {
  score: number;
  level: 'baixa' | 'média' | 'alta';
  nextSteps: string[];
};

export function calculateFreelancerProfileCompletion(user: User): ProfileCompletionResult {
  let score = 0;
  const nextSteps: string[] = [];

  // Foto de perfil (15%)
  if (user.avatar && user.avatar.trim() && !user.avatar.includes('ui-avatars.com')) score += 15;
  else nextSteps.push('Adicionar foto de perfil personalizada');

  // Título profissional (15%)
  if (user.title && user.title.trim()) score += 15;
  else nextSteps.push('Adicionar título profissional');

  // Bio/Sobre (20%)
  if (user.bio && user.bio.trim().length >= 50) score += 20;
  else nextSteps.push('Escrever uma bio detalhada (min. 50 caracteres)');

  // Habilidades (15%)
  if (Array.isArray(user.skills) && user.skills.length >= 3) score += 15;
  else nextSteps.push('Adicionar pelo menos 3 habilidades');

  // Valor por hora (10%)
  if (user.hourlyRate && user.hourlyRate.trim() && user.hourlyRate !== '0' && user.hourlyRate !== 'R$ 0') score += 10;
  else nextSteps.push('Definir valor por hora');

  // Localização (10%)
  if (user.location && user.location.trim()) score += 10;
  else nextSteps.push('Informar localização');

  // Portfólio ou Experiência (15%) - Flexibilidade
  // Como a interface User pode não ter esses campos aninhados detalhados, verificamos se existem no objeto
  // ou se o usuário marcou como tendo experiência.
  // Assumindo que user pode ter array de portfolio ou experience se vier do localStorage/API completo
  const hasPortfolio = (user as any).portfolio?.length > 0;
  const hasExperience = (user as any).experiences?.length > 0 || (user as any).education?.length > 0;
  
  if (hasPortfolio || hasExperience) score += 15;
  else nextSteps.push('Adicionar item ao portfólio ou experiência');

  const clamped = Math.max(0, Math.min(100, score));
  const level: 'baixa' | 'média' | 'alta' = clamped < 60 ? 'baixa' : clamped < 90 ? 'média' : 'alta';

  return { score: clamped, level, nextSteps: nextSteps.slice(0, 3) };
}

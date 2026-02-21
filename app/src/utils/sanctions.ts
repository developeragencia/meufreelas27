// Sistema de Sanções - Gerencia violações, penalizações e banimentos

import type { ViolationType } from './contentModerator';

export type SanctionType = 'none' | 'violation' | 'penalty' | 'ban';
export type SanctionStatus = 'active' | 'expired' | 'lifted';

export interface Sanction {
  id: string;
  userId: string;
  userName: string;
  userType: 'freelancer' | 'client';
  type: SanctionType;
  violations: ViolationType[];
  reason: string;
  description: string;
  createdAt: string;
  expiresAt?: string;
  liftedAt?: string;
  liftedBy?: string;
  status: SanctionStatus;
  evidence?: string[];
  appealStatus?: 'pending' | 'approved' | 'rejected';
  appealReason?: string;
  appealDate?: string;
}

export interface UserSanctionStatus {
  userId: string;
  currentSanction: SanctionType;
  violationCount: number;
  penaltyCount: number;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: string;
  proposalRankPenalty: boolean;
  canPostProjects: boolean;
  canSendProposals: boolean;
  canUseChat: boolean;
  warningBadge: boolean;
}

const SANCTION_DURATION = {
  violation: 0, // Permanente (badge de alerta)
  penalty: 30 * 24 * 60 * 60 * 1000, // 30 dias
  ban: Infinity // Permanente
};

/**
 * Aplica uma sanção ao usuário
 */
export function applySanction(
  userId: string,
  userName: string,
  userType: 'freelancer' | 'client',
  violations: ViolationType[],
  evidence?: string[]
): Sanction {
  const sanctionType = calculateSanctionType(violations);
  const now = new Date();
  
  const sanction: Sanction = {
    id: `sanction_${Date.now()}_${userId}`,
    userId,
    userName,
    userType,
    type: sanctionType,
    violations,
    reason: getSanctionReason(sanctionType),
    description: getSanctionDescription(violations),
    createdAt: now.toISOString(),
    status: 'active',
    evidence
  };
  
  // Define expiração para penalidades
  if (sanctionType === 'penalty') {
    const expiresAt = new Date(now.getTime() + SANCTION_DURATION.penalty);
    sanction.expiresAt = expiresAt.toISOString();
  }
  
  // Salva a sanção no localStorage
  saveSanction(sanction);
  
  // Atualiza o status do usuário
  updateUserSanctionStatus(userId, sanction);
  
  return sanction;
}

/**
 * Calcula o tipo de sanção baseado nas violações
 */
function calculateSanctionType(violations: ViolationType[]): SanctionType {
  const highSeverity = ['PHONE_NUMBER', 'EMAIL', 'URL', 'PAYMENT_REQUEST', 'OFFENSIVE_CONTENT'];
  const highCount = violations.filter(v => highSeverity.includes(v)).length;
  
  // Busca histórico de sanções do usuário
  const userSanctions = getUserSanctions(violations[0] || '');
  const violationHistory = userSanctions.filter(s => s.type === 'violation').length;
  const penaltyHistory = userSanctions.filter(s => s.type === 'penalty').length;
  
  // Regras de sanção
  if (highCount >= 3 || penaltyHistory >= 2) return 'ban';
  if (highCount >= 2 || violationHistory >= 3) return 'penalty';
  if (highCount >= 1 || violations.length >= 2) return 'violation';
  
  return 'none';
}

/**
 * Retorna a razão da sanção
 */
function getSanctionReason(type: SanctionType): string {
  switch (type) {
    case 'violation':
      return 'Violação dos Termos de Uso';
    case 'penalty':
      return 'Penalização por múltiplas violações';
    case 'ban':
      return 'Banimento por violação grave ou reincidência';
    default:
      return '';
  }
}

/**
 * Retorna a descrição da sanção
 */
function getSanctionDescription(violations: ViolationType[]): string {
  const descriptions: Record<ViolationType, string> = {
    PHONE_NUMBER: 'Compartilhamento de número de telefone',
    EMAIL: 'Compartilhamento de email',
    URL: 'Compartilhamento de link externo',
    SOCIAL_MEDIA: 'Compartilhamento de rede social',
    PAYMENT_REQUEST: 'Solicitação de pagamento fora da plataforma',
    OFFENSIVE_CONTENT: 'Conteúdo ofensivo ou inadequado',
    COMMISSION_MENTION: 'Referência às taxas da plataforma'
  };
  
  return violations.map(v => descriptions[v]).join(', ');
}

/**
 * Salva a sanção no localStorage
 */
function saveSanction(sanction: Sanction): void {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  sanctions.push(sanction);
  localStorage.setItem('meufreelas_sanctions', JSON.stringify(sanctions));
}

/**
 * Atualiza o status de sanção do usuário
 */
function updateUserSanctionStatus(userId: string, sanction: Sanction): void {
  const statuses = JSON.parse(localStorage.getItem('meufreelas_user_sanctions') || '{}');
  
  const status: UserSanctionStatus = {
    userId,
    currentSanction: sanction.type,
    violationCount: (statuses[userId]?.violationCount || 0) + (sanction.type === 'violation' ? 1 : 0),
    penaltyCount: (statuses[userId]?.penaltyCount || 0) + (sanction.type === 'penalty' ? 1 : 0),
    isBanned: sanction.type === 'ban',
    banReason: sanction.type === 'ban' ? sanction.reason : undefined,
    banExpiresAt: sanction.expiresAt,
    proposalRankPenalty: sanction.type === 'violation' || sanction.type === 'penalty',
    canPostProjects: sanction.type !== 'ban' && sanction.type !== 'penalty',
    canSendProposals: sanction.type !== 'ban',
    canUseChat: sanction.type !== 'ban',
    warningBadge: sanction.type === 'violation' || sanction.type === 'penalty'
  };
  
  statuses[userId] = status;
  localStorage.setItem('meufreelas_user_sanctions', JSON.stringify(statuses));
}

/**
 * Retorna o status de sanção de um usuário
 */
export function getUserSanctionStatus(userId: string): UserSanctionStatus | null {
  const statuses = JSON.parse(localStorage.getItem('meufreelas_user_sanctions') || '{}');
  return statuses[userId] || null;
}

/**
 * Retorna todas as sanções de um usuário
 */
export function getUserSanctions(userId: string): Sanction[] {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  return sanctions.filter((s: Sanction) => s.userId === userId);
}

/**
 * Retorna todas as sanções ativas
 */
export function getActiveSanctions(): Sanction[] {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  return sanctions.filter((s: Sanction) => s.status === 'active');
}

/**
 * Retorna todas as sanções
 */
export function getAllSanctions(): Sanction[] {
  return JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
}

/**
 * Remove uma sanção (lift)
 */
export function liftSanction(sanctionId: string, liftedBy: string): boolean {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  const index = sanctions.findIndex((s: Sanction) => s.id === sanctionId);
  
  if (index === -1) return false;
  
  sanctions[index].status = 'lifted';
  sanctions[index].liftedAt = new Date().toISOString();
  sanctions[index].liftedBy = liftedBy;
  
  localStorage.setItem('meufreelas_sanctions', JSON.stringify(sanctions));
  
  // Atualiza o status do usuário
  const userId = sanctions[index].userId;
  updateUserStatusAfterLift(userId);
  
  return true;
}

/**
 * Atualiza o status do usuário após remoção de sanção
 */
function updateUserStatusAfterLift(userId: string): void {
  const statuses = JSON.parse(localStorage.getItem('meufreelas_user_sanctions') || '{}');
  const userSanctions = getUserSanctions(userId);
  const activeSanctions = userSanctions.filter(s => s.status === 'active');
  
  if (activeSanctions.length === 0) {
    statuses[userId] = {
      ...statuses[userId],
      currentSanction: 'none',
      isBanned: false,
      proposalRankPenalty: false,
      canPostProjects: true,
      canSendProposals: true,
      canUseChat: true,
      warningBadge: false
    };
    localStorage.setItem('meufreelas_user_sanctions', JSON.stringify(statuses));
  }
}

/**
 * Verifica se um usuário pode enviar propostas
 */
export function canSendProposals(userId: string): boolean {
  const status = getUserSanctionStatus(userId);
  if (!status) return true;
  return status.canSendProposals;
}

/**
 * Verifica se um usuário pode publicar projetos
 */
export function canPostProjects(userId: string): boolean {
  const status = getUserSanctionStatus(userId);
  if (!status) return true;
  return status.canPostProjects;
}

/**
 * Verifica se um usuário está banido
 */
export function isUserBanned(userId: string): boolean {
  const status = getUserSanctionStatus(userId);
  if (!status) return false;
  return status.isBanned;
}

/**
 * Retorna a mensagem de banimento
 */
export function getBanMessage(userId: string): string {
  const status = getUserSanctionStatus(userId);
  if (!status || !status.isBanned) return '';
  
  return `Sua conta foi banida por violação dos Termos de Uso. 
    
Motivo: ${status.banReason || 'Violação grave das regras da plataforma'}

Se você acredita que houve um erro, entre em contato com o suporte.`;
}

/**
 * Retorna a mensagem de aviso de violação
 */
export function getViolationWarningMessage(): string {
  return `⚠️ AVISO DE VIOLAÇÃO

Você violou os Termos de Uso da plataforma. Como consequência:

• Um ícone de alerta foi adicionado ao seu perfil
• Suas propostas serão rebaixadas nas listas
• Novas violações podem resultar em penalização ou banimento

Leia atentamente as regras para evitar novos problemas.`;
}

/**
 * Retorna a mensagem de penalização
 */
export function getPenaltyMessage(expiresAt?: string): string {
  const expiration = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : 'em breve';
  
  return `🚫 PENALIZAÇÃO

Sua conta foi penalizada por violações repetidas das regras.

Restrições ativas:
• Não pode enviar propostas
• Não pode publicar projetos
• Não pode usar o chat

A penalização expira em: ${expiration}

Se você acredita que houve um erro, entre em contato com o suporte.`;
}

/**
 * Processa apelação de sanção
 */
export function appealSanction(sanctionId: string, reason: string): boolean {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  const index = sanctions.findIndex((s: Sanction) => s.id === sanctionId);
  
  if (index === -1) return false;
  
  sanctions[index].appealStatus = 'pending';
  sanctions[index].appealReason = reason;
  sanctions[index].appealDate = new Date().toISOString();
  
  localStorage.setItem('meufreelas_sanctions', JSON.stringify(sanctions));
  
  return true;
}

/**
 * Aprova ou rejeita apelação
 */
export function processAppeal(sanctionId: string, approved: boolean): boolean {
  const sanctions = JSON.parse(localStorage.getItem('meufreelas_sanctions') || '[]');
  const index = sanctions.findIndex((s: Sanction) => s.id === sanctionId);
  
  if (index === -1) return false;
  
  sanctions[index].appealStatus = approved ? 'approved' : 'rejected';
  
  if (approved) {
    sanctions[index].status = 'lifted';
    sanctions[index].liftedAt = new Date().toISOString();
    updateUserStatusAfterLift(sanctions[index].userId);
  }
  
  localStorage.setItem('meufreelas_sanctions', JSON.stringify(sanctions));
  
  return true;
}

export default {
  applySanction,
  getUserSanctionStatus,
  getUserSanctions,
  getActiveSanctions,
  getAllSanctions,
  liftSanction,
  canSendProposals,
  canPostProjects,
  isUserBanned,
  getBanMessage,
  getViolationWarningMessage,
  getPenaltyMessage,
  appealSanction,
  processAppeal
};

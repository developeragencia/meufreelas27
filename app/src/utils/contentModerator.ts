// Content Moderator - Detecta conteúdo proibido em mensagens

export interface ModerationResult {
  hasViolation: boolean;
  violations: ViolationType[];
  sanitizedContent: string;
  warningMessage?: string;
}

export type ViolationType = 
  | 'PHONE_NUMBER' 
  | 'EMAIL' 
  | 'URL' 
  | 'SOCIAL_MEDIA'
  | 'PAYMENT_REQUEST'
  | 'OFFENSIVE_CONTENT'
  | 'COMMISSION_MENTION';

interface ViolationPattern {
  type: ViolationType;
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high';
  message: string;
}

const violationPatterns: ViolationPattern[] = [
  {
    type: 'PHONE_NUMBER',
    patterns: [
      // Formatos brasileiros
      /\(?\d{2}\)?[\s\-]?\d{4,5}[\s\-]?\d{4}/g,
      /\+?55[\s\-]?\d{2}[\s\-]?\d{4,5}[\s\-]?\d{4}/g,
      // Formatos internacionais
      /\+\d{1,3}[\s\-]?\d{1,4}[\s\-]?\d{4,10}/g,
      // Formatos escritos
      /\b(whatsapp|whats|zap|telefone|fone|celular|contato)[\s:]*\d/gi,
    ],
    severity: 'high',
    message: 'Não é permitido compartilhar números de telefone. Use o chat da plataforma para comunicação.'
  },
  {
    type: 'EMAIL',
    patterns: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /\b(email|e-mail|contato)[\s:]*[a-zA-Z0-9]/gi,
    ],
    severity: 'high',
    message: 'Não é permitido compartilhar endereços de email. Use o chat da plataforma para comunicação.'
  },
  {
    type: 'URL',
    patterns: [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /\b[\w-]+\.(com|br|net|org|io|co|app|dev|site|online)\b/gi,
      /\b(link|site|website|portfolio|portfólio)[\s:]*http/gi,
    ],
    severity: 'high',
    message: 'Não é permitido compartilhar links externos. Adicione seu portfólio no seu perfil.'
  },
  {
    type: 'SOCIAL_MEDIA',
    patterns: [
      /\b(facebook|instagram|twitter|linkedin|github|gitlab|behance|dribbble)[\s:]*[\w@.]/gi,
      /@[\w.]+/g,
      /\b(sigam?|siga|follow|add)[\s:]*@/gi,
    ],
    severity: 'medium',
    message: 'Não é permitido compartilhar redes sociais. Adicione-as no seu perfil.'
  },
  {
    type: 'PAYMENT_REQUEST',
    patterns: [
      /\b(pagamento|pagar|pague|transferência|transferencia|pix|ted|doc|depósito|deposito)\s+(fora|externo|direto|pessoal|particular)/gi,
      /\b(pagamento|pagar)\s+(via|por|no|na)\s+(fora|externo)/gi,
      /\b(50%|metade|entrada)\s+(antes|primeiro|início)/gi,
      /\b(resto|restante)\s+(depois|após|fora)/gi,
    ],
    severity: 'high',
    message: 'Não é permitido solicitar pagamentos fora da plataforma. Use o sistema de garantia de pagamento.'
  },
  {
    type: 'COMMISSION_MENTION',
    patterns: [
      /\b(comissão|comissao|taxa\s+da\s+plataforma|taxa\s+do\s+meufreelas)\b/gi,
      /\b(a\s+plataforma\s+(cobra|tira|retira))\b/gi,
      /\d+%\s+(de\s+)?(taxa|comissão|comissao)/gi,
    ],
    severity: 'medium',
    message: 'Não faça referência às taxas da plataforma. O valor da sua proposta já deve considerar a comissão.'
  },
  {
    type: 'OFFENSIVE_CONTENT',
    patterns: [
      /\b(idiota|burro|estúpido|estupido|imbecil|retardado|lixo|merda|porra|caralho|puta|puto|fdp|filho\s+da\s+puta|vai\s+se\s+foder|vsf|otário|otario)\b/gi,
      /\b(golpe|enganado|enganar|fraude|fraudar|mentiroso|mentira)\b/gi,
    ],
    severity: 'high',
    message: 'Não é permitido enviar conteúdo ofensivo ou inadequado.'
  }
];

// Palavras substitutas para mascarar conteúdo proibido
const maskPatterns: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\(?\d{2}\)?[\s\-]?\d{4,5}[\s\-]?\d{4}/g, replacement: '[TELEFONE REMOVIDO]' },
  { pattern: /\+?55[\s\-]?\d{2}[\s\-]?\d{4,5}[\s\-]?\d{4}/g, replacement: '[TELEFONE REMOVIDO]' },
  { pattern: /\+\d{1,3}[\s\-]?\d{1,4}[\s\-]?\d{4,10}/g, replacement: '[TELEFONE REMOVIDO]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL REMOVIDO]' },
  { pattern: /https?:\/\/[^\s]+/gi, replacement: '[LINK REMOVIDO]' },
  { pattern: /www\.[^\s]+/gi, replacement: '[LINK REMOVIDO]' },
];

/**
 * Analisa o conteúdo e detecta violações
 */
export function moderateContent(content: string): ModerationResult {
  const violations: ViolationType[] = [];
  const detectedPatterns = new Set<ViolationType>();
  
  // Verifica cada padrão de violação
  for (const violation of violationPatterns) {
    for (const pattern of violation.patterns) {
      if (pattern.test(content)) {
        detectedPatterns.add(violation.type);
        if (!violations.includes(violation.type)) {
          violations.push(violation.type);
        }
        break;
      }
    }
  }
  
  // Sanitiza o conteúdo (remove/mascara informações proibidas)
  let sanitizedContent = content;
  for (const mask of maskPatterns) {
    sanitizedContent = sanitizedContent.replace(mask.pattern, mask.replacement);
  }
  
  // Gera mensagem de aviso
  let warningMessage: string | undefined;
  if (violations.length > 0) {
    const primaryViolation = violationPatterns.find(v => v.type === violations[0]);
    if (primaryViolation) {
      warningMessage = primaryViolation.message;
    }
  }
  
  return {
    hasViolation: violations.length > 0,
    violations,
    sanitizedContent,
    warningMessage
  };
}

/**
 * Verifica se o conteúdo contém violações graves
 */
export function hasSevereViolation(content: string): boolean {
  const result = moderateContent(content);
  return result.violations.some(v => {
    const pattern = violationPatterns.find(p => p.type === v);
    return pattern?.severity === 'high';
  });
}

/**
 * Sanitiza conteúdo de projetos (remove contatos e valores)
 */
export function sanitizeProjectContent(content: string): string {
  let sanitized = content;
  
  // Remove telefones
  sanitized = sanitized.replace(/\(?\d{2}\)?[\s\-]?\d{4,5}[\s\-]?\d{4}/g, '');
  sanitized = sanitized.replace(/\+?55[\s\-]?\d{2}[\s\-]?\d{4,5}[\s\-]?\d{4}/g, '');
  
  // Remove emails
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  
  // Remove URLs
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '');
  sanitized = sanitized.replace(/www\.[^\s]+/gi, '');
  
  // Remove valores monetários específicos (mantém faixas)
  sanitized = sanitized.replace(/R?\$?\s*\d{1,3}(\.\d{3})*,\d{2}/g, '[VALOR REMOVIDO]');
  
  return sanitized;
}

/**
 * Calcula o nível de sanção baseado nas violações
 */
export function calculateSanctionLevel(violations: ViolationType[]): 'none' | 'violation' | 'penalty' | 'ban' {
  const highSeverityCount = violations.filter(v => {
    const pattern = violationPatterns.find(p => p.type === v);
    return pattern?.severity === 'high';
  }).length;
  
  const mediumSeverityCount = violations.filter(v => {
    const pattern = violationPatterns.find(p => p.type === v);
    return pattern?.severity === 'medium';
  }).length;
  
  // Regras de sanção
  if (highSeverityCount >= 3) return 'ban';
  if (highSeverityCount >= 2) return 'penalty';
  if (highSeverityCount >= 1 || mediumSeverityCount >= 3) return 'violation';
  if (mediumSeverityCount >= 1) return 'violation';
  
  return 'none';
}

export default {
  moderateContent,
  hasSevereViolation,
  sanitizeProjectContent,
  calculateSanctionLevel
};

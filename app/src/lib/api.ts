const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : '';

export function hasApi(): boolean {
  return !!API_URL;
}

export type ApiAuthResponse = {
  ok: boolean;
  user?: Record<string, unknown>;
  error?: string;
  code?: string;
  requiresActivation?: boolean;
  message?: string;
};

export async function apiAuth(action: 'register' | 'login', body: Record<string, string>): Promise<ApiAuthResponse> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/auth.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
      credentials: 'omit',
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
    } catch {
      return { ok: false, error: res.ok ? 'Resposta inválida do servidor' : `Erro ${res.status}` };
    }
    if (!res.ok) return { ok: false, error: (data?.error as string) || 'Erro na requisição', code: data?.code as string | undefined };
    return {
      ok: !!data.ok,
      user: data.user as Record<string, unknown> | undefined,
      error: data.error as string | undefined,
      code: data.code as string | undefined,
      requiresActivation: data.requiresActivation as boolean | undefined,
      message: data.message as string | undefined,
    };
  } catch (e) {
    console.error('apiAuth', e);
    return { ok: false, error: 'Falha de conexão com o servidor' };
  }
}

export async function apiActivate(token: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/activate.php?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { credentials: 'omit' });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, error: data.error, message: data.message };
  } catch (e) {
    console.error('apiActivate', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiResendActivation(email: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/auth.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_activation', email: email.trim() }),
      credentials: 'omit',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, error: data.error as string | undefined, message: data.message as string | undefined };
  } catch (e) {
    console.error('apiResendActivation', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiForgotPassword(email: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/forgot_password.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
      credentials: 'omit',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, error: data.error as string | undefined, message: data.message as string | undefined };
  } catch (e) {
    console.error('apiForgotPassword', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiResetPassword(token: string, password: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/reset_password.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
      credentials: 'omit',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, error: data.error as string | undefined, message: data.message as string | undefined };
  } catch (e) {
    console.error('apiResetPassword', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiConversation = {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantTitle?: string;
  lastMessage: string;
  lastMessageTime?: string | null;
  unreadCount: number;
  online?: boolean;
  projectTitle?: string;
  projectValue?: string;
};

export type ApiChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
};

async function callMessagesApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  const url = `${API_URL.replace(/\/$/, '')}/messages.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data?.error as string) || `Erro ${res.status}` };
  return data as Record<string, unknown>;
}

export async function apiListConversations(userId: string): Promise<{ ok: boolean; conversations?: ApiConversation[]; error?: string }> {
  try {
    const data = await callMessagesApi({ action: 'list_conversations', userId });
    return {
      ok: !!data.ok,
      conversations: (data.conversations as ApiConversation[] | undefined) || [],
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiListConversations', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiGetMessages(
  userId: string,
  conversationId: string
): Promise<{ ok: boolean; messages?: ApiChatMessage[]; error?: string }> {
  try {
    const data = await callMessagesApi({ action: 'get_messages', userId, conversationId });
    return {
      ok: !!data.ok,
      messages: (data.messages as ApiChatMessage[] | undefined) || [],
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiGetMessages', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiSendMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<{ ok: boolean; message?: ApiChatMessage; error?: string }> {
  try {
    const data = await callMessagesApi({ action: 'send_message', userId, conversationId, content });
    return {
      ok: !!data.ok,
      message: data.message as ApiChatMessage | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiSendMessage', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiEnsureConversation(
  userId: string,
  participantId: string,
  projectId?: string
): Promise<{ ok: boolean; conversationId?: string; error?: string }> {
  try {
    const data = await callMessagesApi({ action: 'ensure_conversation', userId, participantId, projectId });
    return {
      ok: !!data.ok,
      conversationId: data.conversationId as string | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiEnsureConversation', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type CreateProjectPayload = {
  userId: string;
  title: string;
  description: string;
  category: string;
  budget?: string;
  skills?: string[];
  experienceLevel?: string;
  proposalDays?: string;
  visibility?: 'public' | 'private';
};

export async function apiCreateProject(
  payload: CreateProjectPayload
): Promise<{ ok: boolean; project?: Record<string, unknown>; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/projects.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_project', ...payload }),
      credentials: 'omit',
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: !!data.ok,
      project: data.project as Record<string, unknown> | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiCreateProject', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiProject = {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  description: string;
  budget: string;
  category: string;
  skills?: string[];
  experienceLevel?: string;
  proposalDays?: string;
  visibility?: 'public' | 'private';
  status: 'Aberto' | 'Em andamento' | 'Concluído' | 'Cancelado';
  proposals: number;
  createdAt: string;
  updatedAt?: string;
};

async function callProjectsApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  const url = `${API_URL.replace(/\/$/, '')}/projects.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data?.error as string) || `Erro ${res.status}` };
  return data as Record<string, unknown>;
}

export async function apiListProjects(payload: {
  clientId?: string;
  status?: string;
  search?: string;
  category?: string;
  sortBy?: 'recent' | 'relevance';
}): Promise<{ ok: boolean; projects?: ApiProject[]; error?: string }> {
  try {
    const data = await callProjectsApi({ action: 'list_projects', ...payload });
    return {
      ok: !!data.ok,
      projects: (data.projects as ApiProject[] | undefined) || [],
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiListProjects', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiDeleteProject(projectId: string, userId: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  try {
    const data = await callProjectsApi({ action: 'delete_project', projectId, userId });
    return { ok: !!data.ok, error: data.error as string | undefined, message: data.message as string | undefined };
  } catch (e) {
    console.error('apiDeleteProject', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiGetProject(projectId: string): Promise<{ ok: boolean; project?: ApiProject; error?: string }> {
  try {
    const data = await callProjectsApi({ action: 'get_project', projectId });
    return {
      ok: !!data.ok,
      project: data.project as ApiProject | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiGetProject', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiProposal = {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  value: string;
  deliveryDays: string;
  message: string;
  status: 'Pendente' | 'Aceita' | 'Recusada';
  createdAt: string;
};

async function callProposalsApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  const url = `${API_URL.replace(/\/$/, '')}/proposals.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data?.error as string) || `Erro ${res.status}` };
  return data as Record<string, unknown>;
}

export async function apiCreateProposal(payload: {
  projectId: string;
  freelancerId: string;
  amount: string;
  deliveryDays: string;
  message: string;
}): Promise<{ ok: boolean; proposal?: ApiProposal; error?: string }> {
  try {
    const data = await callProposalsApi({ action: 'create_proposal', ...payload });
    return { ok: !!data.ok, proposal: data.proposal as ApiProposal | undefined, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiCreateProposal', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiListProposals(payload: {
  projectId?: string;
  freelancerId?: string;
  clientId?: string;
  status?: string;
}): Promise<{ ok: boolean; proposals?: ApiProposal[]; error?: string }> {
  try {
    const data = await callProposalsApi({ action: 'list_proposals', ...payload });
    return { ok: !!data.ok, proposals: (data.proposals as ApiProposal[] | undefined) || [], error: data.error as string | undefined };
  } catch (e) {
    console.error('apiListProposals', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

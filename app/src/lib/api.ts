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

export async function apiAuth(
  action: 'register' | 'login' | 'switch_account_type' | 'create_secondary_account',
  body: Record<string, string>
): Promise<ApiAuthResponse> {
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

export async function apiSwitchAccountType(payload: {
  userId: string;
  targetType: 'freelancer' | 'client';
}): Promise<ApiAuthResponse> {
  return apiAuth('switch_account_type', payload);
}

export async function apiCreateSecondaryAccount(payload: {
  userId: string;
  accountType: 'freelancer' | 'client';
}): Promise<ApiAuthResponse> {
  return apiAuth('create_secondary_account', payload);
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

export type ApiFreelancerPublic = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  bio: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  completedProjects: number;
  recommendations: number;
  memberSince: string;
  ranking?: number;
  isPremium: boolean;
  isPro: boolean;
  planTier: 'free' | 'pro' | 'premium';
  hasPhoto: boolean;
  profileCompletion: number;
  rankingScore: number;
  isVerified?: boolean;
  registeredAt?: string;
  city?: string;
  state?: string;
  country?: string;
  isOnline?: boolean;
  type?: string;
};

export async function apiListFreelancersPublic(): Promise<{ ok: boolean; freelancers?: ApiFreelancerPublic[]; total?: number; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/freelancers.php?action=list`;
    const res = await fetch(url, { credentials: 'omit' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data?.error as string) || `Erro ${res.status}` };
    return {
      ok: !!data.ok,
      freelancers: (data.freelancers as ApiFreelancerPublic[] | undefined) || [],
      total: typeof data.total === 'number' ? data.total : undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiListFreelancersPublic', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiGetFreelancerPublicByUsername(username: string): Promise<{ ok: boolean; freelancer?: ApiFreelancerPublic; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/freelancers.php?action=get&username=${encodeURIComponent(username)}`;
    const res = await fetch(url, { credentials: 'omit' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data?.error as string) || `Erro ${res.status}` };
    return {
      ok: !!data.ok,
      freelancer: data.freelancer as ApiFreelancerPublic | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiGetFreelancerPublicByUsername', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiConversation = {
  id: string;
  projectId?: string;
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
  projectStatus?: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating?: number;
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

export async function apiUpdateProposalStatus(payload: {
  proposalId: string;
  clientId: string;
  status: 'Aceita' | 'Recusada' | 'Pendente';
}): Promise<{ ok: boolean; error?: string; message?: string }> {
  try {
    const data = await callProposalsApi({ action: 'update_proposal_status', ...payload });
    return {
      ok: !!data.ok,
      error: data.error as string | undefined,
      message: data.message as string | undefined,
    };
  } catch (e) {
    console.error('apiUpdateProposalStatus', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiNotification = {
  id: string;
  type: 'project' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  description: string;
  date: string;
  isRead: boolean;
  link?: string;
};

async function callNotificationsApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  const url = `${API_URL.replace(/\/$/, '')}/notifications.php`;
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

export async function apiListNotifications(userId: string): Promise<{ ok: boolean; notifications?: ApiNotification[]; error?: string }> {
  try {
    const data = await callNotificationsApi({ action: 'list_notifications', userId });
    return { ok: !!data.ok, notifications: (data.notifications as ApiNotification[] | undefined) || [], error: data.error as string | undefined };
  } catch (e) {
    console.error('apiListNotifications', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiMarkNotificationRead(userId: string, notificationId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callNotificationsApi({ action: 'mark_read', userId, notificationId });
    return { ok: !!data.ok, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiMarkNotificationRead', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiMarkAllNotificationsRead(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callNotificationsApi({ action: 'mark_all_read', userId });
    return { ok: !!data.ok, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiMarkAllNotificationsRead', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiDeleteNotification(userId: string, notificationId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callNotificationsApi({ action: 'delete_notification', userId, notificationId });
    return { ok: !!data.ok, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiDeleteNotification', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiClearNotifications(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callNotificationsApi({ action: 'clear_notifications', userId });
    return { ok: !!data.ok, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiClearNotifications', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiPaymentTransaction = {
  id: string;
  description: string;
  amount: string;
  type: 'entrada' | 'saida';
  rawStatus?: 'pending' | 'processing' | 'held' | 'released' | 'refunded' | string;
  status: 'Concluído' | 'Pendente' | 'Em processamento';
  date: string;
  project?: string;
};

export type ApiPaymentSummary = {
  balance: string;
  pending: string;
  monthReceived: string;
};

async function callPaymentsApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  const url = `${API_URL.replace(/\/$/, '')}/payments.php`;
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

export async function apiListPayments(payload: {
  userId: string;
  userType: 'client' | 'freelancer';
}): Promise<{ ok: boolean; summary?: ApiPaymentSummary; transactions?: ApiPaymentTransaction[]; error?: string }> {
  try {
    const data = await callPaymentsApi({ action: 'list_payments', ...payload });
    return {
      ok: !!data.ok,
      summary: data.summary as ApiPaymentSummary | undefined,
      transactions: (data.transactions as ApiPaymentTransaction[] | undefined) || [],
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiListPayments', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiReleasePayment(payload: {
  paymentId: string;
  clientId: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const data = await callPaymentsApi({ action: 'release_payment', ...payload });
    return { ok: !!data.ok, message: data.message as string | undefined, error: data.error as string | undefined };
  } catch (e) {
    console.error('apiReleasePayment', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiCreateCheckout(payload: {
  proposalId: string;
  clientId: string;
  provider: 'stripe' | 'mercadopago';
  successUrl?: string;
  cancelUrl?: string;
  amount?: number;
  title?: string;
}): Promise<{ ok: boolean; checkoutUrl?: string; paymentId?: string; error?: string }> {
  try {
    const data = await callPaymentsApi({ action: 'create_checkout', ...payload });
    return {
      ok: !!data.ok,
      checkoutUrl: data.checkoutUrl as string | undefined,
      paymentId: data.paymentId as string | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiCreateCheckout', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiUpdateProfile(userId: string, data: any): Promise<{ ok: boolean; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/update_profile.php`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
      credentials: 'omit',
    });
    const result = await res.json().catch(() => ({}));
    return { ok: !!result.ok, error: result.error as string | undefined };
  } catch (e) {
    console.error('apiUpdateProfile', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export type ApiReview = {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  projectTitle: string;
};

export async function apiListReviews(userId: string): Promise<{ ok: boolean; reviews?: ApiReview[]; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const url = `${API_URL.replace(/\/$/, '')}/reviews.php?userId=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { credentials: 'omit' });
    const data = await res.json().catch(() => ({}));
    return {
      ok: !!data.ok,
      reviews: (data.reviews as ApiReview[] | undefined) || [],
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiListReviews', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

export async function apiCreateSubscriptionCheckout(payload: {
  userId: string;
  plan: 'pro' | 'premium';
  cycle: 'monthly' | 'yearly';
  provider: 'stripe' | 'mercadopago';
}): Promise<{ ok: boolean; checkoutUrl?: string; error?: string }> {
  try {
    const data = await callPaymentsApi({ action: 'create_subscription_checkout', ...payload });
    return {
      ok: !!data.ok,
      checkoutUrl: data.checkoutUrl as string | undefined,
      error: data.error as string | undefined,
    };
  } catch (e) {
    console.error('apiCreateSubscriptionCheckout', e);
    return { ok: false, error: 'Falha de conexão' };
  }
}

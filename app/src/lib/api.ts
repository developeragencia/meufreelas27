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

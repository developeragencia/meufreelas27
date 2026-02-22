const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : '';

export function hasApi(): boolean {
  return !!API_URL;
}

export async function apiAuth(action: 'register' | 'login', body: Record<string, string>): Promise<{ ok: boolean; user?: Record<string, unknown>; error?: string }> {
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
    let data: { ok?: boolean; user?: Record<string, unknown>; error?: string } = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, error: res.ok ? 'Resposta inválida do servidor' : `Erro ${res.status}` };
    }
    if (!res.ok) return { ok: false, error: data?.error || 'Erro na requisição' };
    return { ok: !!data.ok, user: data.user, error: data.error };
  } catch (e) {
    console.error('apiAuth', e);
    return { ok: false, error: 'Falha de conexão com o servidor' };
  }
}

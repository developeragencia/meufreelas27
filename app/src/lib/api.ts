const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : '';

export function hasApi(): boolean {
  return !!API_URL;
}

export async function apiAuth(action: 'register' | 'login', body: Record<string, string>): Promise<{ ok: boolean; user?: Record<string, unknown>; error?: string }> {
  if (!API_URL) return { ok: false, error: 'API não configurada' };
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Erro na requisição' };
    return data;
  } catch (e) {
    console.error('apiAuth', e);
    return { ok: false, error: 'Falha de conexão com o servidor' };
  }
}

import { useEffect, useRef, useState } from 'react';

const SITE_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY
  ? String(import.meta.env.VITE_TURNSTILE_SITE_KEY).trim()
  : '';

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function TurnstileWidget({ onVerify, onExpire, theme = 'light', className = '' }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire ?? (() => {}));
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire ?? (() => {});

  useEffect(() => {
    if (!SITE_KEY) return;

    const waitForScript = (): Promise<void> => {
      if (window.turnstile) return Promise.resolve();
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (window.turnstile) {
            clearInterval(check);
            resolve();
          }
        }, 80);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 15000);
      });
    };

    const loadScript = (): Promise<void> => {
      if (window.turnstile) return Promise.resolve();
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existing) return waitForScript();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Turnstile script failed'));
        document.head.appendChild(script);
      });
    };

    let cancelled = false;
    loadScript()
      .then(() => waitForScript())
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme,
            callback: (token) => onVerifyRef.current(token || ''),
            'expired-callback': () => {
              onVerifyRef.current('');
              onExpireRef.current();
            },
          });
          setStatus('ready');
        } catch (e) {
          console.warn('Turnstile render error', e);
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [SITE_KEY, theme]);

  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-700 mb-2">Verificação de segurança</p>
      {status === 'failed' ? (
        <div className="min-h-[70px] flex items-center justify-center bg-amber-50 rounded-lg border border-amber-200 p-3">
          <p className="text-sm text-amber-700 text-center">
            Não foi possível carregar a verificação. Atualize a página ou desative bloqueadores e tente novamente.
          </p>
        </div>
      ) : (
        <div className="min-h-[70px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-2">
          {status === 'loading' && (
            <p className="text-sm text-gray-500 mb-2">Carregando verificação...</p>
          )}
          <div ref={containerRef} className="min-w-[300px] min-h-[65px]" />
        </div>
      )}
    </div>
  );
}

export function hasTurnstile(): boolean {
  return SITE_KEY.length > 0;
}

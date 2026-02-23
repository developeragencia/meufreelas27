import { useEffect, useRef, useState } from 'react';

const SITE_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY
  ? String(import.meta.env.VITE_TURNSTILE_SITE_KEY).trim()
  : '';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
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
  const [ready, setReady] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire ?? (() => {});

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    const run = () => {
      if (!window.turnstile || !containerRef.current) return;
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token) => onVerifyRef.current(token),
          'expired-callback': () => {
            onVerifyRef.current('');
            onExpireRef.current();
          },
        });
        setReady(true);
      } catch (e) {
        console.warn('Turnstile render', e);
      }
    };

    if (window.turnstile) {
      run();
      return () => {
        if (widgetIdRef.current != null && window.turnstile?.remove) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
        }
      };
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.onload = run;
    document.head.appendChild(script);
    return () => {
      if (widgetIdRef.current != null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [SITE_KEY, theme]);

  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <div ref={containerRef} className="flex justify-center min-h-[65px]" />
      {!ready && (
        <p className="text-sm text-gray-500 mt-1">Carregando verificação de segurança...</p>
      )}
    </div>
  );
}

export function hasTurnstile(): boolean {
  return SITE_KEY.length > 0;
}

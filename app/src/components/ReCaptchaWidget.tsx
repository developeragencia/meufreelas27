// @ts-ignore
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  onExpire?: () => void;
  className?: string;
}

export function hasReCaptcha(): boolean {
  // Fallback para a chave fornecida se a variável de ambiente não estiver definida
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdAHncsAAAAAC85_0xpXPNlnMjcjUgNF9f1Gsa1';
  return !!siteKey && siteKey.length > 0;
}

export function ReCaptchaWidget({ onVerify, onExpire, className = '' }: ReCaptchaWidgetProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdAHncsAAAAAC85_0xpXPNlnMjcjUgNF9f1Gsa1';

  if (!siteKey) {
    console.warn('VITE_RECAPTCHA_SITE_KEY not set. ReCaptcha disabled.');
    return null;
  }

  return (
    <div className={className}>
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={onVerify}
        onExpired={onExpire}
      />
    </div>
  );
}

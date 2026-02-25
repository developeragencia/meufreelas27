import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  onExpire?: () => void;
  className?: string;
}

export function hasReCaptcha(): boolean {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  return !!siteKey && siteKey.length > 0;
}

export function ReCaptchaWidget({ onVerify, onExpire, className = '' }: ReCaptchaWidgetProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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
